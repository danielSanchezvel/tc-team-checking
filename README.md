# TC Team · Check-in a Punta Cana ✈️

A private, invite-only web app for collecting travel data from a group of friends so
**one person can buy everyone's flight tickets** (CLO → PUJ, Punta Cana). Each friend
opens a single shared group link, fills in their passport/travel details in a short
multi-step form, and gets a boarding-pass style confirmation. The organizer exports the
whole group's data to a spreadsheet and books the trip.

> The site is **private by design**: `noindex`, no public listing, access only by link.

---

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v3** (dark-mode only, custom design tokens)
- **GSAP** (intro animation, synced to audio) + **Framer Motion** (UI transitions)
- **React Hook Form + Zod** (one shared validation schema, front and back)
- **Supabase** (Postgres + Row Level Security + `security definer` RPC + Auth magic link + Storage)
- **SheetJS (xlsx)** for the organizer's data export
- **html-to-image** for the boarding-pass PNG
- Deployed on **Vercel** (frontend) + **Supabase** (backend)

---

## How it works

1. **Group link** — the admin generates one shared link (`/unirse/<code>`) and drops it in
   the WhatsApp group.
2. **Join** — opening the link creates a traveler record and a private token, stored in the
   browser so the friend can come back and edit.
3. **Check-in form** — 4 steps: personal info, document/passport, passport validity, contact.
   Data is saved per step.
4. **Boarding pass** — a shareable confirmation card (never shows document, birth date or
   passport number).
5. **Admin board** (`/admin`, magic-link login) — view status, export everyone's data to
   XLSX/CSV, manage the group link and travelers.

**Status values:** `faltan_datos` · `pasaporte_pendiente` · `completo`.

**Passport rule:** a passport must stay valid for at least 6 months after arrival. With the
provisional departure date `2027-03-31`, it must expire **after `2027-09-30`**; otherwise the
check-in is flagged `pasaporte_pendiente`. The rule is derived from `trip.departure_date`, not
hardcoded.

---

## Security (non-negotiable)

- **RLS enabled on every table; zero policies for `anon`.** You cannot `select`/`insert`
  directly from the browser.
- Travelers only touch the DB through `security definer` functions
  (`get_checkin`, `save_checkin`, `join_trip`); the admin's read access is gated on their
  email being in the `admins` table.
- **Tokens:** 32 random bytes (base64url) in the URL; the DB stores only the **sha256 hash**.
  An invalid token returns a generic error.
- **No service_role key and no DB password** are used anywhere in this repo. RLS is never
  weakened "to make it work".
- Nothing sensitive goes in `localStorage`, logs, the boarding-pass PNG, the OG image or the
  URL (other than the token).

---

## Project structure

```
src/
  checkin/   # the traveler flow: form, steps, schema (Zod), api, join handler
  intro/     # splash + GSAP intro timeline (plane, clouds, honey logo), audio, mute
  pass/      # boarding-pass card + share
  admin/     # admin board: status table, export, group-link + traveler management
  lib/       # routing, token storage, audio singleton
  tests/     # Vitest suites (security, schema, intro, pass, join)
supabase/
  migrations/  # SQL migrations (schema, RLS, functions, seed, storage, group link)
```

---

## Local setup

```bash
npm install
```

Create `.env.local` (git-ignored — never commit it):

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> The **anon key is public by design** (protected by RLS). The `service_role` key and DB
> password are never needed here.

Run the dev server:

```bash
npm run dev
```

---

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                     |
| `npm run build`     | Type-check (`tsc -b`) and build for production |
| `npm run preview`   | Preview the production build locally          |
| `npm test`          | Run the Vitest suite once                     |
| `npm run test:watch`| Run tests in watch mode                       |
| `npm run typecheck` | Type-check without emitting                   |

---

## Database migrations

Migrations live in `supabase/migrations/` and are applied with the Supabase CLI against the
linked cloud project (no Docker, no local Postgres):

```bash
npx supabase db push --linked
```

The intro audio is served from Supabase **Storage** (bucket `intro`) and is **not** committed
to the repo.

---

## Deploy

- **Frontend:** Vercel. SPA routing is handled by `vercel.json` rewrites so `/c/…`,
  `/unirse/…` and `/admin` don't 404. A `noindex` header keeps it out of search engines.
- **Backend:** Supabase cloud — push the migrations, set the group link, configure Auth
  (Site URL + redirect URLs pointing at the deployed domain).

---

## License

Private project. Not for redistribution.
