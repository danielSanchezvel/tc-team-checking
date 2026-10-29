import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Login from './Login';
import Board from './Board';

type Gate = 'loading' | 'anon' | 'not_admin' | 'admin';

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [gate, setGate] = useState<Gate>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) {
      setGate('anon');
      return;
    }
    let cancelled = false;
    setGate('loading');
    // La puerta de admin la decide la BD (is_admin), no el front.
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return;
      setGate(!error && data === true ? 'admin' : 'not_admin');
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (gate === 'loading') {
    return <p className="p-6 text-text-muted">Cargando…</p>;
  }

  if (gate === 'anon') {
    return <Login />;
  }

  if (gate === 'not_admin') {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6 text-center">
        <p className="text-text">Este correo no está autorizado como admin.</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 text-sm text-violet-300 underline"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <Board adminEmail={session?.user.email ?? ''} />;
}
