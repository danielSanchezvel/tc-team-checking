import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import type { Checkin, CheckinStatus } from '../admin/types';
import { getCheckin, saveCheckin, type GetCheckinResult } from './api';
import { makeCheckinSchema, STEP_FIELDS, type CheckinForm } from './schema';
import Progress from './Progress';
import { Step1, Step2, Step3, Step4 } from './steps';
import Review from './Review';
import Splash from '../intro/Splash';
import IntroTimeline from '../intro/IntroTimeline';
import MuteButton from '../intro/MuteButton';
import { introAudio } from '../lib/audio';

const DEPARTURE_FALLBACK = '2027-03-31'; // peor caso (§16.6); normalmente llega del trip.
const INTRO_SEEN_KEY = 'tc_intro_seen';

function readIntroSeen(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function writeIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* modo privado: se mostrará la intro completa de nuevo, no pasa nada */
  }
}

function toDefaults(c: Checkin | null): CheckinForm {
  return {
    first_names: c?.first_names ?? '',
    last_names: c?.last_names ?? '',
    sex: (c?.sex ?? '') as CheckinForm['sex'],
    birth_date: c?.birth_date ?? '',
    nationality: c?.nationality ?? '',
    doc_type: (c?.doc_type ?? '') as CheckinForm['doc_type'],
    doc_number: c?.doc_number ?? '',
    passport_status: (c?.passport_status ?? '') as CheckinForm['passport_status'],
    passport_number: c?.passport_number ?? '',
    passport_expiry: c?.passport_expiry ?? '',
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    notes: c?.notes ?? '',
  };
}

type Phase = 'splash' | 'intro' | 'welcome' | 'form' | 'review';
const LAST_STEP = 4;

export default function CheckinApp({ token }: { token: string }) {
  const [load, setLoad] = useState<'loading' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<GetCheckinResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCheckin(token)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoad('ready');
      })
      .catch(() => {
        if (!cancelled) setLoad('error');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (load === 'loading') {
    return <Centered>Abriendo tu check-in…</Centered>;
  }
  if (load === 'error' || !data) {
    return (
      <Centered>
        <p className="text-text">Este link no es válido.</p>
        <p className="mt-2 text-sm text-text-muted">
          Pídele a Daniel que te reenvíe tu link personal.
        </p>
      </Centered>
    );
  }

  return <CheckinFlow token={token} data={data} />;
}

function CheckinFlow({ token, data }: { token: string; data: GetCheckinResult }) {
  const departure = data.trip?.departure_date ?? DEPARTURE_FALLBACK;
  const schema = useMemo(() => makeCheckinSchema(departure), [departure]);

  const methods = useForm<CheckinForm>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(data.checkin),
    mode: 'onTouched',
  });

  // El splash sale SIEMPRE (es el toque que desbloquea el audio, así suena en
  // cada visita). En visitas siguientes la intro es corta (§3) vía wasSeen.
  const wasSeen = useRef(readIntroSeen());
  const [phase, setPhase] = useState<Phase>('splash');
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<CheckinStatus>(data.checkin?.status ?? 'faltan_datos');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleIntroDone() {
    writeIntroSeen();
    introAudio.enterFormMode(); // música al 30 % en loop durante el formulario (§5)
    setPhase('welcome');
  }

  // Guarda el payload ACUMULADO (todo lo conocido), para no borrar otros pasos.
  async function persist() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await saveCheckin(token, methods.getValues());
      setStatus(res.status);
      return true;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'No se pudo guardar');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    const ok = await methods.trigger(STEP_FIELDS[step]);
    if (!ok) return;
    await persist(); // guardado por paso al avanzar (§3.3)
    if (step < LAST_STEP) setStep((s) => s + 1);
    else setPhase('review');
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
    else setPhase('welcome');
  }

  function editSection(n: number) {
    setStep(n);
    setPhase('form');
  }

  if (phase === 'splash') {
    return <Splash onAbordar={() => setPhase('intro')} />;
  }

  if (phase === 'intro') {
    return <IntroTimeline short={wasSeen.current} onDone={handleIntroDone} />;
  }

  if (phase === 'welcome') {
    return (
      <Centered>
        <MuteButton />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <p className="font-display text-4xl tracking-wide text-text">
            {data.alias}, tu vuelo abrió check-in
          </p>
          <p className="mt-3 text-text-muted">
            Llena tus datos tal cual salen en el pasaporte. Toma menos de 3 minutos.
          </p>
          <button
            onClick={() => {
              introAudio.resume(); // arranca la música si no venía sonando (visitas siguientes)
              setPhase('form');
            }}
            className="mt-8 rounded-xl bg-pink-500 px-8 py-3 font-semibold text-text shadow-tc-neon"
          >
            Empezar check-in
          </button>
        </motion.div>
      </Centered>
    );
  }

  return (
    <FormProvider {...methods}>
      <MuteButton />
      <div className="mx-auto min-h-screen max-w-md p-4 sm:p-6">
        <Progress step={phase === 'review' ? LAST_STEP + 1 : step} total={LAST_STEP} />

        {phase === 'form' ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              >
                {step === 1 && <Step1 />}
                {step === 2 && <Step2 />}
                {step === 3 && <Step3 />}
                {step === 4 && <Step4 />}
              </motion.div>
            </AnimatePresence>

            {saveError && <p className="mt-3 text-sm text-red-400">{saveError}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={back}
                className="rounded-xl border border-violet-300/40 px-5 py-3 text-text"
              >
                Atrás
              </button>
              <button
                onClick={next}
                disabled={saving}
                className="flex-1 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-text disabled:opacity-50"
              >
                {saving ? 'Guardando…' : step < LAST_STEP ? 'Siguiente' : 'Revisar'}
              </button>
            </div>
          </>
        ) : (
          <Review
            status={status}
            onEdit={editSection}
            onConfirm={persist}
            saving={saving}
            saveError={saveError}
          />
        )}
      </div>
    </FormProvider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-tc-signature p-6 text-center">
      {children}
    </main>
  );
}
