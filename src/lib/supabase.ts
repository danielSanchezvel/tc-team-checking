import { createClient } from '@supabase/supabase-js';

// Cliente Supabase con la ANON KEY únicamente (§4, §8).
// La service_role NUNCA se usa en el front. El acceso a datos de viajeros
// pasa siempre por las funciones RPC security definer (get_checkin / save_checkin),
// y el admin por RLS con auth.jwt()->>'email'.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa .env.local (§15).',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    // El admin usa magic link; persistimos la sesión en el navegador del admin.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
