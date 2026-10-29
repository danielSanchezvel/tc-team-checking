import { useFormContext } from 'react-hook-form';
import {
  DOC_TYPES,
  DOC_TYPE_LABEL,
  PASSPORT_NOTICE,
  isMinor,
  type CheckinForm,
} from './schema';
import { DateInput, RadioRow, Select, TextInput, UpperInput } from './fields';

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-widest text-violet-300">Paso {n} de 4</p>
      <h2 className="font-display text-2xl tracking-wide text-text">{children}</h2>
    </div>
  );
}

export function Step1() {
  const { watch } = useFormContext<CheckinForm>();
  const birth = watch('birth_date');
  return (
    <section className="space-y-4">
      <StepTitle n={1}>Quién eres</StepTitle>
      <UpperInput name="first_names" label="Nombres (igual al pasaporte)" />
      <UpperInput name="last_names" label="Apellidos (igual al pasaporte)" />
      <p className="rounded-lg bg-purple-900 px-3 py-2 text-sm text-sun-300">{PASSPORT_NOTICE}</p>
      <RadioRow
        name="sex"
        label="Sexo"
        options={[
          { value: 'M', label: 'Hombre' },
          { value: 'F', label: 'Mujer' },
        ]}
      />
      <DateInput name="birth_date" label="Fecha de nacimiento" />
      {birth && isMinor(birth) && (
        <p className="rounded-lg bg-sun-300/15 px-3 py-2 text-sm text-sun-300">
          Eres menor de 18. Salir del país exige requisitos extra; Daniel te contactará.
        </p>
      )}
      <TextInput name="nationality" label="Nacionalidad" placeholder="Colombiana" />
    </section>
  );
}

export function Step2() {
  return (
    <section className="space-y-4">
      <StepTitle n={2}>Documento</StepTitle>
      <Select
        name="doc_type"
        label="Tipo de documento"
        options={DOC_TYPES.map((v) => ({ value: v, label: DOC_TYPE_LABEL[v] }))}
      />
      <TextInput name="doc_number" label="Número de documento" inputMode="numeric" />
    </section>
  );
}

export function Step3() {
  const { watch } = useFormContext<CheckinForm>();
  const status = watch('passport_status');
  return (
    <section className="space-y-4">
      <StepTitle n={3}>Pasaporte</StepTitle>
      <RadioRow
        name="passport_status"
        label="¿Tienes pasaporte?"
        options={[
          { value: 'si', label: 'Sí' },
          { value: 'en_tramite', label: 'En trámite' },
          { value: 'no', label: 'No' },
        ]}
      />
      {status === 'si' && (
        <>
          <TextInput name="passport_number" label="Número de pasaporte" />
          <DateInput name="passport_expiry" label="Fecha de vencimiento" />
          <p className="rounded-lg bg-purple-900 px-3 py-2 text-sm text-text-muted">
            República Dominicana exige el pasaporte vigente al menos 6 meses desde el ingreso.
          </p>
        </>
      )}
      {(status === 'en_tramite' || status === 'no') && (
        <p className="rounded-lg bg-sun-300/15 px-3 py-2 text-sm text-sun-300">
          Puedes guardar igual, pero no quedas en <b>Completo</b> hasta tener el pasaporte.
        </p>
      )}
    </section>
  );
}

export function Step4() {
  const { register } = useFormContext<CheckinForm>();
  return (
    <section className="space-y-4">
      <StepTitle n={4}>Contacto</StepTitle>
      <TextInput name="phone" label="Celular" inputMode="tel" placeholder="3001234567" />
      <TextInput name="email" label="Correo" type="email" inputMode="email" />
      <div>
        <label className="mb-1 block text-sm text-text-muted">
          Observaciones (equipaje, asiento, restricciones)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-3 text-text outline-none focus:border-violet-300"
        />
      </div>
    </section>
  );
}
