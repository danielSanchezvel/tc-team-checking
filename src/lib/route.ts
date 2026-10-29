/** Token del link del viajero en /c/<token>. null si la ruta no es de check-in. */
export function checkinTokenFromPath(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'c' && parts[1]) return decodeURIComponent(parts[1]);
  return null;
}
