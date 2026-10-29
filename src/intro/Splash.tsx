import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { introAudio } from '../lib/audio';
import Honey from './Honey';

// Pantalla 0 (§3.1): un toque desbloquea el audio y arranca la intro.
export default function Splash({ onAbordar }: { onAbordar: () => void }) {
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Precarga el audio; preload() ya trae su propio timeout de 4 s (§3.1).
    introAudio.preload().finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  async function abordar() {
    if (!ready || starting) return;
    setStarting(true);
    // play() DENTRO del gesto (§3.1). Si falla, la intro corre sin música.
    await introAudio.playFromStart();
    onAbordar();
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-tc-signature p-6 text-center">
      {/* Silueta de la honey detrás */}
      <Honey className="pointer-events-none absolute opacity-10 blur-sm" size={320} />

      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Honey size={120} />
      </motion.div>

      <h1 className="mt-6 font-display text-3xl tracking-[0.2em] text-text">TC TEAM</h1>

      <button
        onClick={abordar}
        disabled={!ready || starting}
        className="mt-10 rounded-2xl bg-pink-500 px-10 py-4 text-lg font-bold tracking-wide text-text shadow-tc-neon transition disabled:opacity-50"
      >
        {ready ? 'ABORDAR ✈' : 'Cargando…'}
      </button>
      <p className="mt-3 text-sm text-text-muted">Sube el volumen 🔊</p>
    </main>
  );
}
