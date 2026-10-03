"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AVAILABILITY_OPTIONS } from "@/lib/experts";
import CaptureField from "@/components/CaptureField";

const input = "join-input";

type Status = { ok: boolean; message: string } | null;

const STEPS = ["About you", "Skills & rates", "Availability & media", "Sample work", "Review"] as const;

const SAMPLE_COUNT = 3;

const REVIEW_LABELS: Record<string, string> = {
  name: "Full name",
  specialty: "Specialty",
  headline: "Headline",
  bio: "Bio",
  skills: "Skills",
  languages: "Languages",
  hourlyRate: "Hourly rate (USD)",
  projectRate: "Project rate from (USD)",
  yearsExperience: "Years of experience",
  availability: "Availability",
  city: "City",
  country: "Country",
};

// AI pro onboarding wizard: creates a live (APPROVED) profile instantly — no
// manual review (Yemi 2026-10-02).
// links it to an AI pro account. No website/email fields — contact lockdown.
// AI pros can attach a profile photo and an intro video (played in /watch).
// All steps stay mounted (hidden) so staged media survives step changes.
export default function JoinForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<[string, string][]>([]);
  // Bumped after a successful submit so captured media resets with the form.
  const [formKey, setFormKey] = useState(0);

  const formRef = useRef<HTMLFormElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  function validateStep(i: number): boolean {
    const el = stepRefs.current[i];
    if (!el) return true;
    const fields = el.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea"
    );
    for (const f of fields) {
      if (f.getAttribute("aria-hidden") === "true") continue;
      if (!f.checkValidity()) {
        f.reportValidity();
        return false;
      }
    }
    return true;
  }

  function snapshotReview() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const rows: [string, string][] = [];
    for (const [key, label] of Object.entries(REVIEW_LABELS)) {
      const v = (fd.get(key) as string | null)?.trim();
      if (v) rows.push([label, v]);
    }
    const photo = (fd.get("photo") as File | null)?.size ? "Attached" : "—";
    const video = (fd.get("video") as File | null)?.size ? "Attached" : "—";
    rows.push(["Profile photo", photo], ["Intro video", video]);
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const t = (fd.get(`sample${i}_title`) as string | null)?.trim();
      if (t) {
        const hasImg = (fd.get(`sample${i}_image`) as File | null)?.size ? " + image" : "";
        rows.push([`Sample work ${i + 1}`, `${t}${hasImg}`]);
      }
    }
    setReview(rows);
  }

  function goTo(i: number) {
    setStep(i);
    setStatus(null);
    requestAnimationFrame(() => headingRefs.current[i]?.focus());
  }

  function next() {
    if (!validateStep(step)) return;
    const i = Math.min(step + 1, STEPS.length - 1);
    if (i === STEPS.length - 1) snapshotReview();
    goTo(i);
  }

  function back() {
    goTo(Math.max(step - 1, 0));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/experts", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setStatus({
        ok: true,
        message:
          "You're live — your profile is in the directory now.",
      });
      (e.target as HTMLFormElement).reset();
      setFormKey((k) => k + 1);
      goTo(0);
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} className="join-form" onSubmit={onSubmit}>
      <ol className="join-steps" aria-label="Application progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? "current" : i < step ? "done" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span className="join-step-num" aria-hidden="true">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {/* Step 1 — About you */}
      <div ref={(el) => { stepRefs.current[0] = el; }} hidden={step !== 0}>
        <h2 ref={(el) => { headingRefs.current[0] = el; }} tabIndex={-1} className="join-step-title">
          About you
        </h2>
        <div className="join-grid">
          <label className={input}>
            <span>Full name *</span>
            <input name="name" required maxLength={80} placeholder="Ada Lovelace" autoComplete="name" />
          </label>
          <label className={input}>
            <span>Specialty *</span>
            <input name="specialty" required maxLength={80} placeholder="e.g. Forensic analysis, AI tutoring, market research" autoComplete="off" />
          </label>
        </div>

        <label className={input}>
          <span>Headline *</span>
          <input name="headline" required maxLength={140} placeholder="e.g. Forensic data analyst — I turn messy evidence into clear answers" />
        </label>

        <label className={input}>
          <span>Bio *</span>
          <textarea name="bio" required rows={5} maxLength={4000}
            placeholder="Who you are, what you do with AI, and the outcomes clients get." />
        </label>
      </div>

      {/* Step 2 — Skills & rates */}
      <div ref={(el) => { stepRefs.current[1] = el; }} hidden={step !== 1}>
        <h2 ref={(el) => { headingRefs.current[1] = el; }} tabIndex={-1} className="join-step-title">
          Skills &amp; rates
        </h2>
        <div className="join-grid">
          <label className={input}>
            <span>Skills (comma-separated)</span>
            <input name="skills" placeholder="Python, prompt engineering, data forensics" />
          </label>
          <label className={input}>
            <span>Languages (comma-separated)</span>
            <input name="languages" placeholder="English, French" />
          </label>
        </div>

        <div className="join-grid-3">
          <label className={input}>
            <span>Hourly rate (USD)</span>
            <input name="hourlyRate" type="number" min={0} step={1} placeholder="45" inputMode="numeric" />
          </label>
          <label className={input}>
            <span>Project rate from (USD)</span>
            <input name="projectRate" type="number" min={0} step={1} placeholder="350" inputMode="numeric" />
          </label>
          <label className={input}>
            <span>Years of experience</span>
            <input name="yearsExperience" type="number" min={0} max={80} step={1} placeholder="6" inputMode="numeric" />
          </label>
        </div>
      </div>

      {/* Step 3 — Availability & media */}
      <div ref={(el) => { stepRefs.current[2] = el; }} hidden={step !== 2}>
        <h2 ref={(el) => { headingRefs.current[2] = el; }} tabIndex={-1} className="join-step-title">
          Availability &amp; media
        </h2>
        <div className="join-grid">
          <label className={input}>
            <span>Availability</span>
            <select name="availability" defaultValue="">
              <option value="">Prefer not to say</option>
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <div className="join-grid-2">
            <label className={input}>
              <span>City</span>
              <input name="city" maxLength={80} placeholder="Dallas" autoComplete="address-level2" />
            </label>
            <label className={input}>
              <span>Country</span>
              <input name="country" maxLength={80} placeholder="United States" autoComplete="country-name" />
            </label>
          </div>
        </div>

        <div className="join-grid">
          <div className={input}>
            <CaptureField
              key={`photo-${formKey}`}
              name="photo"
              label="Profile photo"
              hint="Square works best. Take one with your camera or upload a file. Max 5 MB."
              accept="image/*"
            />
          </div>
          <div className={input}>
            <CaptureField
              key={`video-${formKey}`}
              name="video"
              label="Intro video"
              hint="Short clip introducing yourself — plays in the Watch feed. Record up to 60 seconds or upload. Max 25 MB."
              accept="video/*"
            />
          </div>
        </div>
      </div>

      {/* Step 4 — Sample work */}
      <div ref={(el) => { stepRefs.current[3] = el; }} hidden={step !== 3}>
        <h2 ref={(el) => { headingRefs.current[3] = el; }} tabIndex={-1} className="join-step-title">
          Sample work
        </h2>
        <p className="join-step-lead">
          Show up to three examples of your work. A title and short
          description are all it takes — an image is optional.
        </p>
        {Array.from({ length: SAMPLE_COUNT }, (_, i) => (
          <fieldset key={i} className="join-sample">
            <legend>Example {i + 1}{i > 0 ? " (optional)" : ""}</legend>
            <label className={input}>
              <span>Title</span>
              <input name={`sample${i}_title`} maxLength={120} placeholder="e.g. Fraud-pattern analysis for a logistics firm" />
            </label>
            <label className={input}>
              <span>Description</span>
              <textarea name={`sample${i}_description`} rows={3} maxLength={2000}
                placeholder="What the work was and the outcome the client got." />
            </label>
            <label className={input}>
              <span>Image (optional, max 5 MB)</span>
              <input name={`sample${i}_image`} type="file" accept="image/*" />
            </label>
          </fieldset>
        ))}
      </div>

      {/* Step 5 — Review & submit */}
      <div ref={(el) => { stepRefs.current[4] = el; }} hidden={step !== 4}>
        <h2 ref={(el) => { headingRefs.current[4] = el; }} tabIndex={-1} className="join-step-title">
          Review &amp; submit
        </h2>
        <dl className="join-review">
          {review.map(([label, value]) => (
            <div key={label} className="join-review-row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="notice">
          <strong>No websites, no emails.</strong> Prolice AI profiles never show
          website links or email addresses — clients reach you through the
          platform inbox.
        </div>
      </div>

      {status && (
        <p role={status.ok ? "status" : "alert"} className={status.ok ? "form-ok" : "form-error"}>
          {status.message}
        </p>
      )}

      <div className="hero-ctas join-nav" style={{ justifyContent: "flex-start" }}>
        {step > 0 && (
          <button type="button" className="btn btn-outline" onClick={back} disabled={busy}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-orange" onClick={next} disabled={busy}>
            Continue
          </button>
        ) : (
          <button type="submit" className="btn btn-orange" disabled={busy}>
            {busy ? "Submitting…" : "Submit profile for review"}
          </button>
        )}
        <Link href="/experts" className="btn btn-outline">Browse AI pros</Link>
      </div>
    </form>
  );
}
