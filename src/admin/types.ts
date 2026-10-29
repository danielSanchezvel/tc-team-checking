export type CheckinStatus = 'faltan_datos' | 'pasaporte_pendiente' | 'completo';

export interface Checkin {
  traveler_id: string;
  first_names: string | null;
  last_names: string | null;
  sex: 'M' | 'F' | null;
  birth_date: string | null;
  nationality: string | null;
  doc_type: 'CC' | 'TI' | 'RC' | 'CE' | 'OTRO' | null;
  doc_number: string | null;
  passport_status: 'si' | 'en_tramite' | 'no' | null;
  passport_number: string | null;
  passport_expiry: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: CheckinStatus;
  updated_at: string;
}

export interface TravelerRow {
  id: string;
  alias: string;
  created_at: string;
  checkin: Checkin | null;
}

// Link que se muestra UNA sola vez tras crear/regenerar (contiene el token en claro).
export interface IssuedLink {
  traveler_id: string;
  alias: string;
  token: string;
  link_path: string;
}
