// TODO(honey): placeholder simple de la honey (§16.7). Reemplazar por public/honey.svg
// cuando exista el diseño real. No invertir tiempo puliendo esto.
export default function Honey({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      aria-label="TC Team"
      role="img"
    >
      <defs>
        <radialGradient id="honeyFill" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="55%" stopColor="#FFB319" />
          <stop offset="100%" stopColor="#B86E00" />
        </radialGradient>
      </defs>
      {/* Gota de miel (teardrop) */}
      <path
        d="M50 6 C50 6 86 54 86 80 A36 36 0 1 1 14 80 C14 54 50 6 50 6 Z"
        fill="url(#honeyFill)"
      />
      {/* Brillo */}
      <ellipse cx="38" cy="70" rx="10" ry="16" fill="#FFF1C4" opacity="0.45" />
    </svg>
  );
}
