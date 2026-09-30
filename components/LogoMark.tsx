interface LogoMarkProps {
  size?: number;
  title?: string;
}

// AiProlice logo mark: royal-blue police badge with gold outline, gold star,
// and gold "Pro" text.
export default function LogoMark({ size = 36, title = "AiProlice logo" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path d="M32 8 C36 11 41 12 46 12 L58 14 C57 20 56 26 56 32 C56 43 47 52 32 59.5 C17 52 8 43 8 32 C8 26 7 20 6 14 L18 12 C23 12 28 11 32 8 Z" fill="#1e40af" />
      <path
        d="M32 8 C36 11 41 12 46 12 L58 14 C57 20 56 26 56 32 C56 43 47 52 32 59.5 C17 52 8 43 8 32 C8 26 7 20 6 14 L18 12 C23 12 28 11 32 8 Z"
        fill="none"
        stroke="#f5a623"
        strokeWidth="2.5"
      />
      <path d="M32.00,13.50 L33.53,17.90 L38.18,17.99 L34.47,20.80 L35.82,25.26 L32.00,22.60 L28.18,25.26 L29.53,20.80 L25.82,17.99 L30.47,17.90 Z" fill="#f5a623" />
      <text
        x="32"
        y="45"
        textAnchor="middle"
        fontFamily="Segoe UI, system-ui, sans-serif"
        fontWeight="900"
        fontSize="15"
        fill="#f5a623"
      >
        Pro
      </text>
    </svg>
  );
}
