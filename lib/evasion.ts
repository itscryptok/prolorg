// AiProlice contact-evasion detection (Big/MVP stage).
//
// All communication must stay inside the AiProlice inbox until the paid
// contact unlock. These checks catch direct-contact attempts in inbox
// messages, including obfuscated variants:
//
// - plain emails: name@example.com
// - obfuscated emails: "name at gmail dot com", "name @ gmail . com"
// - phone numbers: 555-123-4567, (555) 123 4567, +1 5551234567
// - spaced-out digits: "5 5 5 1 2 3 4 5 6 7"
// - spelled-out numbers: "five five five one two three four"
//
// Detection returns machine-readable reason codes so the UI can show a
// clear warning and the Violation log can record exactly what tripped.

export type EvasionFinding = {
  flagged: boolean;
  reasons: string[]; // e.g. ["email", "phone-spaced"]
};

const EMAIL_RE = /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,}/i;

// "john at gmail dot com" / "john doe at example dot co dot uk"
const OBFUSCATED_EMAIL_RE =
  /\b[\w.+-]{1,64}\s+at\s+[\w-]{1,63}(?:\s+dot\s+[\w-]{1,63})+\b/i;

// "john @ gmail . com" with stray spaces around the symbols
const SPACED_EMAIL_RE =
  /[A-Z0-9._%+-]{1,64}\s*@\s*[A-Z0-9.-]{1,253}\s*\.\s*[A-Z]{2,}/i;

// 7+ digits with optional separators between them (catches
// 555-123-4567, (555) 123 4567, 5 5 5 1 2 3 4 5 6 7, 555.123.4567).
const DIGIT_RUN_RE = /(?:\+?\d[\s\-().]*){7,}/;

const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  oh: "0",
  o: "0",
  one: "1",
  two: "2",
  to: "2",
  too: "2",
  three: "3",
  four: "4",
  for: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  ate: "8",
  nine: "9",
};

const CONTACT_PHRASES = [
  "call me",
  "text me",
  "whatsapp",
  "telegram",
  "signal me",
  "my number",
  "my phone",
  "my email",
  "my e-mail",
  "reach me",
  "contact me",
  "add me on",
  "find me on",
  "dm me on",
];

export function detectContactEvasion(body: string): EvasionFinding {
  const reasons: string[] = [];
  const text = body ?? "";

  if (EMAIL_RE.test(text)) reasons.push("email");

  // Strip plain emails first so the obfuscated checks don't double-report
  // the same address; still report the plain "email" reason above.
  const withoutEmails = text.replace(new RegExp(EMAIL_RE.source, "gi"), " ");

  if (OBFUSCATED_EMAIL_RE.test(withoutEmails)) reasons.push("email-obfuscated");
  if (SPACED_EMAIL_RE.test(withoutEmails)) reasons.push("email-spaced");

  // Digit runs: require at least 7 actual digits (a bare "$500" or
  // "chapter 3" must not trip it). Also ignore runs that are clearly
  // prices/amounts right after a $ sign when the digit count is small —
  // the 7-digit floor already handles that.
  const digitRuns = withoutEmails.match(new RegExp(DIGIT_RUN_RE.source, "g")) ?? [];
  for (const run of digitRuns) {
    const digits = run.replace(/\D/g, "");
    if (digits.length >= 7) {
      reasons.push(/[\s\-().]/.test(run.replace(/^\+/, "")) ? "phone-spaced" : "phone");
      break;
    }
  }

  // Spelled-out numbers: map word runs like "five five five one two"
  // to digits; 7+ mapped digits in a row is a phone number.
  const words = withoutEmails.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let spelledDigits = "";
  let maxRun = 0;
  for (const w of words) {
    const d = NUMBER_WORDS[w];
    if (d !== undefined) {
      spelledDigits += d;
    } else {
      maxRun = Math.max(maxRun, spelledDigits.length);
      spelledDigits = "";
    }
  }
  maxRun = Math.max(maxRun, spelledDigits.length);
  if (maxRun >= 7) reasons.push("phone-spelled-out");

  // Contact-intent phrases only count when they appear near an actual
  // payload, EXCEPT whatsapp/telegram which are off-platform channels by
  // themselves.
  const lowered = withoutEmails.toLowerCase();
  const hasPayload = reasons.length > 0;
  const mentionsOffPlatformChannel = /whatsapp|telegram|signal/i.test(lowered);
  if (mentionsOffPlatformChannel && !reasons.includes("off-platform-channel")) {
    reasons.push("off-platform-channel");
  }
  if (hasPayload) {
    for (const phrase of CONTACT_PHRASES) {
      if (lowered.includes(phrase) && !reasons.includes("contact-phrase")) {
        reasons.push("contact-phrase");
        break;
      }
    }
  }

  return { flagged: reasons.length > 0, reasons: [...new Set(reasons)] };
}

// Human-readable warning shown in the inbox when a message is flagged.
export function evasionWarning(reasons: string[]): string {
  const bits: string[] = [];
  if (reasons.some((r) => r.startsWith("email"))) bits.push("an email address");
  if (reasons.some((r) => r.startsWith("phone"))) bits.push("a phone number");
  if (reasons.includes("off-platform-channel")) bits.push("an off-platform channel");
  const what = bits.length > 0 ? bits.join(" or ") : "contact information";
  return (
    `Heads up: your message looks like it contains ${what}. ` +
    `Contact details stay hidden until the paid contact unlock — ` +
    `sharing them here can get your account blocked.`
  );
}
