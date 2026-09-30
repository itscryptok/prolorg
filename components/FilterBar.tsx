"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SPECIALTIES, AVAILABILITY_OPTIONS } from "@/lib/experts";

// Filter controls for /experts. Updates URL search params so filtered views
// are shareable; the server component re-queries on each change.
export default function FilterBar({ total }: { total: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/experts?${next.toString()}#filters`, { scroll: false });
  };

  const clear = () => {
    setQ("");
    router.push("/experts#filters", { scroll: false });
  };

  const hasFilters = [...params.keys()].length > 0;

  return (
    <form
      id="filters"
      className="filter-bar"
      aria-label="Filter experts"
      onSubmit={(e) => {
        e.preventDefault();
        set("q", q.trim());
      }}
    >
      <div className="filter-row">
        <label className="filter-field filter-grow">
          <span>Keyword</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Skill, tool, or keyword…"
            aria-label="Search by keyword"
          />
        </label>
        <label className="filter-field">
          <span>Specialty</span>
          <select
            value={params.get("specialty") ?? ""}
            onChange={(e) => set("specialty", e.target.value)}
            aria-label="Filter by specialty"
          >
            <option value="">All specialties</option>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Max hourly rate</span>
          <select
            value={params.get("maxRate") ?? ""}
            onChange={(e) => set("maxRate", e.target.value)}
            aria-label="Filter by maximum hourly rate"
          >
            <option value="">Any rate</option>
            <option value="50">Up to $50/hr</option>
            <option value="100">Up to $100/hr</option>
            <option value="200">Up to $200/hr</option>
            <option value="500">Up to $500/hr</option>
          </select>
        </label>
        <label className="filter-field">
          <span>Availability</span>
          <select
            value={params.get("availability") ?? ""}
            onChange={(e) => set("availability", e.target.value)}
            aria-label="Filter by availability"
          >
            <option value="">Any availability</option>
            {AVAILABILITY_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Sort by</span>
          <select
            value={params.get("sort") ?? ""}
            onChange={(e) => set("sort", e.target.value)}
            aria-label="Sort experts"
          >
            <option value="">Recommended</option>
            <option value="rating">Highest rated</option>
            <option value="rate-asc">Lowest rate</option>
            <option value="rate-desc">Highest rate</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
      <div className="filter-meta">
        <p className="filter-count" role="status">
          {total} expert{total === 1 ? "" : "s"} found
        </p>
        {hasFilters && (
          <button type="button" className="filter-clear" onClick={clear}>
            Clear all filters
          </button>
        )}
      </div>
    </form>
  );
}
