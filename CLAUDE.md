# CLAUDE.md · TC Team Check-in

Reglas de trabajo para el agente. La fuente de verdad del proyecto es `PROYECTO.md`; este archivo resume lo que **nunca** se puede olvidar. Ante cualquier duda o contradicción, **gana `PROYECTO.md` y se pregunta a Daniel** (§16.8).

Idioma de trabajo: **español** (UI, mensajes, commits y conversación).

---

## Reglas de proceso (§16)

1. **Plan primero.** Al inicio de cada fase, muestro un plan corto (archivos y orden) y espero el OK de Daniel.
2. **Pausa al final de cada fase.** Muestro qué se hizo, cómo probarlo y qué pruebas pasaron, y espero el OK antes de seguir. **La Fase 1 no avanza sin que Daniel apruebe el SQL línea por línea.**
3. **Supabase en la nube, sin Docker.** Nunca `supabase start`. Las migraciones van en `supabase/migrations` y se aplican con `npx supabase db push`. **Antes de cada `db push`, muestro el SQL y espero el OK.**
4. **Cero llaves secretas.** No pido ni uso `service_role` ni la contraseña de la BD. **Nunca debilito RLS para "hacer que funcione".** Si algo de seguridad choca, paro y pregunto.
5. **Pruebas mínimas (Vitest contra `tc-team-dev`, solo con la anon key):**
   - anon **NO** puede leer ni escribir tablas directo;
   - un token inválido falla;
   - un pasaporte que vence antes de `departure_date + 6 meses` deja el estado en `pasaporte_pendiente`.
   Para el viajero de prueba, propongo cómo crearlo sin `service_role` y espero el OK.
6. **Datos provisionales:** `departure_date = 2027-03-31`. El correo de admin lo da Daniel en el prompt.
7. **Honey:** mientras no exista `public/honey.svg`, uso un placeholder simple marcado como `TODO` y no pulo.
8. **Ante ambigüedades o contradicciones de `PROYECTO.md`, pregunto en vez de inventar.**
9. **Stack fijo (§6):** para cambiar una librería, pregunto antes.

---

## Seguridad — no negociable (§8)

- **RLS activado en todas las tablas y cero políticas para `anon`.** Desde el navegador no se puede `select`/`insert` directo.
- Los viajeros solo tocan la BD vía funciones `security definer`: `get_checkin(token)`, `save_checkin(token, payload)`, y `create_traveler(alias)` (solo admin).
- **Tokens:** 32 bytes aleatorios base64url en la URL `/c/<token>`. En la BD solo el **hash** (sha256). Token inválido → error genérico.
- Admin solo hace `select` si `auth.jwt() ->> 'email'` está en `admins`.
- **Nada sensible** en `localStorage`, logs, analytics, pasabordo, OG image ni URL (salvo el token).
- El **PNG del pasabordo nunca** incluye documento, fecha de nacimiento ni pasaporte.
- `noindex` + `robots.txt` con `Disallow: /`.
- Prueba de aceptación: con la anon key desde consola, leer `checkins` debe dar vacío o error.

---

## Stack fijo (§6)

Vite + React + TypeScript · Tailwind (tokens §4) · GSAP (intro, sincronizada con `audio.currentTime`) + Framer Motion (UI) · React Hook Form + Zod (**mismo esquema front y backend**) · Supabase nube (Postgres + RLS + RPC + Auth magic link + Storage) · SheetJS (export) · Deploy Vercel + Supabase.

Dos proyectos: `tc-team-dev` (hoy, linkeado, ref `xypnjqixoqvpgksxhboo`) y `tc-team-prod` (se crea al cerrar la Fase 2). Región East US (N. Virginia).

---

## Constantes y reglas que no se inventan

- `LOGO_HIT_MS = 3200` · `BEAT_MS = 465` (129 BPM).
- Audio `intro-tc-team.mp3` se sirve desde **Supabase Storage**, **no va en el repo** (ni el que está hoy en la raíz / `assets-local/`).
- Ruta: CLO → PUJ. Logo: la honey 🍯.
- **Regla pasaporte RD:** vigencia mínima 6 meses desde el ingreso. Peor caso provisional: debe vencer **después del 30/09/2027** (`departure_date 2027-03-31` + 6 meses). Si vence antes → error rojo + estado `pasaporte_pendiente`. La regla se deriva de `trip.departure_date`, no se hardcodea.
- Estados: `faltan_datos` · `pasaporte_pendiente` · `completo`.
- Modo solo oscuro. En UI nunca se usa el dorado miel genérico (reservado al logo/éxito). Nunca se anima mientras alguien escribe.

---

## Entorno

- Windows · PowerShell primario (Bash disponible). **Sin Docker.**
- Node v24. Migraciones vía `npx supabase ...`.
- `.env.local` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. La `service_role` no está y no se copia.
- Correo de admin (seed `admins` + login magic link): `danielsanchezvel@hotmail.com`.
