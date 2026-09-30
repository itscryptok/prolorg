interface LogoMarkProps {
  size?: number;
  title?: string;
}

// Prolorg logo mark: geometric shield in deep blue with an orange "P".
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
        fill="#1e3a8a"
      />
      <path
        d="M32 3 55 12v18c0 14.5-9.8 25.4-23 31C18.8 55.4 9 44.5 9 30V12L32 3z"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
      />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="Segoe UI, system-ui, sans-serif"
        fontWeight="900"
        fontSize="30"
        fill="#c8f04a"
      >
        P
      </text>
    </svg>
  );
}
