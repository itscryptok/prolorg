"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AVAILABILITY_OPTIONS } from "@/lib/experts";

type Profile = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  specialty: string;
  skills: string[];
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string | null;
  city: string | null;
  country: string | null;
  languages: string[];
  yearsExperience: number | null;
  status: string;
  hasPhoto: boolean;
  hasVideo: boolean;
};

// AI pro dashboard: view and edit the profile linked to this account.
// (The /join application links to the account automatically when an AI pro
// is signed in while applying.)
export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/expert/profile");
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Could not load profile.");
      setProfile(json.profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/expert/profile", {
        method: "PATCH",
        body: new FormData(e.currentTarget),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>AI pro dashboard</h1>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {!error && !profile && (
        <div className="empty-state">
          <h2>No profile linked yet</h2>
          <p>
            Apply through the onboarding form while signed in and your profile
            links to this account automatically — once approved, you can edit
            it here and receive client messages.
          </p>
          <Link href="/join" className="btn btn-orange">
            Apply as an AI pro
          </Link>
        </div>
      )}

      {profile && (
        <>
          <p className="admin-sub">
            Editing <strong>{profile.name}</strong> · {profile.specialty} ·{" "}
            <span className="pill">{profile.status}</span>{" "}
            {profile.status === "PENDING" && (
              <span>— your profile goes public once approved.</span>
            )}
            {profile.status === "APPROVED" && profile.slug && (
              <span>
                — <Link href={`/experts/${profile.slug}`}>view public profile</Link>
              </span>
            )}
          </p>
          <form onSubmit={onSubmit} className="dashboard-form">
            <label className="auth-label">
              Headline
              <input
                className="auth-input"
                name="headline"
                defaultValue={profile.headline}
                required
                maxLength={140}
              />
            </label>
            <label className="auth-label">
              Bio
              <textarea
                className="auth-input"
                name="bio"
                rows={6}
                required
                maxLength={4000}
                defaultValue={profile.bio}
              />
            </label>
            <div className="form-row">
              <label className="auth-label">
                Hourly rate (USD, $15–$75)
                <input
                  className="auth-input"
                  name="hourlyRate"
                  type="number"
                  min={15}
                  max={75}
                  defaultValue={profile.hourlyRate ?? ""}
                  placeholder="e.g. 45"
                />
              </label>
              <label className="auth-label">
                Project rate from (USD, $65–$650)
                <input
                  className="auth-input"
                  name="projectRate"
                  type="number"
                  min={65}
                  max={650}
                  defaultValue={profile.projectRate ?? ""}
                  placeholder="e.g. 350"
                />
              </label>
            </div>
            <div className="form-row">
              <label className="auth-label">
                Availability
                <select
                  className="auth-input"
                  name="availability"
                  defaultValue={profile.availability ?? ""}
                >
                  <option value="">—</option>
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="auth-label">
                Years of experience
                <input
                  className="auth-input"
                  name="yearsExperience"
                  type="number"
                  min={0}
                  max={60}
                  defaultValue={profile.yearsExperience ?? ""}
                />
              </label>
            </div>
            <div className="form-row">
              <label className="auth-label">
                City
                <input
                  className="auth-input"
                  name="city"
                  maxLength={80}
                  defaultValue={profile.city ?? ""}
                />
              </label>
              <label className="auth-label">
                Country
                <input
                  className="auth-input"
                  name="country"
                  maxLength={80}
                  defaultValue={profile.country ?? ""}
                />
              </label>
            </div>
            <label className="auth-label">
              Skills (comma-separated)
              <input
                className="auth-input"
                name="skills"
                defaultValue={profile.skills.join(", ")}
                placeholder="Python, data analysis, prompt engineering"
              />
            </label>
            <label className="auth-label">
              Languages (comma-separated)
              <input
                className="auth-input"
                name="languages"
                defaultValue={profile.languages.join(", ")}
                placeholder="English, Spanish"
              />
            </label>
            <div className="form-row">
              <label className="auth-label">
                Profile photo {profile.hasPhoto && <em>(already set — replace)</em>}
                <input className="auth-input" name="photo" type="file" accept="image/*" />
              </label>
              <label className="auth-label">
                Intro video {profile.hasVideo && <em>(already set — replace)</em>}
                <input className="auth-input" name="video" type="file" accept="video/*" />
              </label>
            </div>

            {saved && <p className="form-ok">Profile saved.</p>}

            <button type="submit" className="btn btn-orange" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
