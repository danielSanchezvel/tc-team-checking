// Constantes de la intro (§3.2, §5). No se inventan: vienen del PROYECTO.md.

export const LOGO_HIT_MS = 3200; // golpe del logo en el drop de la canción
export const BEAT_MS = 465; // 129 BPM -> un pulso cada 465 ms
export const INTRO_MAX_MS = 6000; // la intro nunca bloquea más de 6 s
export const SKIP_VISIBLE_AT_MS = 1000; // botón Saltar visible desde el seg. 1
export const REPEAT_INTRO_MS = 1500; // visitas siguientes: solo el golpe del logo
export const FADE_IN_MS = 300; // fade-in de la música
export const FORM_VOLUME = 0.3; // música al 30 % durante el formulario
export const AUDIO_PRELOAD_TIMEOUT_MS = 4000; // si no carga, se arranca sin música

export const INTRO_AUDIO_PATH = 'intro/intro-tc-team.mp3';

/** URL pública del audio en Supabase Storage (bucket público 'intro'). */
export function introAudioUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${INTRO_AUDIO_PATH}`;
}
