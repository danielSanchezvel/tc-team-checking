import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { CheckinStatus } from '../admin/types';
import { DOC_TYPE_LABEL, isMinor, type CheckinForm } from './schema';

const STATUS_UI: Record<CheckinStatus, { text: string; className: string }> = {
  faltan_datos: { text: 'Faltan datos', className: 'bg-purple-900 text-text-muted' },
  pasaporte_pendiente: { text: 'Pasaporte pendiente', className: 'bg-sun-300/20 text-sun-300' },
  completo: { text: 'Completo', className: 'bg-mint-400/15 text-mint-400' },
};

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="text-right font-mono text-text">{value || '—'}</span>
    </div>
  );
}

function SectionCard({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (n: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-violet-300/20 bg-purple-900/60 p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-display tracking-wide text-text">{title}</h3>
        <button onClick={() => onEdit(step)} className="text-xs text-violet-300 underline">
          Editar
        </button>
      </div>
      {children}
    </div>
  );
}

export default function Review({
  status,
  onEdit,
  onConfirm,
  onShowPass,
  saving,
  saveError,
}: {
  status: CheckinStatus;
  onEdit: (n: number) => void;
  onConfirm: () => Promise<boolean>;
  onShowPass: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const { watch } = useFormContext<CheckinForm>();
  const v = watch();
  const [confirmed, setConfirmed] = useState(false);
  const st = STATUS_UI[status];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wide text-text">Revisa tu pasabordo</h2>
        <span className={`rounded-full px-3 py-1 text-xs ${st.className}`}>{st.text}</span>
      </div>

      <SectionCard title="Quién eres" step={1} onEdit={onEdit}>
        <Row label="Nombres" value={v.first_names} />
        <Row label="Apellidos" value={v.last_names} />
        <Row label="Sexo" value={v.sex === 'M' ? 'Hombre' : v.sex === 'F' ? 'Mujer' : ''} />
        <Row label="Nacimiento" value={v.birth_date} />
        {v.birth_date && isMinor(v.birth_date) && <Row label="" value="Menor de 18" />}
        <Row label="Nacionalidad" value={v.nationality} />
      </SectionCard>

      <SectionCard title="Documento" step={2} onEdit={onEdit}>
        <Row label="Tipo" value={v.doc_type ? DOC_TYPE_LABEL[v.doc_type] : ''} />
        <Row label="Número" value={v.doc_number} />
      </SectionCard>

      <SectionCard title="Pasaporte" step={3} onEdit={onEdit}>
        <Row
          label="Estado"
          value={
            v.passport_status === 'si'
              ? 'Sí'
              : v.passport_status === 'en_tramite'
                ? 'En trámite'
                : v.passport_status === 'no'
                  ? 'No'
                  : ''
          }
        />
        {v.passport_status === 'si' && (
          <>
            <Row label="Número" value={v.passport_number} />
            <Row label="Vence" value={v.passport_expiry} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Contacto" step={4} onEdit={onEdit}>
        <Row label="Celular" value={v.phone} />
        <Row label="Correo" value={v.email} />
        <Row label="Observaciones" value={v.notes} />
      </SectionCard>

      {saveError && <p className="text-sm text-red-400">{saveError}</p>}

      {confirmed ? (
        <div className="rounded-xl border border-mint-400/30 bg-mint-400/10 p-4 text-center">
          <p className="text-text">¡Listo! Tus datos quedaron guardados.</p>
          <p className="mt-1 text-sm text-text-muted">
            {status === 'completo'
              ? 'Estás en Completo. '
              : status === 'pasaporte_pendiente'
                ? 'Quedas en Pasaporte pendiente hasta tener pasaporte vigente. '
                : 'Aún faltan datos para quedar Completo. '}
            Ya puedes ver tu pasabordo.
          </p>
          <button
            onClick={onShowPass}
            className="mt-4 w-full rounded-xl bg-pink-500 px-5 py-3 font-semibold text-text shadow-tc-neon"
          >
            Ver mi pasabordo ✈
          </button>
        </div>
      ) : (
        <button
          onClick={async () => {
            const ok = await onConfirm();
            if (ok) setConfirmed(true);
          }}
          disabled={saving}
          className="w-full rounded-xl bg-pink-500 px-5 py-3 font-semibold text-text shadow-tc-neon disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Confirmar check-in'}
        </button>
      )}
    </div>
  );
}
