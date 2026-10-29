import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Checkin, IssuedLink, TravelerRow } from './types';
import { exportCSV, exportXLSX } from './export';
import { isMinor } from '../checkin/schema';

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  faltan_datos: { text: 'Faltan datos', className: 'bg-purple-900 text-text-muted' },
  pasaporte_pendiente: { text: 'Pasaporte pendiente', className: 'bg-sun-300/20 text-sun-300' },
  completo: { text: 'Completo', className: 'bg-mint-400/15 text-mint-400' },
};

function fullLink(path: string): string {
  return `${window.location.origin}${path}`;
}

export default function Board({ adminEmail }: { adminEmail: string }) {
  const [rows, setRows] = useState<TravelerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alias, setAlias] = useState('');
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [groupLink, setGroupLink] = useState<string | null>(null);
  const [groupCopied, setGroupCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // RLS permite este select solo al admin (auth.jwt()->>'email' en admins).
    const { data, error } = await supabase
      .from('travelers')
      .select('id, alias, created_at, checkins(*)')
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows(
        (data ?? []).map((t) => {
          const raw = (t as { checkins: Checkin | Checkin[] | null }).checkins;
          const checkin = Array.isArray(raw) ? (raw[0] ?? null) : raw;
          return { id: t.id, alias: t.alias, created_at: t.created_at, checkin };
        }),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTraveler(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.rpc('create_traveler', { p_alias: alias.trim() });
    if (error) {
      setError(error.message);
      return;
    }
    setAlias('');
    setIssued(data as IssuedLink);
    setCopied(false);
    void load();
  }

  async function generateGroupLink() {
    setError(null);
    const { data, error } = await supabase.rpc('regenerate_join_code');
    if (error) {
      setError(error.message);
      return;
    }
    setGroupLink(fullLink((data as { join_path: string }).join_path));
    setGroupCopied(false);
  }

  async function copyGroup() {
    if (!groupLink) return;
    try {
      await navigator.clipboard.writeText(groupLink);
      setGroupCopied(true);
    } catch {
      setGroupCopied(false);
    }
  }

  async function removeTraveler(id: string) {
    setError(null);
    const { error } = await supabase.rpc('delete_traveler', { p_id: id });
    setConfirmDelete(null);
    if (error) {
      setError(error.message);
      return;
    }
    void load();
  }

  async function regenerate(id: string) {
    setError(null);
    const { data, error } = await supabase.rpc('regenerate_token', { p_traveler_id: id });
    if (error) {
      setError(error.message);
      return;
    }
    setIssued(data as IssuedLink);
    setCopied(false);
  }

  async function copyIssued() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(fullLink(issued.link_path));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide text-text">TC TEAM · Salidas</h1>
          <p className="text-sm text-text-muted">{adminEmail}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-violet-300 underline"
        >
          Salir
        </button>
      </header>

      {/* Link de grupo (principal) */}
      <div className="mt-6 rounded-lg border border-violet-300/30 bg-purple-900/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display tracking-wide text-text">Link de grupo</h2>
            <p className="text-xs text-text-muted">
              Pégalo en el grupo. Cada quien llena su propia ficha.
            </p>
          </div>
          <button
            onClick={generateGroupLink}
            className="shrink-0 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-text"
          >
            {groupLink ? 'Regenerar' : 'Generar link'}
          </button>
        </div>
        {groupLink && (
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-bg-night px-3 py-2 font-mono text-xs text-text">
              {groupLink}
            </code>
            <button
              onClick={copyGroup}
              className="shrink-0 rounded-lg bg-pink-500 px-3 py-2 text-sm font-semibold text-text"
            >
              {groupCopied ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        )}
      </div>

      {/* Crear viajero individual (respaldo) */}
      <form onSubmit={createTraveler} className="mt-4 flex gap-2">
        <input
          placeholder="Link individual (respaldo): alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          required
          className="flex-1 rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-2.5 text-text outline-none focus:border-violet-300"
        />
        <button
          type="submit"
          className="rounded-lg border border-violet-300/40 px-4 py-2.5 font-semibold text-text"
        >
          Crear
        </button>
      </form>

      {/* Link emitido (se ve una sola vez) */}
      {issued && (
        <div className="mt-4 rounded-lg border border-pink-500/40 bg-purple-900 p-4">
          <p className="text-sm text-text-muted">
            Link de <span className="text-text">{issued.alias}</span> — cópialo ahora, no se
            vuelve a mostrar:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-bg-night px-3 py-2 font-mono text-xs text-text">
              {fullLink(issued.link_path)}
            </code>
            <button
              onClick={copyIssued}
              className="shrink-0 rounded-lg bg-pink-500 px-3 py-2 text-sm font-semibold text-text"
            >
              {copied ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
          <button onClick={() => setIssued(null)} className="mt-2 text-xs text-violet-300 underline">
            Ocultar
          </button>
        </div>
      )}

      {/* Export */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => exportXLSX(rows)}
          disabled={rows.length === 0}
          className="rounded-lg border border-violet-300/40 px-3 py-2 text-sm text-text disabled:opacity-40"
        >
          Exportar XLSX
        </button>
        <button
          onClick={() => exportCSV(rows)}
          disabled={rows.length === 0}
          className="rounded-lg border border-violet-300/40 px-3 py-2 text-sm text-text disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      {/* Tabla tipo pantalla de salidas */}
      <div className="mt-4 overflow-hidden rounded-lg border border-violet-300/20">
        {loading ? (
          <p className="p-4 text-text-muted">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-text-muted">Aún no hay viajeros. Crea el primero arriba.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-purple-900 text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Viajero</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Actualizado</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const st = STATUS_LABEL[t.checkin?.status ?? 'faltan_datos'];
                return (
                  <tr key={t.id} className="border-t border-violet-300/10">
                    <td className="px-4 py-3 font-mono text-text">
                      {t.alias}
                      {isMinor(t.checkin?.birth_date) && (
                        <span className="ml-2 rounded-full bg-sun-300/20 px-2 py-0.5 text-xs text-sun-300">
                          menor
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${st.className}`}>
                        {st.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {t.checkin ? new Date(t.checkin.updated_at).toLocaleString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === t.id ? (
                        <span className="text-xs">
                          <span className="text-text-muted">¿Borrar?</span>{' '}
                          <button
                            onClick={() => removeTraveler(t.id)}
                            className="text-red-400 underline"
                          >
                            Sí
                          </button>{' '}
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-violet-300 underline"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <span className="flex justify-end gap-3">
                          <button
                            onClick={() => regenerate(t.id)}
                            className="text-xs text-violet-300 underline"
                          >
                            Regenerar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t.id)}
                            className="text-xs text-red-400 underline"
                          >
                            Borrar
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
