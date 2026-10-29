// Avión en SVG (§6: SVG/CSS 3D, no Three.js en v1). La estela rosada va aparte.
// Solo se animan transform/opacity (§9).
export default function Plane({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="160"
      height="80"
      viewBox="0 0 160 80"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="planeBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F8F1FF" />
          <stop offset="100%" stopColor="#C9B6E4" />
        </linearGradient>
      </defs>
      {/* Fuselaje */}
      <path
        d="M10 40 C40 32 100 30 140 34 C150 35 152 37 150 40 C152 43 150 45 140 46 C100 50 40 48 10 40 Z"
        fill="url(#planeBody)"
      />
      {/* Ala */}
      <path d="M70 40 L96 14 L104 16 L90 42 Z" fill="#B57BFF" />
      <path d="M70 40 L96 66 L104 64 L90 38 Z" fill="#6A1FB5" />
      {/* Cola */}
      <path d="M18 40 L30 22 L36 24 L30 40 Z" fill="#B57BFF" />
      {/* Ventanillas */}
      <circle cx="120" cy="40" r="2.2" fill="#2A0B45" />
      <circle cx="110" cy="40" r="2.2" fill="#2A0B45" />
      <circle cx="100" cy="40" r="2.2" fill="#2A0B45" />
    </svg>
  );
}
