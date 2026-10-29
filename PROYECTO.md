# ✈️ TC Team · Check-in a Punta Cana

> Web app para recoger los datos de viaje de los integrantes del **TC Team** y comprar los boletos a **Punta Cana, República Dominicana (PUJ)**.
> **Estado:** listo para arrancar (Fase 1) · **Dueño:** Daniel Sánchez · **Última actualización:** 2026-10-29
>
> **Para el agente:** antes de escribir código, lee §15 (setup) y §16 (reglas de trabajo). Son obligatorias.
>
> **Logo:** una *honey* 🍯, en honor al whisky de miel. **Ruta:** CLO → PUJ. **Fecha:** marzo 2027 (días exactos por definir).

---

## 1. Objetivo

Que cada integrante llene sus datos de viaje desde el celular en menos de 3 minutos, con una experiencia que se sienta como abordar un avión, y que Daniel tenga en un solo lugar todo lo necesario para comprar los boletos.

**Éxito =**
- 100 % de los viajeros en estado *Completo* o *Pasaporte pendiente* antes de la fecha de compra.
- Cero datos sensibles visibles para alguien distinto al dueño de la fila y al admin.
- Export listo para comprar boletos sin volver a digitar nada.

**Fuera de alcance (v1):** compra de boletos, pagos o división de gastos, login con contraseña, OCR de pasaporte, app nativa, varios viajes.

**Regla de oro:** la app no bloquea la compra. Mientras no esté en producción se usa el Excel `Datos_viajeros_boletos.xlsx`.

---

## 2. Usuarios

| Rol | Quién | Qué hace |
|---|---|---|
| Viajero | Daniel, Hermanita, El Kevin, Gris, Juanchis, Valonchis (+ Emilia por confirmar) | Abre su link, ve la intro, hace su check-in, comparte su pasabordo |
| Admin | Daniel | Crea viajeros y links, ve estados, exporta, borra datos |

---

## 3. Experiencia

```
Link personal (enviado por privado en WhatsApp)
  → Splash "ABORDAR" (un toque: desbloquea el audio)
  → Intro: música + avión que sale desde el fondo y remata en la honey del TC Team
  → Bienvenida con nombre ("Juanchis, tu vuelo abrió check-in")
  → Formulario por pasos (4) → Revisión
  → Pasabordo animado + compartir
```

**Visitas siguientes:** intro corta (≤ 1,5 s, solo el golpe del logo) y directo al formulario o al pasabordo con los datos ya guardados.

### 3.1 Splash (pantalla 0)

Ningún navegador deja sonar audio al abrir una página sin que el usuario la toque primero (Chrome, Safari iOS y el navegador interno de WhatsApp lo bloquean). Por eso el splash hace parte del show y no es un parche técnico:

- Fondo con el gradiente firma, silueta del logo y un botón grande **ABORDAR ✈** latiendo.
- Mientras está el splash se precargan la canción y los assets de la intro; el botón se activa cuando todo cargó.
- Al tocar: `audio.play()` dentro del handler del toque y arranca el timeline.
- Si en 4 s no carga el audio, el botón se activa igual y la intro corre sin música.

### 3.2 Intro (≈ 5 s)

| Tiempo | Qué pasa |
|---|---|
| 0,0 s | Toque. Música con fade-in de 300 ms. Cielo de atardecer (gradiente) con nubes en 3 capas con parallax. |
| 0,3 → 2,8 s | El avión aparece como un punto en el horizonte (escala 0,03, desenfocado) y viene hacia la cámara con perspectiva, leve alabeo y estela rosada. La escala crece con ease-in (lento al principio, brutal al final). |
| 2,8 → 3,2 s | El avión llena la pantalla y pasa *a través* de la cámara: destello blanco-rosado + motion blur. |
| **3,2 s** | **Golpe del logo** justo en el drop de la canción (`LOGO_HIT_MS = 3200`): la honey cae como una gota de miel que se estira y revienta (squash & stretch), con salpicadura dorada, sacudida corta de pantalla y el texto **TC TEAM** debajo. |
| 3,2 → 4,5 s | La honey respira con glow dorado sobre el fondo morado, pulsando a tempo (129 BPM = un pulso cada 465 ms), y la escena se calma. |
| 4,5 → 5,2 s | El logo sube y se encoge al header; la bienvenida y el formulario entran desde abajo. |

**Reglas de la intro**
- `LOGO_HIT_MS = 3200`, medido sobre el clip final (§5). **El timeline se ancla al beat, no al revés:** GSAP lee `audio.currentTime` en vez de confiar en `setTimeout`.
- Botón **Saltar** visible desde el segundo 1.
- Con `prefers-reduced-motion` no hay vuelo: fade directo al logo.
- La intro nunca bloquea más de 6 s.
- La música sigue durante el formulario a menor volumen, con un botón mute fijo cuya preferencia se recuerda.

### 3.3 Formulario por pasos

| Paso | Campos |
|---|---|
| 1. Quién eres | Nombres y apellidos (MAYÚSCULAS, igual al pasaporte), sexo, fecha de nacimiento, nacionalidad |
| 2. Documento | Tipo de documento (CC, TI, Registro civil, CE, Otro) y número |
| 3. Pasaporte | ¿Tiene? (Sí / En trámite / No). Si es Sí: número y fecha de vencimiento |
| 4. Contacto | Celular, correo, observaciones (equipaje, asiento, restricciones) |
| Revisión | Resumen tipo tarjeta de embarque, con botón de editar por sección |

**Progreso:** un avión cruzando una ruta punteada sobre el Caribe, de CLO a PUJ.

**Validaciones** (el mismo esquema Zod en el front y en el backend):

| Campo | Regla |
|---|---|
| Nombres / apellidos | Auto-mayúsculas; solo letras, espacios, tildes y Ñ. Aviso fijo: *"Tal cual sale en el pasaporte. Un error aquí cuesta plata."* |
| Fecha de nacimiento | En el pasado; la edad se calcula. Si es menor de 18 años, se marca "menor" y se le avisa al admin (salir del país exige requisitos extra) |
| Número de documento | Se guarda como texto. Solo dígitos para CC/TI/RC |
| Vencimiento del pasaporte | **República Dominicana exige mínimo 6 meses de vigencia contados desde el ingreso.** Si vence antes de *fecha de ida + 6 meses*: error rojo "Tienes que renovar el pasaporte" y estado `pasaporte_pendiente` (se puede guardar, pero no queda Completo). **Mientras no haya fechas exactas**, se toma el peor caso (entrar el 31/03/2027): el pasaporte debe vencer **después del 30/09/2027**. Cuando se definan las fechas, se cambia `trip.departure_date` y la regla se ajusta sola |
| Celular | 10 dígitos colombiano o formato internacional |
| Correo | Formato válido |

**Guardado:** cada paso se guarda en el servidor al avanzar. Nada sensible en `localStorage`.

**Estados** (los mismos del Excel): `faltan_datos` · `pasaporte_pendiente` · `completo`.

### 3.4 Pasabordo

- Tarjeta tipo boarding pass de "TC TEAM AIRLINES": alias, `CLO → PUJ`, puerta "TC", la honey como sello de la aerolínea, asiento de broma y un QR **decorativo** (no contiene datos).
- Sello **CHECK-IN OK** animado (rotación + escala + efecto de tinta). Si el estado es *Pasaporte pendiente*, el sello es **PENDIENTE** en amarillo.
- Al tocarla se voltea en 3D.
- **Compartir:** genera un PNG (`html-to-image`) y lo comparte por la Web Share API a WhatsApp. **El PNG nunca incluye documento, fecha de nacimiento ni pasaporte.**

### 3.5 Panel admin (`/admin`)

- Login con magic link de Supabase Auth, solo para correos de la tabla `admins`.
- Tabla estilo pantalla de salidas de aeropuerto: alias, estado y última actualización, más el detalle de cada viajero.
- Acciones:
  - Crear viajero (genera el link).
  - Regenerar o copiar un link.
  - Exportar CSV/XLSX con las columnas del Excel.
  - **Borrar datos sensibles**, con confirmación doble.

---

## 4. Dirección visual

**Inspiración:** atardecer de Vice City / estética GTA VI, con morados profundos, magenta, naranja de atardecer y neón, más el **dorado miel** de la honey.
**Es solo inspiración:** no se usa logo, tipografía, nombre ni assets de Rockstar/GTA. La honey es diseño propio del TC Team, no la etiqueta ni la abeja de la marca del whisky.

**Por qué funciona la mezcla:** el morado y el dorado miel son complementarios. El fondo es morado y lo único dorado en pantalla es la honey (y el éxito), así que el ojo se va directo al logo. Si se usa dorado en botones, bordes y textos, el logo pierde fuerza.

| Token | Hex | Uso |
|---|---|---|
| `--bg-night` | `#12041F` | Fondo base |
| `--purple-900` | `#2A0B45` | Superficies, cards |
| `--purple-600` | `#6A1FB5` | Primario |
| `--violet-300` | `#B57BFF` | Bordes, focus |
| `--pink-500` | `#FF2E93` | Acento, CTA |
| `--orange-400` | `#FF8A3D` | Atardecer |
| `--honey-400` | `#FFB319` | Logo, sello CHECK-IN OK, glow del logo (**reservado**: no se usa en UI genérica) |
| `--honey-700` | `#B86E00` | Sombras y volumen de la miel |
| `--sun-300` | `#FFD166` | Advertencias |
| `--mint-400` | `#2EF2C2` | Éxito / Completo |
| `--red-400` | `#FF4D6D` | Error |
| `--text` | `#F8F1FF` | Texto principal |
| `--text-muted` | `#C9B6E4` | Texto secundario |

- **Gradiente firma:** `linear-gradient(160deg, #2A0B45 0%, #6A1FB5 35%, #FF2E93 70%, #FF8A3D 100%)`
- **Glow neón:** `box-shadow: 0 0 24px rgba(255, 46, 147, .55)`
- **Tipografía:**
  - Titulares y logo provisional: Anton o Bebas Neue (condensada, con actitud).
  - Cuerpo: Manrope o Inter.
  - Datos del pasabordo: Space Mono.
- **Modo:** solo oscuro.
- **Movimiento:**
  - Lo cinematográfico va solo en la intro y en el pasabordo.
  - En la UI, entradas desde abajo con overshoot suave de 200–400 ms.
  - Nunca se anima nada mientras alguien escribe.

---

## 5. Audio

**✅ Listo: `intro-tc-team.mp3`**

| Dato | Valor |
|---|---|
| Canción | Chimbala x Omega – *Se Me Nota (Agárrame)* |
| Recorte del original | 0:46.171 → 1:31.171 (45 s) |
| Formato | MP3 128 kbps, 44,1 kHz estéreo, 704 KB |
| Volumen | -14 LUFS integrado, pico -3,7 dBFS |
| Fades | Entrada de 0,3 s; salida en los últimos 3 s |
| **`LOGO_HIT_MS`** | **3200**: el drop del original (0:49.37). El bajo entra de golpe después de ~5 s sin bajo (salto de energía en graves ×25) |
| Tempo | 129 BPM → `BEAT_MS = 465` (para pulsos y micro-animaciones a tempo) |
| Coro "Se me nota" | Desde ~25,2 s del clip, cuando ya está el formulario en pantalla |

- La intro corre durante el silencio de bajo previo al drop (0 → 3,2 s), que es justo el tramo del vuelo.
- Durante el formulario, el clip sigue en loop al 30 % de volumen.
- El botón mute siempre está visible.
- **Derechos:** si es una canción comercial, la URL es privada y de uso familiar. El mp3 no va en un repo público; se sirve desde Supabase Storage.
- Probar en iPhone con el switch de silencio activado.

---

## 6. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Front | Vite + React + TypeScript | Rápido, no necesita SSR |
| Estilos | Tailwind CSS con los tokens de §4 | — |
| Animación | **GSAP** para el timeline de la intro (sincronizado con `audio.currentTime`) + **Framer Motion** para las transiciones de UI | GSAP controla el timeline al milisegundo |
| Avión | SVG/PNG por capas con perspectiva CSS 3D | Three.js para 5 segundos es sobreingeniería en v1 |
| Formularios | React Hook Form + Zod | El mismo esquema valida front y backend |
| Backend | Supabase **en la nube, sin Docker**: Postgres + RLS + funciones RPC + Auth (magic link) + Storage. Dos proyectos gratis: `tc-team-dev` (desarrollo y pruebas) y `tc-team-prod` (datos reales, se crea al cerrar la Fase 2). Región: East US (N. Virginia), la misma de Vercel por defecto | Los datos reales de la familia nunca se mezclan con pruebas |
| Migraciones | Supabase CLI vía `npx`: `migration new` + `db push` contra el proyecto linkeado | — |
| Deploy | Vercel (front) + Supabase (backend) | — |
| Export | SheetJS | — |

---

## 7. Modelo de datos

```sql
create table trip (
  id int primary key default 1 check (id = 1),   -- un solo viaje
  destination text,
  departure_date date,
  return_date date,
  purchase_deadline date,
  purge_after date                                -- fecha de compra + 7 días
);
-- Valor provisional mientras se deciden los días:
-- destination = 'Punta Cana (PUJ)', departure_date = '2027-03-31' (peor caso para validar pasaportes)

create table travelers (
  id uuid primary key default gen_random_uuid(),
  alias text not null,                            -- "Juanchis"
  token_hash text not null unique,                -- sha256 del token del link
  created_at timestamptz not null default now()
);

create table checkins (
  traveler_id uuid primary key references travelers(id) on delete cascade,
  first_names text,
  last_names text,
  sex text check (sex in ('M','F')),
  birth_date date,
  nationality text,
  doc_type text check (doc_type in ('CC','TI','RC','CE','OTRO')),
  doc_number text,
  passport_status text check (passport_status in ('si','en_tramite','no')),
  passport_number text,
  passport_expiry date,
  phone text,
  email text,
  notes text,
  status text not null default 'faltan_datos'
    check (status in ('faltan_datos','pasaporte_pendiente','completo')),
  updated_at timestamptz not null default now()
);

create table admins (email text primary key);
```

---

## 8. Seguridad y privacidad (no negociable)

1. **RLS activado en todas las tablas y cero políticas para `anon`.** Desde el navegador no se puede hacer `select` ni `insert` directo.
2. **Los viajeros solo tocan la BD a través de funciones `security definer`:**
   - `get_checkin(token)` devuelve el alias y los datos propios del viajero.
   - `save_checkin(token, payload)` valida, hace upsert y recalcula `status`.
   - Las dos hashean el token para buscar al viajero. Un token inválido devuelve un error genérico.
   - `create_traveler(alias)` (solo admin) genera el token en la BD con `pgcrypto`, guarda solo el hash y devuelve el link **una sola vez**.
3. **Tokens:** 32 bytes aleatorios en base64url en la URL `/c/<token>`. En la BD solo se guarda el hash.
4. **Links por privado, nunca todos juntos en el grupo:** quien tenga un link puede ver y editar esa fila. Si un link se filtra, se regenera desde el admin.
5. **Admin:** solo puede hacer `select` si `auth.jwt() ->> 'email'` está en `admins`.
6. **Retención:** botón de purga más `purge_after`. Después de comprar se borran documento, pasaporte y fecha de nacimiento.
7. **Nada sensible** en logs, analytics, pasabordo, OG image ni URL (salvo el token).
8. **No indexar:** meta `noindex` + `robots.txt` con `Disallow: /`.
9. **Prueba de aceptación:** desde la consola del navegador, con la anon key, intentar leer `checkins` debe devolver vacío o error.

---

## 9. Compatibilidad y rendimiento

- **Mobile-first.** Android de gama media y iPhone, **abriendo el link desde el navegador interno de WhatsApp.** Se prueba ahí sí o sí.
- **La intro corre a 60 fps en gama media:** solo se animan `transform` y `opacity`, y los desenfoques vienen pre-renderizados en los assets.
- **Primera carga ≤ 2,5 MB**, audio incluido.
- **Preview en WhatsApp:** OG image de 1200×630, morada, con la honey y "TC Team · Check-in a Punta Cana abierto ✈️".

---

## 10. Roadmap

Se construye **todo en una sola sesión, en orden y con una pausa obligatoria al final de cada fase** (§16).

| Fase | Entregable | Hecho cuando |
|---|---|---|
| 0 | Excel compartido | Ya existe; se usa ya, sin depender de la app |
| 1 | Repo + Supabase dev: tablas, RLS, RPC (`get_checkin`, `save_checkin`, `create_traveler`), `/admin` mínimo, export CSV, pruebas | Las pruebas de §16 pasan **y Daniel revisó y aprobó el SQL línea por línea** |
| 2 | Formulario por pasos con validaciones y estados | Flujo completo en el celular desde el navegador de WhatsApp |
| 3 | Splash, música, avión, golpe de la honey | Intro sincronizada con `LOGO_HIT_MS = 3200`, saltable y con reduced-motion. Con placeholder de la honey mientras no exista `honey.svg` |
| 4 | Pasabordo + compartir | PNG sin datos sensibles compartido en WhatsApp |
| 5 | Pulido y salida a producción: OG image, sonidos de UI, purga, crear `tc-team-prod`, aplicar migraciones, deploy en Vercel, generar los links reales | Daniel abre su propio link de prod desde WhatsApp y hace check-in completo |

**Por qué este orden:** los datos van primero. Si se acaba el tiempo, una app fea que funciona sirve; una intro chimba sin backend no sirve para nada.

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| La app no está lista antes de la fecha de compra | Fase 0 (Excel) en paralelo |
| El audio no suena (autoplay, modo silencio) | Splash con toque obligatorio; la intro funciona igual sin audio |
| El avión en SVG se ve barato | Plan B: video pre-renderizado (MP4 con el fondo incluido) o Lottie |
| Reenvían un link | Links por privado + regenerar desde el admin |
| El plan gratis de Supabase pausa el proyecto tras ~7 días sin actividad y el link deja de funcionar | Mientras se recogen datos hay tráfico. Antes de mandar los links, revisar que el proyecto prod esté activo |
| Se filtra la llave secreta (service_role) | No se usa en ningún lado. Los viajeros se crean con la función `create_traveler(alias)`, que solo puede llamar un admin autenticado |
| Nombre mal escrito → boleto inválido | MAYÚSCULAS, aviso fijo, pantalla de revisión y Daniel lo compara con foto del pasaporte antes de pagar |
| El navegador de WhatsApp rompe algo | Probar en Android e iOS desde WhatsApp desde la fase 2 |

---

## 12. Requisitos de entrada a República Dominicana (afectan el formulario)

Según El Espectador (dic. 2023) y Semana (jul. 2024). **Hay que verificarlos con la aerolínea o el consulado antes de pagar.**

- **Visa:** los colombianos no la necesitan para turismo de hasta 30 días; basta con la tarjeta de turista.
- **Pasaporte:** vigente mínimo **6 meses desde la fecha de ingreso**. Sin pasaporte no hay viaje; la cédula no sirve.
- **Pasaje de regreso:** obligatorio.
- **Además pueden pedir:** reserva de hotel, prueba de fondos (extractos bancarios) y carné de vacunación.

Consecuencia para la app: el viajero sin pasaporte vigente queda en `pasaporte_pendiente` y **no se le compra boleto hasta tener número y vencimiento válidos.**

---

## 13. Preguntas abiertas

- [x] ~~Nombre del parche~~ → **TC Team**
- [x] ~~Canción~~ → `intro-tc-team.mp3`, `LOGO_HIT_MS = 3200`
- [x] ~~Destino~~ → **Punta Cana (PUJ)**
- [ ] Logo honey: ¿existe el archivo? (ideal en SVG; si no existe, se diseña)
- [ ] Fechas exactas de ida y regreso (marzo 2027) y fecha límite de compra. **Ojo:** Semana Santa 2027 va del 21 al 28 de marzo, con festivo el lunes 22. Si el viaje cae en esa semana, los pasajes suben fuerte y hay que comprar con más anticipación
- [ ] Lista final de viajeros (¿viaja Emilia?)
- [ ] ¿Qué formato pide la aerolínea o agencia para los datos?
- [ ] Tipo de avión para el asset: ¿comercial, jet privado, avioneta?
- [ ] Dominio: ¿subdominio de Vercel o dominio propio?

---

## 14. Estructura del repo (propuesta)

```
tc-team-checkin/
├─ src/
│  ├─ intro/       Splash, IntroTimeline, Plane, Logo
│  ├─ checkin/     Steps, schema.ts (Zod), Review
│  ├─ pass/        BoardingPass, share.ts
│  ├─ admin/       Login, Board, Export
│  └─ lib/         supabase.ts, audio.ts, tokens.ts
├─ supabase/
│  ├─ migrations/  tablas, RLS, funciones
│  └─ seed.sql     viajeros iniciales
└─ public/         og.png, honey.svg, assets de la intro
                   (intro-tc-team.mp3 va en Supabase Storage, no en el repo)
```

---

## 15. Setup inicial (lo hace Daniel, antes de la sesión)

1. Carpeta `tc-team-checkin/` con este `PROYECTO.md` en la raíz y `intro-tc-team.mp3` en `assets-local/` (ignorada por git).
2. Node LTS instalado. **Sin Docker.**
3. En supabase.com, proyecto `tc-team-dev` en la región East US (N. Virginia). La contraseña de la BD la guarda Daniel y no se comparte con el agente.
4. En *Authentication → URL Configuration*, Site URL = `http://localhost:5173`.
5. Archivo `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (de *Settings → API*). **La service_role / secret key no se copia en ningún lado.**
6. En la terminal, dentro de la carpeta: `npx supabase init`, `npx supabase login` y `npx supabase link --project-ref <ref>`. El `link` pide la contraseña y la escribe Daniel.

---

## 16. Reglas de trabajo para el agente (van también en `CLAUDE.md`)

1. **Plan primero.** Al inicio de cada fase, muestra un plan corto (archivos y orden) y espera el OK de Daniel.
2. **Pausa al final de cada fase.** Muestra qué se hizo, cómo probarlo y qué pruebas pasaron, y espera el OK antes de seguir. La Fase 1 no avanza sin que Daniel apruebe el SQL explícitamente.
3. **Supabase en la nube, sin Docker** (no uses `supabase start`). Las migraciones van en `supabase/migrations` y se aplican con `npx supabase db push`. **Antes de cada `db push`, muestra el SQL y espera el OK.**
4. **Cero llaves secretas.** No pidas ni uses service_role ni la contraseña de la BD. Nunca debilites RLS para "hacer que funcione". Si algo de seguridad choca, para y pregunta.
5. **Pruebas mínimas (Vitest contra `tc-team-dev`, solo con la anon key):**
   - anon NO puede leer ni escribir tablas directo;
   - un token inválido falla;
   - un pasaporte que vence antes de `departure_date + 6 meses` deja el estado en `pasaporte_pendiente`.
   Para el viajero de prueba, propone cómo crearlo sin service_role y espera el OK.
6. **Datos provisionales:** `departure_date = 2027-03-31`. El correo de admin te lo da Daniel en el prompt.
7. **Honey:** mientras no exista `public/honey.svg`, usa un placeholder simple marcado como `TODO` y no inviertas tiempo puliéndolo.
8. **Ante ambigüedades o contradicciones de este documento, pregunta en vez de inventar.**
9. **Stack fijo (§6):** si quieres cambiar una librería, pregunta antes.
