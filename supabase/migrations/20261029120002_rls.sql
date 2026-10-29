-- ============================================================================
-- 0002 · RLS (§8)
-- RLS activado en TODAS las tablas. CERO políticas para `anon`:
-- desde el navegador no se puede select/insert directo.
-- El admin (correo en `admins`) puede SELECT vía auth.jwt()->>'email'.
-- Los viajeros entran solo por las funciones security definer (0003).
-- ============================================================================

alter table public.trip      enable row level security;
alter table public.travelers enable row level security;
alter table public.checkins  enable row level security;
alter table public.admins    enable row level security;

-- Helper: ¿el usuario autenticado es admin? (comparación case-insensitive)
-- security definer para poder leer `admins` aunque tenga RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Políticas de SELECT solo para admin autenticado.
-- (No hay políticas para anon en ninguna tabla: queda todo denegado por defecto.)
create policy admin_select_trip on public.trip
  for select to authenticated using (public.is_admin());

create policy admin_select_travelers on public.travelers
  for select to authenticated using (public.is_admin());

create policy admin_select_checkins on public.checkins
  for select to authenticated using (public.is_admin());

create policy admin_select_admins on public.admins
  for select to authenticated using (public.is_admin());
