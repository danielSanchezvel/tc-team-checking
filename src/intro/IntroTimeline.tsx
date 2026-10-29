import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { introAudio } from '../lib/audio';
import {
  BEAT_MS,
  INTRO_MAX_MS,
  LOGO_HIT_MS,
  REPEAT_INTRO_MS,
  SKIP_VISIBLE_AT_MS,
} from './constants';
import Clouds from './Clouds';
import Plane from './Plane';
import Honey from './Honey';

const END_MS = 5200;

// Intro cinematográfica (§3.2). El timeline se ancla al beat: GSAP lee
// audio.currentTime en vez de confiar en setTimeout.
export default function IntroTimeline({
  short,
  onDone,
}: {
  short: boolean;
  onDone: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const doneRef = useRef(false);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const skipFlight = prefersReduced || short;

    const skipTimer = window.setTimeout(() => setShowSkip(true), SKIP_VISIBLE_AT_MS);
    // La intro nunca bloquea más de 6 s (§3.2).
    const hardCap = window.setTimeout(finish, skipFlight ? REPEAT_INTRO_MS + 500 : INTRO_MAX_MS);

    let tick: (() => void) | null = null;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, onComplete: finish });

      if (skipFlight) {
        // Sin vuelo: fade directo al golpe del logo (reduced-motion / visitas siguientes).
        tl.set('.tc-plane, .tc-cloud, .tc-flash', { opacity: 0 });
        tl.fromTo(
          '.tc-honey',
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' },
        );
        tl.fromTo(
          '.tc-tcteam',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3 },
          '-=0.1',
        );
        tl.to('.tc-honey', {
          scale: 1.045,
          duration: BEAT_MS / 1000,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
        tl.play();
        return;
      }

      // --- Vuelo completo ---
      // Nubes: deriva continua (parallax), independiente del timeline.
      gsap.to('.tc-cloud-1', { xPercent: -8, duration: 5.2, ease: 'none' });
      gsap.to('.tc-cloud-2', { xPercent: -16, duration: 5.2, ease: 'none' });
      gsap.to('.tc-cloud-3', { xPercent: -24, duration: 5.2, ease: 'none' });

      tl.set('.tc-plane', {
        scale: 0.03,
        left: '50%',
        top: '42%',
        xPercent: -50,
        yPercent: -50,
        rotation: -6,
        filter: 'blur(2px)',
        transformOrigin: '50% 50%',
      });
      tl.set('.tc-flash', { opacity: 0 });
      tl.set('.tc-honey', { scale: 0, opacity: 0 });
      tl.set('.tc-tcteam', { opacity: 0, y: 24 });

      // 0.3 -> 2.8: el avión crece con ease-in (lento al inicio, brutal al final).
      tl.to(
        '.tc-plane',
        { duration: 2.5, scale: 1.4, top: '50%', rotation: 3, filter: 'blur(0px)', ease: 'power3.in' },
        0.3,
      );
      // 2.8 -> 3.2: llena la pantalla y pasa a través de la cámara + destello.
      tl.to('.tc-plane', { duration: 0.4, scale: 9, opacity: 0, ease: 'power2.in' }, 2.8);
      tl.to('.tc-flash', { duration: 0.2, opacity: 0.92, ease: 'power2.in' }, 2.95);
      tl.to('.tc-flash', { duration: 0.35, opacity: 0, ease: 'power2.out' }, 3.2);

      // 3.2: GOLPE DEL LOGO (en el drop). Gota que cae y revienta (squash & stretch).
      tl.fromTo(
        '.tc-honey',
        { scale: 0, opacity: 0, y: -80 },
        { duration: 0.42, scale: 1, opacity: 1, y: 0, ease: 'back.out(2.2)' },
        LOGO_HIT_MS / 1000,
      );
      // Sacudida corta de pantalla.
      tl.fromTo(
        root.current,
        { x: 0 },
        { duration: 0.07, x: 7, repeat: 5, yoyo: true, ease: 'none' },
        LOGO_HIT_MS / 1000,
      );
      tl.to('.tc-tcteam', { duration: 0.3, opacity: 1, y: 0, ease: 'power2.out' }, 3.5);

      // 3.2 -> 4.5: la honey respira con glow a tempo (129 BPM).
      tl.to(
        '.tc-honey',
        { duration: BEAT_MS / 1000, scale: 1.045, yoyo: true, repeat: 2, ease: 'sine.inOut' },
        3.7,
      );

      // 4.5 -> 5.2: el logo sube y se encoge (la bienvenida entra en CheckinApp).
      tl.to('.tc-logo-wrap', { duration: 0.6, scale: 0.62, y: -110, ease: 'power2.inOut' }, 4.5);

      tl.pause(0);

      // Anclaje al audio: si suena, el audio manda el playhead (§3.2).
      if (introAudio.isPlaying) {
        tick = () => {
          const t = introAudio.currentTimeMs;
          tl.time(Math.min(t / 1000, END_MS / 1000));
          if (t >= END_MS) finish();
        };
        gsap.ticker.add(tick);
      } else {
        tl.play();
      }
    }, root);

    return () => {
      window.clearTimeout(skipTimer);
      window.clearTimeout(hardCap);
      if (tick) gsap.ticker.remove(tick);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [short]);

  return (
    <main
      ref={root}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(160deg, #2A0B45 0%, #6A1FB5 30%, #FF2E93 62%, #FF8A3D 100%)',
      }}
    >
      <Clouds />
      <Plane className="tc-plane absolute" />
      <div className="tc-flash pointer-events-none absolute inset-0" />

      <div className="tc-logo-wrap relative z-10 flex flex-col items-center">
        <Honey className="tc-honey" size={140} />
        <h1 className="tc-tcteam mt-4 font-display text-4xl tracking-[0.2em] text-text drop-shadow-[0_0_24px_rgba(255,179,25,.6)]">
          TC TEAM
        </h1>
      </div>

      {showSkip && (
        <button
          onClick={finish}
          className="absolute bottom-8 right-6 z-20 rounded-full border border-violet-300/40 bg-bg-night/40 px-4 py-2 text-sm text-text"
        >
          Saltar
        </button>
      )}
    </main>
  );
}
