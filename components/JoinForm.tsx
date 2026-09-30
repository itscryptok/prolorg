"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTIES, AVAILABILITY_OPTIONS } from "@/lib/experts";
import CaptureField from "@/components/CaptureField";

const input = "join-input";

type Status = { ok: boolean; message: string } | null;

// AI pro onboarding: creates a PENDING profile for review. Phase 3 links it
// to an AI pro account. No website/email fields — contact lockdown.
// AI pros can attach a profile photo and an intro video (played in /watch).
export default function JoinForm() {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  // Bumped after a successful submit so captured media resets with the form.
  const [formKey, setFormKey] = useState(0);

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
          "Profile received — it's now pending review. We'll list it in the directory once approved.",
      });
      (e.target as HTMLFormElement).reset();
      setFormKey((k) => k + 1);
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="join-form" onSubmit={onSubmit}>
      <div className="join-grid">
        <label className={input}>
          <span>Full name *</span>
          <input name="name" required maxLength={80} placeholder="Ada Lovelace" autoComplete="name" />
        </label>
        <label className={input}>
          <span>Specialty *</span>
          <select name="specialty" required defaultValue="">
            <option value="" disabled>Choose your specialty</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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

      <div className="notice">
        <strong>No websites, no emails.</strong> AiProlice profiles never show
        website links or email addresses — clients reach you through the
        platform inbox.
      </div>

      {status && (
        <p role={status.ok ? "status" : "alert"} className={status.ok ? "form-ok" : "form-error"}>
          {status.message}
        </p>
      )}

      <div className="hero-ctas" style={{ justifyContent: "flex-start" }}>
        <button type="submit" className="btn btn-orange" disabled={busy}>
          {busy ? "Submitting…" : "Submit profile for review"}
        </button>
        <Link href="/experts" className="btn btn-outline">Browse AI pros</Link>
      </div>
    </form>
  );
}
