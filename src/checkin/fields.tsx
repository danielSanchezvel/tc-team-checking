import { useFormContext } from 'react-hook-form';
import type { CheckinForm } from './schema';

type Name = keyof CheckinForm;

const baseInput =
  'w-full rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-3 text-text outline-none focus:border-violet-300 disabled:opacity-50';

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm text-text-muted">{children}</label>;
}

function ErrorText({ name }: { name: Name }) {
  const {
    formState: { errors },
  } = useFormContext<CheckinForm>();
  const msg = errors[name]?.message as string | undefined;
  if (!msg) return null;
  return <p className="mt-1 text-sm text-red-400">{msg}</p>;
}

export function TextInput({
  name,
  label,
  placeholder,
  type = 'text',
  inputMode,
}: {
  name: Name;
  label: string;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const { register } = useFormContext<CheckinForm>();
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...register(name)}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        className={baseInput}
      />
      <ErrorText name={name} />
    </div>
  );
}

/** Texto en MAYÚSCULAS reales (para nombres/apellidos, §3.3). */
export function UpperInput({
  name,
  label,
  placeholder,
}: {
  name: Name;
  label: string;
  placeholder?: string;
}) {
  const { register, setValue } = useFormContext<CheckinForm>();
  const reg = register(name);
  return (
    <div>
      <Label>{label}</Label>
      <input
        {...reg}
        type="text"
        autoCapitalize="characters"
        placeholder={placeholder}
        onChange={(e) =>
          setValue(name, e.target.value.toUpperCase(), { shouldDirty: true })
        }
        className={`${baseInput} uppercase`}
      />
      <ErrorText name={name} />
    </div>
  );
}

export function DateInput({ name, label }: { name: Name; label: string }) {
  const { register } = useFormContext<CheckinForm>();
  return (
    <div>
      <Label>{label}</Label>
      <input {...register(name)} type="date" className={baseInput} />
      <ErrorText name={name} />
    </div>
  );
}

export function Select({
  name,
  label,
  options,
  placeholder = 'Elige…',
}: {
  name: Name;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const { register } = useFormContext<CheckinForm>();
  return (
    <div>
      <Label>{label}</Label>
      <select {...register(name)} className={baseInput}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ErrorText name={name} />
    </div>
  );
}

export function RadioRow({
  name,
  label,
  options,
}: {
  name: Name;
  label: string;
  options: { value: string; label: string }[];
}) {
  const { register } = useFormContext<CheckinForm>();
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-violet-300/40 bg-purple-900 px-4 py-2.5 text-text has-[:checked]:border-pink-500 has-[:checked]:bg-purple-600"
          >
            <input type="radio" value={o.value} {...register(name)} className="accent-pink-500" />
            {o.label}
          </label>
        ))}
      </div>
      <ErrorText name={name} />
    </div>
  );
}
