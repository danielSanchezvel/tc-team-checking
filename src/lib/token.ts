// Token personal guardado en el teléfono: deja que el viajero vuelva a editar
// sin pedir nada (modelo de link grupal). Es la llave de acceso, no el documento.
const KEY = 'tc_token';

export function readSavedToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeSavedToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* modo privado: no se guarda, tendrá que usar su link */
  }
}
