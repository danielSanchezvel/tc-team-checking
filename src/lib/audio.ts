import {
  AUDIO_PRELOAD_TIMEOUT_MS,
  FADE_IN_MS,
  FORM_VOLUME,
  introAudioUrl,
} from '../intro/constants';

const MUTE_KEY = 'tc_mute';

function readMute(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMute(v: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch {
    /* modo privado: la preferencia no se guarda, no pasa nada */
  }
}

/**
 * Control del audio de la intro. Un solo <audio> reutilizado.
 * El play() real debe dispararse DENTRO del handler del toque (§3.1).
 */
class IntroAudio {
  private el: HTMLAudioElement | null = null;
  private raf = 0;

  private ensure(): HTMLAudioElement {
    if (!this.el) {
      const el = new Audio(introAudioUrl());
      el.preload = 'auto';
      el.loop = false;
      el.muted = readMute();
      this.el = el;
    }
    return this.el;
  }

  /** Precarga con timeout. Resuelve true si cargó, false si se agotó el tiempo. */
  preload(timeout = AUDIO_PRELOAD_TIMEOUT_MS): Promise<boolean> {
    const el = this.ensure();
    if (el.readyState >= 3) return Promise.resolve(true);
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        el.removeEventListener('canplaythrough', onReady);
        resolve(ok);
      };
      const onReady = () => finish(true);
      el.addEventListener('canplaythrough', onReady, { once: true });
      el.load();
      window.setTimeout(() => finish(false), timeout);
    });
  }

  /** Arranca desde 0 con fade-in. Debe llamarse dentro del gesto del usuario. */
  async playFromStart(fadeMs = FADE_IN_MS): Promise<void> {
    const el = this.ensure();
    el.currentTime = 0;
    el.volume = el.muted ? 1 : 0; // el volumen sube con el fade; muted manda igual
    try {
      await el.play();
    } catch {
      return; // autoplay bloqueado o sin audio: la intro corre sin música
    }
    this.fadeTo(1, fadeMs);
  }

  /** Tiempo actual en ms (para anclar el timeline, §3.2). */
  get currentTimeMs(): number {
    return this.el ? this.el.currentTime * 1000 : 0;
  }

  get isPlaying(): boolean {
    return !!this.el && !this.el.paused;
  }

  setLoop(v: boolean): void {
    this.ensure().loop = v;
  }

  /** Rampa de volumen (no se usa mientras muted). */
  fadeTo(target: number, ms: number): void {
    const el = this.ensure();
    cancelAnimationFrame(this.raf);
    if (el.muted || ms <= 0) {
      el.volume = target;
      return;
    }
    const start = el.volume;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      el.volume = start + (target - start) * p;
      if (p < 1) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Baja a volumen de formulario y pone en loop (§5). */
  enterFormMode(): void {
    this.setLoop(true);
    this.fadeTo(FORM_VOLUME, 600);
    if (this.el && this.el.paused) void this.el.play().catch(() => {});
  }

  get muted(): boolean {
    return this.el ? this.el.muted : readMute();
  }

  setMuted(v: boolean): void {
    writeMute(v);
    if (this.el) this.el.muted = v;
  }

  toggleMute(): boolean {
    const next = !this.muted;
    this.setMuted(next);
    return next;
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    if (this.el) {
      this.el.pause();
      this.el.currentTime = 0;
    }
  }
}

export const introAudio = new IntroAudio();
