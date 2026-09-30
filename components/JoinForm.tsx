"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTIES, AVAILABILITY_OPTIONS } from "@/lib/experts";

const input = "join-input";

type Status = { ok: boolean; message: string } | null;

// Expert onboarding: creates a PENDING profile for review. Phase 3 links it
// to an expert account. No website/email fields — contact lockdown.
// Experts can attach a profile photo and an intro video (played in /watch).
export default function JoinForm() {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (file) setPhotoPreview(URL.createObjectURL(file));
  }

  function onVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setVideoName(file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : null);
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
          "Profile received — it's now pending review. We'll list it in the directory once approved.",
      });
      (e.target as HTMLFormElement).reset();
      setPhotoPreview(null);
      setVideoName(null);
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
        <label className={input}>
          <span>Profile photo</span>
          <input type="file" name="photo" accept="image/*" onChange={onPhotoChange} />
          <small className="join-hint">Square works best. Max 5 MB.</small>
          {photoPreview && (
            <img src={photoPreview} alt="Photo preview" className="join-photo-preview" />
          )}
        </label>
        <label className={input}>
          <span>Intro video</span>
          <input type="file" name="video" accept="video/*" onChange={onVideoChange} />
          <small className="join-hint">Short clip introducing yourself — plays in the Watch feed. Max 25 MB.</small>
          {videoName && <span className="join-file-name">{videoName}</span>}
        </label>
      </div>

      <div className="notice">
        <strong>No websites, no emails.</strong> Prolorg profiles never show
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
        <Link href="/experts" className="btn btn-outline">Browse experts</Link>
      </div>
    </form>
  );
}
