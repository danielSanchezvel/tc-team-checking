import { describe, it, expect } from 'vitest';
import {
  addMonthsClamped,
  computeAge,
  isMinor,
  makeCheckinSchema,
  minPassportExpiry,
  PASSPORT_RENEW_MSG,
} from '../checkin/schema';

const schema = makeCheckinSchema('2027-03-31');

const base = {
  first_names: 'JUAN DAVID',
  last_names: 'SANCHEZ',
  sex: 'M' as const,
  birth_date: '1995-05-20',
  nationality: 'Colombiana',
  doc_type: 'CC' as const,
  doc_number: '1234567890',
  passport_status: 'si' as const,
  passport_number: 'AB1234567',
  passport_expiry: '2027-10-01',
  phone: '3001234567',
  email: 'juan@tc.team',
  notes: '',
};

describe('clamp de meses como Postgres', () => {
  it('2027-03-31 + 6 meses = 2027-09-30 (no 10-01)', () => {
    expect(addMonthsClamped('2027-03-31', 6)).toBe('2027-09-30');
    expect(minPassportExpiry('2027-03-31')).toBe('2027-09-30');
  });
  it('fecha normal no se recorta', () => {
    expect(addMonthsClamped('2027-01-15', 6)).toBe('2027-07-15');
  });
});

describe('edad y menor', () => {
  it('calcula edad', () => {
    expect(computeAge('2000-01-01', new Date('2026-10-29'))).toBe(26);
  });
  it('detecta menor de 18', () => {
    expect(isMinor('2010-01-01', new Date('2026-10-29'))).toBe(true);
    expect(isMinor('2000-01-01', new Date('2026-10-29'))).toBe(false);
  });
});

describe('regla de pasaporte (igual al backend)', () => {
  it('acepta vencimiento DESPUÉS del corte', () => {
    expect(schema.safeParse(base).success).toBe(true);
  });

  it('rechaza vencimiento en el corte (2027-09-30)', () => {
    const r = schema.safeParse({ ...base, passport_expiry: '2027-09-30' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === PASSPORT_RENEW_MSG)).toBe(true);
    }
  });

  it('rechaza vencimiento antes del corte', () => {
    const r = schema.safeParse({ ...base, passport_expiry: '2027-06-01' });
    expect(r.success).toBe(false);
  });

  it('pasaporte "sí" sin número falla', () => {
    const r = schema.safeParse({ ...base, passport_number: '' });
    expect(r.success).toBe(false);
  });
});

describe('otras validaciones', () => {
  it('CC solo admite dígitos', () => {
    expect(schema.safeParse({ ...base, doc_number: 'ABC123' }).success).toBe(false);
  });
  it('CE admite alfanumérico', () => {
    expect(schema.safeParse({ ...base, doc_type: 'CE', doc_number: 'X-99' }).success).toBe(true);
  });
  it('nombre con minúsculas falla (debe ir en MAYÚSCULAS)', () => {
    expect(schema.safeParse({ ...base, first_names: 'juan' }).success).toBe(false);
  });
  it('celular 10 dígitos o internacional', () => {
    expect(schema.safeParse({ ...base, phone: '3001234567' }).success).toBe(true);
    expect(schema.safeParse({ ...base, phone: '+573001234567' }).success).toBe(true);
    expect(schema.safeParse({ ...base, phone: '12345' }).success).toBe(false);
  });
  it('correo inválido falla', () => {
    expect(schema.safeParse({ ...base, email: 'no-es-correo' }).success).toBe(false);
  });
});
