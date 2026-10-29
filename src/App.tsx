import AdminApp from './admin/AdminApp';

// Enrutado mínimo por pathname (sin router externo; §6 no lo incluye).
// /admin  -> panel admin (Fase 1)
// resto   -> placeholder del viajero (se arma en la Fase 2: /c/<token>)
export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-tc-signature p-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-text drop-shadow">TC TEAM ✈</h1>
      <p className="mt-2 text-text-muted">Check-in a Punta Cana</p>
      <p className="mt-6 text-sm text-text-muted">
        El check-in del viajero llega en la Fase 2.
      </p>
    </main>
  );
}
