import { z } from 'zod';

// ============================================================================
// Esquema Zod del check-in. Refleja las reglas del backend (save_checkin).
// La regla de pasaporte se deriva de trip.departure_date (llega por get_checkin),
// NO se hardcodea (§3.3).
// ============================================================================

export const SEX = ['M', 'F'] as const;
export const DOC_TYPES = ['CC', 'TI', 'RC', 'CE', 'OTRO'] as const;
export const PASSPORT_STATUS = ['si', 'en_tramite', 'no'] as const;

export const DOC_TYPE_LABEL: Record<(typeof DOC_TYPES)[number], string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  RC: 'Registro civil',
  CE: 'Cédula de extranjería',
  OTRO: 'Otro',
};

// Tipos de documento que solo admiten dígitos (§3.3).
const DOC_ONLY_DIGITS: readonly string[] = ['CC', 'TI', 'RC'];

// Letras, espacios, tildes y Ñ (§3.3).
const NAME_RE = /^[A-ZÁÉÍÓÚÜÑ ]+$/;
const DIGITS_RE = /^\d+$/;
// 10 dígitos (Colombia) o formato internacional +<7..15 dígitos> (§3.3).
const PHONE_RE = /^(\d{10}|\+\d{7,15})$/;

export const PASSPORT_NOTICE = 'Tal cual sale en el pasaporte. Un error aquí cuesta plata.';
export const PASSPORT_RENEW_MSG = 'Tienes que renovar el pasaporte';

// --- Helpers de fecha (clamp igual que Postgres: 03-31 + 6m -> 09-30) ---------
export function addMonthsClamped(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const firstOfTarget = new Date(Date.UTC(y, m - 1 + months, 1));
  const ty = firstOfTarget.getUTCFullYear();
  const tm = firstOfTarget.getUTCMonth();
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  const mm = String(tm + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${ty}-${mm}-${dd}`;
}

/** Vencimiento mínimo exigido: departure + 6 meses (RD, §3.3/§12). */
export function minPassportExpiry(departureDateISO: string): string {
  return addMonthsClamped(departureDateISO, 6);
}

export function computeAge(birthISO: string, today = new Date()): number {
  const [y, m, d] = birthISO.split('-').map(Number);
  let age = today.getUTCFullYear() - y;
  const mo = today.getUTCMonth() + 1;
  const da = today.getUTCDate();
  if (mo < m || (mo === m && da < d)) age -= 1;
  return age;
}

export function isMinor(birthISO: string | null | undefined, today = new Date()): boolean {
  if (!birthISO) return false;
  return computeAge(birthISO, today) < 18;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

// --- Esquema (factory: necesita la fecha de salida del viaje) ------------------
export function makeCheckinSchema(departureDateISO: string) {
  const minExpiry = minPassportExpiry(departureDateISO);

  return z
    .object({
      first_names: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .regex(NAME_RE, 'Solo letras, espacios, tildes y Ñ'),
      last_names: z
        .string()
        .trim()
        .min(1, 'Requerido')
        .regex(NAME_RE, 'Solo letras, espacios, tildes y Ñ'),
      sex: z.enum(SEX, { message: 'Elige una opción' }),
      birth_date: z
        .string()
        .min(1, 'Requerido')
        .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida')
        .refine((v) => v < todayISO(), 'Debe estar en el pasado'),
      nationality: z.string().trim().min(1, 'Requerido'),

      doc_type: z.enum(DOC_TYPES, { message: 'Elige una opción' }),
      doc_number: z.string().trim().min(1, 'Requerido'),

      passport_status: z.enum(PASSPORT_STATUS, { message: 'Elige una opción' }),
      passport_number: z.string().trim().optional().or(z.literal('')),
      passport_expiry: z.string().optional().or(z.literal('')),

      phone: z
        .string()
        .trim()
        .regex(PHONE_RE, '10 dígitos (Colombia) o +internacional'),
      email: z.string().trim().email('Correo inválido'),
      notes: z.string().trim().optional().or(z.literal('')),
    })
    .superRefine((val, ctx) => {
      // Documento: solo dígitos para CC/TI/RC.
      if (DOC_ONLY_DIGITS.includes(val.doc_type) && !DIGITS_RE.test(val.doc_number)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['doc_number'],
          message: 'Solo dígitos para este documento',
        });
      }

      // Pasaporte "sí": exige número y vencimiento válido (>= 6 meses tras el ingreso).
      if (val.passport_status === 'si') {
        if (!val.passport_number || val.passport_number.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passport_number'],
            message: 'Requerido',
          });
        }
        if (!val.passport_expiry) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passport_expiry'],
            message: 'Requerido',
          });
        } else if (val.passport_expiry <= minExpiry) {
          // Debe vencer DESPUÉS de departure + 6 meses.
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passport_expiry'],
            message: PASSPORT_RENEW_MSG,
          });
        }
      }
    });
}

export type CheckinSchema = ReturnType<typeof makeCheckinSchema>;
export type CheckinForm = z.input<CheckinSchema>;

// Campos por paso, para validar paso a paso con RHF trigger().
export const STEP_FIELDS: Record<number, (keyof CheckinForm)[]> = {
  1: ['first_names', 'last_names', 'sex', 'birth_date', 'nationality'],
  2: ['doc_type', 'doc_number'],
  3: ['passport_status', 'passport_number', 'passport_expiry'],
  4: ['phone', 'email', 'notes'],
};
