import * as XLSX from 'xlsx';
import type { TravelerRow } from './types';

// Columnas del export (orden pensado para comprar boletos).
// TODO: cotejar nombres/orden exactos contra Datos_viajeros_boletos.xlsx (§3.5).
const HEADERS = [
  'Alias',
  'Nombres',
  'Apellidos',
  'Sexo',
  'Fecha nacimiento',
  'Nacionalidad',
  'Tipo doc',
  'Número doc',
  'Pasaporte',
  'Número pasaporte',
  'Vence pasaporte',
  'Celular',
  'Correo',
  'Observaciones',
  'Estado',
  'Actualizado',
] as const;

function toRow(t: TravelerRow): (string | null)[] {
  const c = t.checkin;
  return [
    t.alias,
    c?.first_names ?? null,
    c?.last_names ?? null,
    c?.sex ?? null,
    c?.birth_date ?? null,
    c?.nationality ?? null,
    c?.doc_type ?? null,
    c?.doc_number ?? null,
    c?.passport_status ?? null,
    c?.passport_number ?? null,
    c?.passport_expiry ?? null,
    c?.phone ?? null,
    c?.email ?? null,
    c?.notes ?? null,
    c?.status ?? 'faltan_datos',
    c?.updated_at ?? null,
  ];
}

function buildSheet(rows: TravelerRow[]) {
  const aoa = [HEADERS as unknown as string[], ...rows.map(toRow)];
  return XLSX.utils.aoa_to_sheet(aoa);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Descarga un .xlsx con las columnas del Excel (§3.5, SheetJS §6). */
export function exportXLSX(rows: TravelerRow[]): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildSheet(rows), 'Viajeros');
  XLSX.writeFile(wb, `TC-Team-viajeros-${stamp()}.xlsx`);
}

/** Descarga un .csv con las mismas columnas. */
export function exportCSV(rows: TravelerRow[]): void {
  const csv = XLSX.utils.sheet_to_csv(buildSheet(rows));
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TC-Team-viajeros-${stamp()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
