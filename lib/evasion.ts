// Prolice AI contact-evasion detection (Big/MVP stage, extended 2026-10-02).
//
// All communication must stay inside the Prolice AI inbox until the paid
// contact unlock. These checks catch direct-contact attempts in inbox
// messages, including obfuscated variants:
//
// - plain emails: john@gmail.com
// - "at / dot" word obfuscation: "john at gmail dot com"
// - bracketed separators: "john [at] gmail [dot] com",
//   "john(at)gmail(dot)com", "john{at}gmail{dot}com"
// - dot variants: "john at gmail d0t com", "john a.t gmail d.o.t com"
// - host-only forms (no @ at all): "johnsmith, gmail dot com",
//   "gmail: johnsmith", "johnsmith at gmaildotcom"
// - unicode lookalikes: fullwidth ＠ ． and digits (NFKC-normalized),
//   zero-width characters stripped
// - interleaved separators in trigger words: "g.m.a.i.l", "g-m-a-i-l",
//   "g m a i l", "w.h.a.t.s.a.p.p" (single-letter runs only, so normal
//   sentences never match)
// - leetspeak in trigger words: "gmai1", "yah00", "h0tmail", "whats4pp"
// - phone digit runs: 555-123-4567, (555) 123 4567, 5 5 5 1 2 3 4 5 6 7
// - spelled-out numbers: "five five five one two three four"
// - mixed words+digits: "two 4 zero 643 0840", "2four0six...",
//   "two-four-zero", "plus one 240 643 0840", "(two four zero) 643-0840"
// - payment links: paypal.me/name, cash.app/$name, venmo/zelle mentions
// - crypto wallet addresses: bitcoin (1…/3…/bc1…), ethereum (0x…),
//   solana / base58 (32–44 base58 chars)
// - payment-detail phrases: "my paypal", "wallet address", "send crypto"…
//
// Detection returns machine-readable reason codes so the UI can show a
// clear warning and the Violation log can record exactly what tripped.

export type EvasionFinding = {
  flagged: boolean;
  reasons: string[]; // e.g. ["email", "phone-mixed", "channel-interleaved"]
};

const EMAIL_RE = /[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,}/i;

// "john at gmail dot com" / "john doe at example dot co dot uk"
const OBFUSCATED_EMAIL_RE =
  /\b[\w.+-]{1,64}\s+at\s+[\w-]{1,63}(?:\s+dot\s+[\w-]{1,63})+\b/i;

// "john @ gmail . com" with stray spaces around the symbols
const SPACED_EMAIL_RE =
  /[A-Z0-9._%+-]{1,64}\s*@\s*[A-Z0-9.-]{1,253}\s*\.\s*[A-Z]{2,}/i;

// Bracketed / paren / brace separators and dot-variants:
// "john [at] gmail [dot] com", "john(at)gmail(dot)com",
// "john{at}gmail{dot}com", "john at gmail d0t com",
// "john a.t gmail d.o.t com". Plain "at"/"dot" words are covered by
// OBFUSCATED_EMAIL_RE above; "email-bracketed" only fires when the
// match actually contains a bracket, paren, brace, d0t, or dotted form.
const BRACKETED_AT = String.raw`(?:\[at\]|\(at\)|\{at\}|a\.[.\s]*t)`;
const BRACKETED_DOT = String.raw`(?:\[dot\]|\(dot\)|\{dot\}|d0t|d\.[.\s]*o[.\s]*t)`;
const BRACKETED_EMAIL_RE = new RegExp(
  String.raw`[\w.+-]{1,64}\s*(?:@|${BRACKETED_AT}|\bat\b)\s*[\w-]{1,63}` +
    String.raw`(?:\s*(?:\.|${BRACKETED_DOT}|\bdot\b)\s*[\w-]{1,63})+`,
  "i"
);
// Marker that proves the matched address used a non-plain separator.
const BRACKETED_MARKER_RE = /[[({]|d0t|a\s*\.\s*t|d\s*\.\s*o/i;

// Email hosts people reach for when dodging the @ sign.
const EMAIL_HOSTS = [
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "live",
  "icloud",
  "protonmail",
  "proton",
  "aol",
  "gmx",
  "zoho",
  "yandex",
];
const HOST_ALT = `(?:${EMAIL_HOSTS.join("|")})`;
const TLDS = "com|net|org|io|co|edu|gov|me|us|uk|ca|au|de|fr|biz|info";

// Host/TLD split with no @ at all:
// "my email is johnsmith, gmail dot com" (comma form — the comma keeps
// false positives low).
const HOST_ONLY_COMMA_RE = new RegExp(
  String.raw`[\w.+-]{1,64}\s*,\s*${HOST_ALT}\s+dot\s+(?:${TLDS})\b`,
  "i"
);
// "gmail: johnsmith" — the token after the colon must be a single
// username-like token so "gmail: it's great" does not match.
const HOST_COLON_RE = new RegExp(
  String.raw`${HOST_ALT}\s*[:=]\s*[\w.+-]{1,64}(?=$|[\s.,;:!?])`,
  "i"
);
// "johnsmith at gmaildotcom" / "johnsmith at gmailcom" — the local part
// may not itself be "at" (that belongs to the plain obfuscated form).
const AT_HOSTGLUED_RE = new RegExp(
  String.raw`(?!at\b)[\w.+-]{1,64}\s+at\s+${HOST_ALT}(?:dot)?(?:${TLDS})\b`,
  "i"
);

// 7+ digits with optional separators between them (catches
// 555-123-4567, (555) 123 4567, 5 5 5 1 2 3 4 5 6 7, 555.123.4567).
const DIGIT_RUN_RE = /(?:\+?\d[\s\-().]*){7,}/;

// Payment links: paypal.me/name, cash.app/$name, venmo / zelle mentions,
// buy-me-a-coffee / ko-fi pages.
const PAYMENT_LINK_RE =
  /\b(paypal\.me|cash\.app|venmo|zelle(pay)?|buymeacoffee|ko-?fi\.com)\b/i;

// Crypto wallet addresses:
// - Bitcoin: 1…, 3…, bc1…
// - Ethereum: 0x + 40 hex chars
// - Solana / generic base58: 32–44 base58 chars (no 0/O/I/l)
const BTC_RE = /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,59}\b/;
const ETH_RE = /\b0x[a-fA-F0-9]{40}\b/;
const SOL_RE = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;

// Phrases that signal payment details are about to be (or were) shared.
const PAYMENT_PHRASES = [
  "my paypal",
  "my cashapp",
  "my cash app",
  "my venmo",
  "my zelle",
  "wallet address",
  "my wallet",
  "crypto wallet",
  "bitcoin address",
  "my btc",
  "usdt address",
  "send crypto",
  "pay in crypto",
  "pay me in crypto",
  "payment link",
  "pay me at",
];

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
  double: "00",
  triple: "000",
  plus: "", // country-code marker: "plus one" == "+1"
};

// A "number token" is a digit run or a number word bounded by non-letters
// (so "tone" never yields "one", but "two4zero" yields two/4/zero).
const NUMWORD_SRC =
  "zero|oh|o|one|two|to|too|three|four|for|five|six|seven|eight|ate|nine|double|triple|plus";
const NUM_TOKEN = String.raw`(?:\d+|(?<![a-z])(?:${NUMWORD_SRC})(?![a-z]))`;
// Runs of 2+ number tokens joined by light separators:
// "two 4 zero 643 0840", "2four0six4three0eight40", "plus one 240 643 0840",
// "(two four zero) 643-0840", "two-four-zero-six…".
const MIXED_RUN_RE = new RegExp(
  String.raw`\+?(?:${NUM_TOKEN}[\s\-./()]*){2,}`,
  "gi"
);
const NUM_TOKEN_RE = new RegExp(NUM_TOKEN, "gi");

// Trigger words for interleaved-separator and leetspeak detection.
const EMAIL_KEYWORDS = [
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "live",
  "icloud",
  "protonmail",
  "proton",
  "aol",
];
const CHANNEL_KEYWORDS = [
  "whatsapp",
  "telegram",
  "signal",
  "messenger",
  "instagram",
  "facebook",
  "snapchat",
];
// Runs of SINGLE letters joined by separators: "g.m.a.i.l", "g-m-a-i-l",
// "g m a i l", "w.h.a.t.s.a.p.p". Requiring single letters (not whole
// words) is what keeps normal sentences safe — "going mad about
// interesting llamas" can never match.
const SINGLE_LETTER_RUN_RE =
  /(?:(?<![a-z])[a-z](?![a-z])[\s.\-*/_|·•:;]+)+(?<![a-z])[a-z](?![a-z])/gi;
const RUN_SEP_RE = /[\s.\-*/_|·•:;]+/g;

// Leetspeak normalization (single-char → single-char, so string indices
// stay aligned with the original text).
function deleet(text: string): string {
  return text
    .replace(/1/g, "l")
    .replace(/0/g, "o")
    .replace(/4/g, "a")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a");
}

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
  // NFKC folds fullwidth lookalikes (＠ → @, ． → ., ０-９ → 0-9);
  // zero-width characters are stripped outright.
  const text = (body ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");

  if (EMAIL_RE.test(text)) reasons.push("email");

  // Strip plain emails first so the obfuscated checks don't double-report
  // the same address; still report the plain "email" reason above.
  const withoutEmails = text.replace(new RegExp(EMAIL_RE.source, "gi"), " ");

  if (OBFUSCATED_EMAIL_RE.test(withoutEmails)) reasons.push("email-obfuscated");
  if (SPACED_EMAIL_RE.test(withoutEmails)) reasons.push("email-spaced");

  const bracketed = withoutEmails.match(BRACKETED_EMAIL_RE);
  if (bracketed && BRACKETED_MARKER_RE.test(bracketed[0])) {
    reasons.push("email-bracketed");
  }

  if (
    HOST_ONLY_COMMA_RE.test(withoutEmails) ||
    HOST_COLON_RE.test(withoutEmails) ||
    AT_HOSTGLUED_RE.test(withoutEmails)
  ) {
    reasons.push("email-host-only");
  }

  // Interleaved separators in trigger words ("g.m.a.i.l",
  // "w h a t s a p p") — single-letter runs joined back and compared
  // against the keyword lists.
  const runs = withoutEmails.match(SINGLE_LETTER_RUN_RE) ?? [];
  for (const run of runs) {
    const joined = run.replace(RUN_SEP_RE, "").toLowerCase();
    if (EMAIL_KEYWORDS.includes(joined)) {
      if (!reasons.includes("email-interleaved")) reasons.push("email-interleaved");
    } else if (CHANNEL_KEYWORDS.includes(joined)) {
      if (!reasons.includes("channel-interleaved")) reasons.push("channel-interleaved");
    }
  }

  // Leetspeak in trigger words ("gmai1", "yah00", "whats4pp"). A keyword
  // only counts when the matched span in the ORIGINAL text actually
  // contained a digit or @ — plain "gmail" in "I use gmail" must not flag.
  const lowered = withoutEmails.toLowerCase();
  const leet = deleet(lowered);
  if (leet !== lowered) {
    const kwRe = new RegExp(
      `\\b(${[...EMAIL_KEYWORDS, ...CHANNEL_KEYWORDS].join("|")})\\b`,
      "gi"
    );
    let m: RegExpExecArray | null;
    while ((m = kwRe.exec(leet)) !== null) {
      const rawSlice = lowered.slice(m.index, m.index + m[0].length);
      if (!/[0-9@]/.test(rawSlice)) continue;
      const kw = m[1].toLowerCase();
      if (EMAIL_KEYWORDS.includes(kw)) {
        if (!reasons.includes("email-interleaved")) reasons.push("email-interleaved");
      } else {
        if (!reasons.includes("channel-interleaved")) reasons.push("channel-interleaved");
      }
      break;
    }
  }

  // Payment links (paypal.me, cash.app, venmo, zelle…) — payment details
  // by themselves.
  if (PAYMENT_LINK_RE.test(withoutEmails)) reasons.push("payment-link");

  // Crypto wallet addresses (bitcoin, ethereum, solana/base58).
  if (
    BTC_RE.test(withoutEmails) ||
    ETH_RE.test(withoutEmails) ||
    SOL_RE.test(withoutEmails)
  ) {
    reasons.push("wallet-address");
  }

  // Payment-detail phrases ("my paypal", "wallet address", "send crypto"…).
  const loweredPhrases = withoutEmails.toLowerCase();
  for (const phrase of PAYMENT_PHRASES) {
    if (loweredPhrases.includes(phrase)) {
      reasons.push("payment-phrase");
      break;
    }
  }

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

  // Mixed words+digits: token runs like "two 4 zero 643 0840" or
  // "2four0six…" map to 7+ digits. Only counts when the run genuinely
  // mixes word tokens and digit tokens (pure runs are covered above).
  for (const run of withoutEmails.match(MIXED_RUN_RE) ?? []) {
    const tokens = run.match(NUM_TOKEN_RE) ?? [];
    let digits = "";
    let hasWord = false;
    let hasDigit = false;
    for (const t of tokens) {
      if (/^\d+$/.test(t)) {
        digits += t;
        hasDigit = true;
      } else {
        digits += NUMBER_WORDS[t.toLowerCase()] ?? "";
        hasWord = true;
      }
    }
    if (digits.length >= 7 && hasWord && hasDigit) {
      reasons.push("phone-mixed");
      break;
    }
  }

  // Contact-intent phrases only count when they appear near an actual
  // payload, EXCEPT whatsapp/telegram which are off-platform channels by
  // themselves.
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
  if (reasons.includes("payment-link")) bits.push("a payment link");
  if (reasons.includes("wallet-address")) bits.push("a wallet address");
  if (reasons.includes("payment-phrase")) bits.push("payment details");
  if (
    reasons.includes("off-platform-channel") ||
    reasons.includes("channel-interleaved")
  ) {
    bits.push("an off-platform channel");
  }
  const what = bits.length > 0 ? bits.join(" or ") : "contact information";
  return (
    `Heads up: your message looks like it contains ${what}. ` +
    `Contact details and payment details don't belong in the chat — ` +
    `sharing them here can get your account blocked.`
  );
}
