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
        d="M32 4 L54 13 V30 C54 44 46 53.5 33.5 58.5 Q32 59.8 30.5 58.5 C18 53.5 10 44 10 30 V13 Z"
        fill="#1e40af"
      />
      <path
        d="M32 4 L54 13 V30 C54 44 46 53.5 33.5 58.5 Q32 59.8 30.5 58.5 C18 53.5 10 44 10 30 V13 Z"
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
