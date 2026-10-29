import { motion } from 'framer-motion';

// Avión cruzando una ruta punteada de CLO a PUJ (§3.3).
export default function Progress({ step, total }: { step: number; total: number }) {
  const pct = Math.max(0, Math.min(1, (step - 1) / total)) * 100;

  return (
    <div className="mb-6">
      <div className="mb-1 flex justify-between font-mono text-xs text-text-muted">
        <span>CLO</span>
        <span>PUJ</span>
      </div>
      <div className="relative h-8">
        {/* Ruta punteada */}
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-violet-300/40" />
        {/* Tramo recorrido */}
        <div
          className="absolute left-2 top-1/2 h-0.5 -translate-y-1/2 bg-pink-500"
          style={{ width: `calc(${pct}% - 4px)` }}
        />
        {/* Avión */}
        <motion.div
          className="absolute top-1/2"
          initial={false}
          animate={{ left: `calc(${pct}% )` }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <span className="text-lg" aria-hidden>
            ✈️
          </span>
        </motion.div>
      </div>
    </div>
  );
}
