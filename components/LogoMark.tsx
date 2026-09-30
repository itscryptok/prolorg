interface LogoMarkProps {
  size?: number;
  title?: string;
}

// Prolorg logo mark: royal-blue shield with gold outline and gold "P".
export default function LogoMark({ size = 36, title = "Prolorg logo" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path
        d="M32 3 55 12v18c0 14.5-9.8 25.4-23 31C18.8 55.4 9 44.5 9 30V12L32 3z"
        fill="#1e40af"
      />
      <path
        d="M32 3 55 12v18c0 14.5-9.8 25.4-23 31C18.8 55.4 9 44.5 9 30V12L32 3z"
        fill="none"
        stroke="#f5a623"
        strokeWidth="2.5"
      />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="Segoe UI, system-ui, sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#f5a623"
      >
        P
      </text>
    </svg>
  );
}
