/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carga explícita de las VITE_* de .env.local para que Vitest (entorno node)
  // tenga VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en import.meta.env.
  // Las pruebas de §16.5 corren contra tc-team-dev solo con la anon key.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    server: {
      port: 5173, // Site URL de Supabase Auth apunta aquí (§15)
    },
    test: {
      environment: 'node',
      globals: true,
      env,
      // Las pruebas pegan a Supabase en la nube (East US); damos margen a la latencia.
      testTimeout: 20000,
    },
  };
});
