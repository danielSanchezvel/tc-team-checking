import { useState } from 'react';
import { introAudio } from '../lib/audio';

// Mute fijo durante el formulario; la preferencia se recuerda (§3.2).
export default function MuteButton() {
  const [muted, setMuted] = useState(introAudio.muted);
  return (
    <button
      onClick={() => setMuted(introAudio.toggleMute())}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      className="fixed right-4 top-4 z-30 rounded-full border border-violet-300/40 bg-bg-night/50 px-3 py-2 text-sm text-text backdrop-blur"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
