-- ============================================================================
-- 0001 · Esquema base (§7)
-- Tablas: trip (un solo viaje), travelers, checkins, admins.
-- pgcrypto se usa en las funciones (hash sha256 del token y bytes aleatorios).
-- ============================================================================

-- pgcrypto vive en el esquema `extensions` en Supabase (digest, gen_random_bytes).
create extension if not exists pgcrypto with schema extensions;

-- Un único viaje (id fijo = 1).
create table if not exists public.trip (
  id               int primary key default 1 check (id = 1),
  destination      text,
  departure_date   date,
  return_date      date,
  purchase_deadline date,
  purge_after      date   -- fecha de compra + 7 días
);

-- Viajeros: solo alias y el HASH del token. El token en claro nunca se guarda.
create table if not exists public.travelers (
  id          uuid primary key default gen_random_uuid(),
  alias       text not null,
  token_hash  text not null unique,     -- sha256 (hex) del token del link
  created_at  timestamptz not null default now()
);

-- Datos del check-in. Un registro por viajero.
create table if not exists public.checkins (
  traveler_id      uuid primary key references public.travelers(id) on delete cascade,
  first_names      text,
  last_names       text,
  sex              text check (sex in ('M','F')),
  birth_date       date,
  nationality      text,
  doc_type         text check (doc_type in ('CC','TI','RC','CE','OTRO')),
  doc_number       text,
  passport_status  text check (passport_status in ('si','en_tramite','no')),
  passport_number  text,
  passport_expiry  date,
  phone            text,
  email            text,
  notes            text,
  status           text not null default 'faltan_datos'
                     check (status in ('faltan_datos','pasaporte_pendiente','completo')),
  updated_at       timestamptz not null default now()
);

-- Correos autorizados como admin.
create table if not exists public.admins (
  email text primary key
);
