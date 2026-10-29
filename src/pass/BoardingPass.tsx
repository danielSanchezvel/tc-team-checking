import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Honey from '../intro/Honey';
import type { PassFields } from './passData';
import { sharePass } from './share';

function Stamp({ status }: { status: PassFields['status'] }) {
  const map = {
    completo: { text: 'CHECK-IN OK', color: 'var(--mint-400)' },
    pasaporte_pendiente: { text: 'PENDIENTE', color: 'var(--sun-300)' },
    faltan_datos: { text: 'EN PROCESO', color: 'var(--text-muted)' },
  } as const;
  const s = map[status];
  return (
    <motion.div
      initial={{ rotate: -30, scale: 2.4, opacity: 0 }}
      animate={{ rotate: -14, scale: 1, opacity: 0.92 }}
      transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.25 }}
      className="pointer-events-none absolute right-5 top-16 font-display text-2xl tracking-widest"
      style={{
        color: s.color,
        border: `3px solid ${s.color}`,
        padding: '4px 10px',
        borderRadius: 6,
        mixBlendMode: 'screen',
      }}
    >
      {s.text}
    </motion.div>
  );
}

function PassFront({ fields }: { fields: PassFields }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-violet-300/30 p-5 font-mono text-text"
      style={{
        background: 'linear-gradient(160deg, #2A0B45 0%, #4a1580 55%, #6A1FB5 100%)',
        aspectRatio: '1 / 1.3',
      }}
    >
      {/* Header aerolínea */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.2em] text-violet-300">TC TEAM AIRLINES</span>
        <Honey size={30} />
      </div>

      {/* Ruta */}
      <div className="mt-6 flex items-end justify-between">
        <div>
          <div className="font-display text-5xl leading-none">{fields.from}</div>
          <div className="text-xs text-text-muted">Cali</div>
        </div>
        <div className="pb-2 text-pink-500">✈</div>
        <div className="text-right">
          <div className="font-display text-5xl leading-none">{fields.to}</div>
          <div className="text-xs text-text-muted">Punta Cana</div>
        </div>
      </div>

      {/* Pasajero */}
      <div className="mt-6 border-t border-dashed border-violet-300/30 pt-4">
        <div className="text-[10px] uppercase tracking-widest text-text-muted">Pasajero</div>
        <div className="font-display text-2xl tracking-wide">{fields.alias}</div>
      </div>

      {/* Datos */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <Cell label="Vuelo" value={fields.flight} />
        <Cell label="Puerta" value={fields.gate} />
        <Cell label="Asiento" value={fields.seat} />
      </div>
      <div className="mt-3 text-sm">
        <Cell label="Fecha" value={fields.dateLabel} />
      </div>

      <Stamp status={fields.status} />

      {/* Borde troquelado inferior */}
      <div className="absolute -left-2 bottom-16 h-4 w-4 rounded-full bg-bg-night" />
      <div className="absolute -right-2 bottom-16 h-4 w-4 rounded-full bg-bg-night" />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-text-muted">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  );
}

function PassBack() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center rounded-2xl border border-honey-400/40 p-5 text-center"
      style={{ background: 'radial-gradient(circle at 50% 35%, #2A0B45, #12041F)', aspectRatio: '1 / 1.3' }}
    >
      <Honey size={120} />
      <div className="mt-4 font-display text-3xl tracking-[0.2em] text-text">TC TEAM</div>
      <div className="mt-2 text-xs text-text-muted">Nos vemos en Punta Cana 🍯</div>
    </div>
  );
}

export default function BoardingPass({
  fields,
  onBack,
}: {
  fields: PassFields;
  onBack: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);

  async function share() {
    if (!frontRef.current) return;
    setBusy(true);
    try {
      await sharePass(frontRef.current, fields.alias);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-5">
      <div className="[perspective:1200px]">
        <motion.div
          className="relative [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          aria-label="Voltear pasabordo"
        >
          <div ref={frontRef} className="[backface-visibility:hidden]">
            <PassFront fields={fields} />
          </div>
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <PassBack />
          </div>
        </motion.div>
      </div>

      <p className="mt-3 text-center text-xs text-text-muted">Tócalo para voltearlo</p>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-violet-300/40 px-5 py-3 text-text"
        >
          Atrás
        </button>
        <button
          onClick={share}
          disabled={busy}
          className="flex-1 rounded-xl bg-pink-500 px-5 py-3 font-semibold text-text shadow-tc-neon disabled:opacity-50"
        >
          {busy ? 'Generando…' : 'Compartir por WhatsApp'}
        </button>
      </div>
    </div>
  );
}
