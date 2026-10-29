import { useState } from 'react';
import { introAudio } from '../lib/audio';

// Mute fijo durante el formulario; la preferencia se recuerda (§3.2).
export default function MuteButton() {
  const [muted, setMuted] = useState(introAudio.muted);
  function toggle() {
    const nowMuted = introAudio.toggleMute();
    setMuted(nowMuted);
    // Al activar el sonido, arranca/reanuda el audio (estamos dentro del gesto).
    // Útil en visitas siguientes, donde no hubo splash para iniciarlo.
    if (!nowMuted) introAudio.resume();
  }

  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      className="fixed right-4 top-4 z-30 rounded-full border border-violet-300/40 bg-bg-night/50 px-3 py-2 text-sm text-text backdrop-blur"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
