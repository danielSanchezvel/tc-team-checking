import { useEffect, useState } from 'react';
import { joinTrip } from './api';
import { readSavedToken, writeSavedToken } from '../lib/token';
import CheckinApp from './CheckinApp';

// Link de grupo /unirse/<código>: si ya hay token guardado, continúa esa ficha;
// si no, crea una ficha nueva con join_trip y guarda el token personal.
export default function JoinApp({ code }: { code: string }) {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = readSavedToken();
    if (saved) {
      setToken(saved);
      setState('ready');
      return;
    }
    let cancelled = false;
    joinTrip(code)
      .then((r) => {
        if (cancelled) return;
        writeSavedToken(r.token);
        setToken(r.token);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state === 'loading') {
    return <Centered>Uniéndote al viaje…</Centered>;
  }
  if (state === 'error' || !token) {
    return (
      <Centered>
        <p className="text-text">Este link de grupo no es válido o venció.</p>
        <p className="mt-2 text-sm text-text-muted">Pídele a Daniel el link actualizado.</p>
      </Centered>
    );
  }

  return <CheckinApp token={token} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-tc-signature p-6 text-center">
      {children}
    </main>
  );
}
