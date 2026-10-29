import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Pruebas de §16.5 contra tc-team-dev SOLO con la anon key (nunca service_role).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local');
}

// Cliente anónimo, sin sesión (como un viajero o un curioso con la anon key).
const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

describe('RLS: anon no puede tocar las tablas directo (§8.1, §8.9)', () => {
  // SELECT: debe venir vacío o con error (nunca filas).
  for (const table of ['travelers', 'checkins', 'trip', 'admins'] as const) {
    it(`select en ${table} no devuelve filas`, async () => {
      const { data, error } = await anon.from(table).select('*');
      const vacio = (data?.length ?? 0) === 0;
      expect(Boolean(error) || vacio).toBe(true);
    });
  }

  it('insert en checkins falla', async () => {
    const { error } = await anon
      .from('checkins')
      .insert({ traveler_id: '00000000-0000-0000-0000-000000000000' });
    expect(error).not.toBeNull();
  });

  it('insert en travelers falla', async () => {
    const { error } = await anon
      .from('travelers')
      .insert({ alias: 'hacker', token_hash: 'x' });
    expect(error).not.toBeNull();
  });

  it('anon no puede llamar create_traveler', async () => {
    const { error } = await anon.rpc('create_traveler', { p_alias: 'hacker' });
    expect(error).not.toBeNull();
  });
});

describe('Tokens: un token inválido falla (§8.2, §8.3)', () => {
  it('get_checkin con token basura falla', async () => {
    const { error } = await anon.rpc('get_checkin', { p_token: 'token-que-no-existe' });
    expect(error).not.toBeNull();
  });

  it('save_checkin con token basura falla', async () => {
    const { error } = await anon.rpc('save_checkin', {
      p_token: 'token-que-no-existe',
      p_payload: { first_names: 'X' },
    });
    expect(error).not.toBeNull();
  });
});

// Necesita un viajero de prueba creado desde /admin (decisión de Daniel):
// crea el viajero "PRUEBA", copia su token y ponlo en .env.local como
//   VITE_TEST_TRAVELER_TOKEN=...
// Si no está, esta prueba se marca como omitida (no falla la suite).
const testToken = import.meta.env.VITE_TEST_TRAVELER_TOKEN as string | undefined;

const payloadBase = {
  first_names: 'TEST',
  last_names: 'PRUEBA',
  sex: 'M',
  birth_date: '1990-01-01',
  nationality: 'Colombiana',
  doc_type: 'CC',
  doc_number: '1234567890',
  phone: '3001234567',
  email: 'prueba@tc.team',
  passport_status: 'si',
  passport_number: 'AB1234567',
};

describe('Regla de pasaporte -> status (§3.3, §16.5)', () => {
  // departure_date = 2027-03-31  =>  debe vencer DESPUÉS del 2027-09-30.
  it.skipIf(!testToken)(
    'pasaporte que vence antes de departure+6m queda en pasaporte_pendiente',
    async () => {
      const { data, error } = await anon.rpc('save_checkin', {
        p_token: testToken,
        p_payload: { ...payloadBase, passport_expiry: '2027-06-01' }, // antes del corte
      });
      expect(error).toBeNull();
      expect((data as { status: string }).status).toBe('pasaporte_pendiente');
    },
  );

  it.skipIf(!testToken)(
    'pasaporte que vence después de departure+6m queda en completo',
    async () => {
      const { data, error } = await anon.rpc('save_checkin', {
        p_token: testToken,
        p_payload: { ...payloadBase, passport_expiry: '2027-10-01' }, // después del corte
      });
      expect(error).toBeNull();
      expect((data as { status: string }).status).toBe('completo');
    },
  );
});
