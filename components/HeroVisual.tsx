// Professional hero visual for the homepage: a stylized product preview
// showing an AI pro profile card over an inbox chat snippet, with a
// "hire confirmed" chip. Pure CSS/SVG, theme-aware, decorative only.
export default function HeroVisual() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-art-chat">
        <p className="hero-art-msg in">Can you trace my family line back four generations?</p>
        <p className="hero-art-msg out">Yes — sourced report, delivered in 5 days.</p>
      </div>
      <div className="hero-art-card">
        <div className="hero-art-pro">
          <span className="hero-art-avatar">AP</span>
          <span className="hero-art-id">
            <strong>AI Pro</strong>
            <span>Forensic analysis</span>
          </span>
          <span className="hero-art-status">
            <i />
            Available now
          </span>
        </div>
        <div className="hero-art-meta">
          <span className="hero-art-rating">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            5.0 <em>(120 jobs)</em>
          </span>
          <span className="hero-art-rate">$40/hr</span>
        </div>
        <span className="hero-art-btn">Message AI pro</span>
      </div>
      <div className="hero-art-chip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Hire confirmed
      </div>
    </div>
  );
}
