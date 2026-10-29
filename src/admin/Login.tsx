import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Login admin por magic link (§3.5). Como respaldo, si el correo trae un código
// de 6 dígitos, se puede verificar sin depender del redirect.
export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) setError(error.message);
    // Si verifica bien, onAuthStateChange en AdminApp hace el resto.
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="font-display text-3xl tracking-wide text-text">TC TEAM · Admin</h1>
      <p className="mt-1 text-sm text-text-muted">Entra con tu correo autorizado.</p>

      {!sent ? (
        <form onSubmit={sendLink} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-3 text-text outline-none focus:border-violet-300"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-text disabled:opacity-50"
          >
            {busy ? 'Enviando…' : 'Enviar link mágico'}
          </button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="rounded-lg bg-purple-900 p-4 text-sm text-text-muted">
            Te enviamos un link a <span className="text-text">{email}</span>. Ábrelo en este
            mismo navegador. Si el correo trae un código de 6 dígitos, también puedes pegarlo aquí:
          </p>
          <form onSubmit={verifyCode} className="space-y-3">
            <input
              inputMode="numeric"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-3 text-text outline-none focus:border-violet-300"
            />
            <button
              type="submit"
              disabled={busy || code.trim().length === 0}
              className="w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-text disabled:opacity-50"
            >
              {busy ? 'Verificando…' : 'Verificar código'}
            </button>
          </form>
          <button onClick={() => setSent(false)} className="text-sm text-violet-300 underline">
            Usar otro correo
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
