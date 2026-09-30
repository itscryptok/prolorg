"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface FilterPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const FilterPanelContext = createContext<FilterPanelState>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

// Shared toggle state for the advanced-search filter panel. The header's
// filter icon toggles it; the /experts FilterBar renders only when open.
export function FilterPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  return (
    <FilterPanelContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </FilterPanelContext.Provider>
  );
}

export function useFilterPanel() {
  return useContext(FilterPanelContext);
}
