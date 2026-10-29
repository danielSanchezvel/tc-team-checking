-- ============================================================================
-- 0006 · Link grupal (unirse al viaje con un solo link)
-- Modelo: un código de grupo (secreto compartido) deja que cualquiera cree SU
-- propia ficha. join_trip NUNCA lee datos de otros -> RLS sigue intacto (§8.1).
-- El alias sale del formulario (se fija en save_checkin con los nombres).
-- ============================================================================

-- Hash del código de grupo (el código en claro nunca se guarda).
alter table public.trip add column if not exists join_code_hash text;

-- ---------- regenerate_join_code (solo admin) ---------------------------
-- Genera el código de grupo, guarda su hash y lo devuelve UNA sola vez.
create or replace function public.regenerate_join_code()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_code  text;
begin
  if v_email is null
     or not exists (select 1 from public.admins a where lower(a.email) = lower(v_email)) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  v_code := encode(extensions.gen_random_bytes(24), 'base64');
  v_code := replace(replace(replace(v_code, '+', '-'), '/', '_'), '=', '');

  update public.trip
     set join_code_hash = encode(extensions.digest(v_code, 'sha256'), 'hex')
   where id = 1;

  return jsonb_build_object('code', v_code, 'join_path', '/unirse/' || v_code);
end;
$$;

-- ---------- join_trip (anon) --------------------------------------------
-- Verifica el código de grupo y crea una ficha nueva con su token personal.
-- Solo CREA; no lee datos de otros viajeros.
create or replace function public.join_trip(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash   text := encode(extensions.digest(p_code, 'sha256'), 'hex');
  v_stored text;
  v_token  text;
  v_id     uuid;
begin
  select join_code_hash into v_stored from public.trip where id = 1;
  if v_stored is null or v_hash is distinct from v_stored then
    raise exception 'código inválido' using errcode = '28000';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  insert into public.travelers (alias, token_hash)
  values ('', encode(extensions.digest(v_token, 'sha256'), 'hex'))
  returning id into v_id;

  insert into public.checkins (traveler_id) values (v_id);

  return jsonb_build_object('token', v_token, 'link_path', '/c/' || v_token);
end;
$$;

-- ---------- delete_traveler (solo admin) --------------------------------
-- Borra una ficha (checkins cae por cascade). Para limpiar duplicados.
create or replace function public.delete_traveler(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := auth.jwt() ->> 'email';
  v_alias text;
begin
  if v_email is null
     or not exists (select 1 from public.admins a where lower(a.email) = lower(v_email)) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  delete from public.travelers where id = p_id returning alias into v_alias;
  if v_alias is null then
    raise exception 'viajero no encontrado' using errcode = 'P0002';
  end if;

  return jsonb_build_object('deleted', p_id);
end;
$$;

-- ---------- save_checkin: ahora fija el alias con los nombres ------------
-- (igual que 0003 + una línea que pone travelers.alias = nombres del form.)
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

  select departure_date into v_departure from public.trip where id = 1;
  v_min_expiry := v_departure + interval '6 months';

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

  if v_birth is not null and v_birth >= current_date then
    raise exception 'la fecha de nacimiento debe estar en el pasado' using errcode = '22007';
  end if;

  v_required_complete :=
        v_first is not null and v_last is not null and v_sex is not null
    and v_birth is not null and v_nat is not null
    and v_doc_type is not null and v_doc_num is not null
    and v_phone is not null and v_email is not null;

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

  -- Alias para el panel y el pasabordo = nombres del formulario (link grupal).
  if v_first is not null then
    update public.travelers set alias = v_first where id = v_id;
  end if;

  return jsonb_build_object('status', v_status);
end;
$$;

-- ---------- Permisos ----------------------------------------------------
revoke all on function public.regenerate_join_code()   from public;
revoke all on function public.join_trip(text)          from public;
revoke all on function public.delete_traveler(uuid)    from public;

grant execute on function public.regenerate_join_code() to authenticated;
grant execute on function public.join_trip(text)        to anon, authenticated;
grant execute on function public.delete_traveler(uuid)  to authenticated;
