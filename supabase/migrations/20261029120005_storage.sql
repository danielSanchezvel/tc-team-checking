-- ============================================================================
-- 0005 · Storage para el audio de la intro (§5)
-- El mp3 NO va en el repo; se sirve desde Supabase Storage.
-- Bucket público 'intro': lectura pública por URL (el endpoint /object/public/
-- no pasa por RLS). La subida del archivo la hace Daniel desde el dashboard
-- (sin service_role ni llaves en código). No se crean políticas de insert para
-- anon, así que nadie sube archivos desde el navegador.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('intro', 'intro', true)
on conflict (id) do nothing;
