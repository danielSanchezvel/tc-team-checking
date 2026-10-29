/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // Modo solo oscuro (§4). El <html> lleva class="dark" fijo.
  theme: {
    extend: {
      // Tokens de §4. Se exponen como variables CSS en index.css y se mapean aquí.
      colors: {
        'bg-night': 'var(--bg-night)',
        'purple-900': 'var(--purple-900)',
        'purple-600': 'var(--purple-600)',
        'violet-300': 'var(--violet-300)',
        'pink-500': 'var(--pink-500)',
        'orange-400': 'var(--orange-400)',
        // honey-* reservado: logo, sello CHECK-IN OK y glow. No usar en UI genérica (§4).
        'honey-400': 'var(--honey-400)',
        'honey-700': 'var(--honey-700)',
        'sun-300': 'var(--sun-300)',
        'mint-400': 'var(--mint-400)',
        'red-400': 'var(--red-400)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
      },
      backgroundImage: {
        // Gradiente firma (§4)
        'tc-signature':
          'linear-gradient(160deg, #2A0B45 0%, #6A1FB5 35%, #FF2E93 70%, #FF8A3D 100%)',
      },
      boxShadow: {
        // Glow neón (§4)
        'tc-neon': '0 0 24px rgba(255, 46, 147, .55)',
        'tc-honey': '0 0 24px rgba(255, 179, 25, .55)',
      },
      fontFamily: {
        // Titulares/logo: Anton o Bebas Neue · Cuerpo: Manrope/Inter · Pasabordo: Space Mono (§4)
        display: ['Anton', 'Bebas Neue', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
