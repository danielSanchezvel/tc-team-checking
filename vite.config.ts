/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// Vitest reutiliza esta config: carga .env/.env.local igual que el dev server,
// así que import.meta.env.VITE_* está disponible en las pruebas de §16.5
// (que corren contra tc-team-dev solo con la anon key).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Site URL de Supabase Auth apunta aquí (§15)
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
