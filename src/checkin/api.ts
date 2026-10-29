import { supabase } from '../lib/supabase';
import type { Checkin, CheckinStatus } from '../admin/types';

export interface Trip {
  id: number;
  destination: string | null;
  departure_date: string | null;
  return_date: string | null;
  purchase_deadline: string | null;
  purge_after: string | null;
}

export interface GetCheckinResult {
  alias: string;
  trip: Trip;
  checkin: Checkin | null;
}

/** Carga alias, datos del viaje y check-in propio. Token inválido -> lanza. */
export async function getCheckin(token: string): Promise<GetCheckinResult> {
  const { data, error } = await supabase.rpc('get_checkin', { p_token: token });
  if (error) throw error;
  return data as GetCheckinResult;
}

/** Guarda el payload acumulado y devuelve el status recalculado por el backend. */
export async function saveCheckin(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ status: CheckinStatus }> {
  const { data, error } = await supabase.rpc('save_checkin', {
    p_token: token,
    p_payload: payload,
  });
  if (error) throw error;
  return data as { status: CheckinStatus };
}
