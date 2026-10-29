import type { CheckinStatus } from '../admin/types';

// Campos PÚBLICOS del pasabordo. Por construcción, aquí NO entra documento,
// fecha de nacimiento ni pasaporte (§3.4, §8.7): la función solo recibe alias,
// estado y la fecha del viaje. El PNG se arma desde estos campos.
export interface PassFields {
  alias: string;
  from: string;
  to: string;
  flight: string;
  gate: string;
  seat: string;
  dateLabel: string;
  status: CheckinStatus;
}

const MESES = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC',
];

function formatDate(departureDateISO?: string | null): string {
  if (!departureDateISO) return 'MAR 2027';
  const [y, m, d] = departureDateISO.split('-').map(Number);
  if (!y || !m || !d) return 'MAR 2027';
  return `${String(d).padStart(2, '0')} ${MESES[m - 1]} ${y}`;
}

// Asiento de broma, determinístico a partir del alias (§3.4).
function jokeSeat(alias: string): string {
  const letters = ['A', 'B', 'C', 'D', 'F'];
  const n = (alias.length * 7) % 30;
  return `${n + 1}${letters[alias.length % letters.length]}`;
}

export function buildPassFields(
  alias: string,
  status: CheckinStatus,
  departureDateISO?: string | null,
): PassFields {
  return {
    alias: (alias || '').toUpperCase(),
    from: 'CLO',
    to: 'PUJ',
    flight: 'TC 2027',
    gate: 'TC',
    seat: jokeSeat(alias || ''),
    dateLabel: formatDate(departureDateISO),
    status,
  };
}
