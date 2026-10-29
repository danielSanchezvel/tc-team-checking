-- ============================================================================
-- 0004 · Seed (idempotente)
-- Va como migración (no como supabase/seed.sql) porque `db push` contra la nube
-- NO ejecuta seed.sql; solo aplica migraciones.
-- ============================================================================

-- Viaje provisional (§7, §16.6). Las fechas exactas se ajustan luego cambiando
-- departure_date; la regla de pasaporte se recalcula sola.
insert into public.trip (id, destination, departure_date)
values (1, 'Punta Cana (PUJ)', '2027-03-31')
on conflict (id) do nothing;

-- Admin (correo dado por Daniel). Guardado en minúsculas.
insert into public.admins (email)
values (lower('danielsanchezvel@hotmail.com'))
on conflict (email) do nothing;
