"use client";

import { useEffect, useState } from "react";
import LogoMark from "./LogoMark";
import { SITE_TAGLINE } from "@/lib/site";

// Splash screen shown on first load (~2.8s): gray background, centered logo,
// "Prolorg" in lime, tagline, thin animated lime progress bar.
export default function Splash() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`splash${hidden ? " hidden" : ""}`} aria-hidden={hidden}>
      <LogoMark size={72} />
      <div className="splash-name">Prolorg</div>
      <div className="splash-tag">{SITE_TAGLINE}</div>
      <div className="splash-bar" aria-hidden="true">
        <div className="splash-bar-inner" />
      </div>
    </div>
  );
}
