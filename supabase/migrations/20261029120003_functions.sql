-- ============================================================================
-- 0003 · Funciones RPC security definer (§8.2)
--   get_checkin(token)         -> alias + datos propios del viajero
--   save_checkin(token, json)  -> valida, upsert y recalcula status
--   create_traveler(alias)     -> SOLO admin; genera token, guarda hash, link 1 vez
--   regenerate_token(id)       -> SOLO admin; nuevo token para un viajero
-- Todas:
--   - search_path = '' y todo esquema-cualificado (seguridad).
--   - el token se hashea (sha256 hex) para buscar al viajero.
--   - token inválido -> error genérico.
-- ============================================================================

-- ---------- get_checkin --------------------------------------------------
create or replace function public.get_checkin(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash     text := encode(extensions.digest(p_token, 'sha256'), 'hex');
  v_traveler public.travelers;
  v_checkin  public.checkins;
  v_trip     public.trip;
begin
  select * into v_traveler from public.travelers where token_hash = v_hash;
  if not found then
    raise exception 'token inválido' using errcode = '28000';
  end if;

  select * into v_checkin from public.checkins where traveler_id = v_traveler.id;
  select * into v_trip     from public.trip     where id = 1;

  return jsonb_build_object(
    'alias',   v_traveler.alias,
    'trip',    to_jsonb(v_trip),
    'checkin', to_jsonb(v_checkin)
  );
end;
$$;

-- ---------- save_checkin -------------------------------------------------
create or replace function public.save_checkin(p_token text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash      text := encode(extensions.digest(p_token, 'sha256'), 'hex');
  v_id        uuid;
  v_departure date;
  v_min_expiry date;
  v_status    text;

  v_first text; v_last text; v_sex text; v_birth date; v_nat text;
  v_doc_type text; v_doc_num text;
  v_pp_status text; v_pp_num text; v_pp_exp date;
  v_phone text; v_email text; v_notes text;

  v_required_complete boolean;
  v_passport_ok       boolean;
begin
  select id into v_id from public.travelers where token_hash = v_hash;
  if v_id is null then
    raise exception 'token inválido' using errcode = '28000';
  end if;

  -- La regla de pasaporte se deriva de trip.departure_date (no se hardcodea).
  -- República Dominicana exige 6 meses de vigencia desde el ingreso (§3.3, §12).
  select departure_date into v_departure from public.trip where id = 1;
  v_min_expiry := v_departure + interval '6 months';

  -- Extraer payload (claves snake_case). Cadenas vacías -> null.
  v_first     := upper(nullif(btrim(p_payload->>'first_names'), ''));
  v_last      := upper(nullif(btrim(p_payload->>'last_names'),  ''));
  v_sex       := nullif(p_payload->>'sex', '');
  v_birth     := nullif(p_payload->>'birth_date', '')::date;
  v_nat       := nullif(btrim(p_payload->>'nationality'), '');
  v_doc_type  := nullif(p_payload->>'doc_type', '');
  v_doc_num   := nullif(btrim(p_payload->>'doc_number'), '');
  v_pp_status := nullif(p_payload->>'passport_status', '');
  v_pp_num    := nullif(btrim(p_payload->>'passport_number'), '');
  v_pp_exp    := nullif(p_payload->>'passport_expiry', '')::date;
  v_phone     := nullif(btrim(p_payload->>'phone'), '');
  v_email     := nullif(btrim(p_payload->>'email'), '');
  v_notes     := nullif(btrim(p_payload->>'notes'), '');

  -- Guarda mínima: fecha de nacimiento en el pasado (§3.3).
  if v_birth is not null and v_birth >= current_date then
    raise exception 'la fecha de nacimiento debe estar en el pasado' using errcode = '22007';
  end if;

  -- Datos requeridos (sin contar pasaporte) para poder quedar completo.
  v_required_complete :=
        v_first is not null and v_last is not null and v_sex is not null
    and v_birth is not null and v_nat is not null
    and v_doc_type is not null and v_doc_num is not null
    and v_phone is not null and v_email is not null;

  -- Pasaporte OK = existe, con número y vence DESPUÉS de departure + 6 meses.
  v_passport_ok :=
        v_pp_status = 'si' and v_pp_num is not null
    and v_pp_exp is not null and v_pp_exp > v_min_expiry;

  if not v_required_complete then
    v_status := 'faltan_datos';
  elsif not v_passport_ok then
    v_status := 'pasaporte_pendiente';
  else
    v_status := 'completo';
  end if;

  insert into public.checkins (
    traveler_id, first_names, last_names, sex, birth_date, nationality,
    doc_type, doc_number, passport_status, passport_number, passport_expiry,
    phone, email, notes, status, updated_at
  ) values (
    v_id, v_first, v_last, v_sex, v_birth, v_nat,
    v_doc_type, v_doc_num, v_pp_status, v_pp_num, v_pp_exp,
    v_phone, v_email, v_notes, v_status, now()
  )
  on conflict (traveler_id) do update set
    first_names     = excluded.first_names,
    last_names      = excluded.last_names,
    sex             = excluded.sex,
    birth_date      = excluded.birth_date,
    nationality     = excluded.nationality,
    doc_type        = excluded.doc_type,
    doc_number      = excluded.doc_number,
    passport_status = excluded.passport_status,
    passport_number = excluded.passport_number,
    passport_expiry = excluded.passport_expiry,
    phone           = excluded.phone,
    email           = excluded.email,
    notes           = excluded.notes,
    status          = excluded.status,
    updated_at      = now();

  return jsonb_build_object('status', v_status);
end;
$$;

-- ---------- create_traveler (solo admin) --------------------------------
create or replace function public.create_traveler(p_alias text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_token text;
  v_id    uuid;
begin
  if v_email is null
     or not exists (select 1 from public.admins a where lower(a.email) = lower(v_email)) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  if p_alias is null or length(btrim(p_alias)) = 0 then
    raise exception 'alias requerido' using errcode = '22023';
  end if;

  -- Token: 32 bytes aleatorios en base64url (sin padding).
  v_token := encode(extensions.gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  insert into public.travelers (alias, token_hash)
  values (btrim(p_alias), encode(extensions.digest(v_token, 'sha256'), 'hex'))
  returning id into v_id;

  insert into public.checkins (traveler_id) values (v_id);

  -- El token en claro se devuelve UNA sola vez; en la BD solo queda el hash.
  return jsonb_build_object(
    'traveler_id', v_id,
    'alias',       btrim(p_alias),
    'token',       v_token,
    'link_path',   '/c/' || v_token
  );
end;
$$;

-- ---------- regenerate_token (solo admin) -------------------------------
create or replace function public.regenerate_token(p_traveler_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_token text;
  v_alias text;
begin
  if v_email is null
     or not exists (select 1 from public.admins a where lower(a.email) = lower(v_email)) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  update public.travelers
     set token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex')
   where id = p_traveler_id
  returning alias into v_alias;

  if v_alias is null then
    raise exception 'viajero no encontrado' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'traveler_id', p_traveler_id,
    'alias',       v_alias,
    'token',       v_token,
    'link_path',   '/c/' || v_token
  );
end;
$$;

-- ---------- Permisos de ejecución ---------------------------------------
-- Viajeros (anon) solo pueden llamar get_checkin / save_checkin.
-- create_traveler / regenerate_token: solo authenticated (y además validan admin).
revoke all on function public.get_checkin(text)                from public;
revoke all on function public.save_checkin(text, jsonb)        from public;
revoke all on function public.create_traveler(text)            from public;
revoke all on function public.regenerate_token(uuid)           from public;

grant execute on function public.get_checkin(text)         to anon, authenticated;
grant execute on function public.save_checkin(text, jsonb) to anon, authenticated;
grant execute on function public.create_traveler(text)     to authenticated;
grant execute on function public.regenerate_token(uuid)    to authenticated;
