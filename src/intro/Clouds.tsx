// Tres capas de nubes para el parallax del cielo de atardecer (§3.2).
// Solo transform/opacity; los desenfoques van en el estilo, pre-aplicados.
export default function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="tc-cloud tc-cloud-1 absolute left-0 top-[22%] h-24 w-[140%] opacity-70" />
      <div className="tc-cloud tc-cloud-2 absolute left-0 top-[48%] h-28 w-[160%] opacity-50" />
      <div className="tc-cloud tc-cloud-3 absolute left-0 top-[68%] h-20 w-[180%] opacity-40" />
    </div>
  );
}
