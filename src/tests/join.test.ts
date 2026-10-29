import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

describe('Link grupal: seguridad', () => {
  it('join_trip con código inválido falla', async () => {
    const { error } = await anon.rpc('join_trip', { p_code: 'codigo-que-no-existe' });
    expect(error).not.toBeNull();
  });

  it('anon no puede regenerar el código de grupo', async () => {
    const { error } = await anon.rpc('regenerate_join_code');
    expect(error).not.toBeNull();
  });

  it('anon no puede borrar viajeros', async () => {
    const { error } = await anon.rpc('delete_traveler', {
      p_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(error).not.toBeNull();
  });
});

// Necesita el código de grupo real (generado por el admin en /admin).
// Ponlo en .env.local como VITE_TEST_JOIN_CODE para correr esta prueba.
const code = import.meta.env.VITE_TEST_JOIN_CODE as string | undefined;

describe('Link grupal: unirse', () => {
  it.skipIf(!code)('join_trip con código válido crea ficha y su token sirve', async () => {
    const { data, error } = await anon.rpc('join_trip', { p_code: code });
    expect(error).toBeNull();
    const token = (data as { token: string }).token;
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const { data: gc, error: ge } = await anon.rpc('get_checkin', { p_token: token });
    expect(ge).toBeNull();
    expect((gc as { checkin: unknown }).checkin).toBeTruthy();
  });
});
