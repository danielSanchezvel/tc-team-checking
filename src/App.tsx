import AdminApp from './admin/AdminApp';
import CheckinApp from './checkin/CheckinApp';
import { checkinTokenFromPath } from './lib/route';

// Enrutado mínimo por pathname (sin router externo; §6 no lo incluye).
// /admin      -> panel admin
// /c/<token>  -> check-in del viajero
// resto       -> landing simple
export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }

  const token = checkinTokenFromPath();
  if (token) {
    return <CheckinApp token={token} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-tc-signature p-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-text drop-shadow">TC TEAM ✈</h1>
      <p className="mt-2 text-text-muted">Check-in a Punta Cana</p>
      <p className="mt-6 text-sm text-text-muted">
        Abre el link personal que te enviaron por privado.
      </p>
    </main>
  );
}
