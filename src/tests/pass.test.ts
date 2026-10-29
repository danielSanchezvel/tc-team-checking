import { describe, it, expect } from 'vitest';
import { buildPassFields } from '../pass/passData';

// El PNG del pasabordo se arma desde estos campos: nunca debe haber documento,
// fecha de nacimiento ni pasaporte (§3.4, §8.7).
const ALLOWED = ['alias', 'from', 'to', 'flight', 'gate', 'seat', 'dateLabel', 'status'];

describe('pasabordo: solo datos públicos', () => {
  const f = buildPassFields('Juanchis', 'completo', '2027-03-31');

  it('expone exactamente los campos públicos permitidos', () => {
    expect(Object.keys(f).sort()).toEqual([...ALLOWED].sort());
  });

  it('no contiene marcadores de datos sensibles', () => {
    const json = JSON.stringify(f).toLowerCase();
    for (const bad of ['passport', 'pasaporte', 'birth', 'doc_number', 'doc_type']) {
      expect(json.includes(bad)).toBe(false);
    }
  });

  it('alias en MAYÚSCULAS, ruta CLO -> PUJ y fecha formateada', () => {
    expect(f.alias).toBe('JUANCHIS');
    expect(f.from).toBe('CLO');
    expect(f.to).toBe('PUJ');
    expect(f.dateLabel).toBe('31 MAR 2027');
  });
});
