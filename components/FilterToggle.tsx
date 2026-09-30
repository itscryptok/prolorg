"use client";

import { useFilterPanel } from "./FilterPanelContext";

function FilterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
    </svg>
  );
}

// Filter toggle for the /experts toolbar (far right, above the listing
// cards). Opens the advanced-search panel; toggles it closed again;
// highlighted while the panel is open.
export default function FilterToggle() {
  const { open, toggle } = useFilterPanel();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={open ? "Hide search filters" : "Show search filters"}
      title="Filter AI pros"
      aria-expanded={open}
      className={`filter-toggle${open ? " active" : ""}`}
    >
      <FilterIcon />
    </button>
  );
}
