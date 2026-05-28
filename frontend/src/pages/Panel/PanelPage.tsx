// ======================================================
// PATH: src/pages/Panel/PanelPage.tsx
// Página inicial del sistema
// ======================================================

export default function PanelPage() {
  return (
    <section className="min-h-screen bg-[#f7f7f7] px-8 py-7 text-zinc-950">
      <header className="mb-6 border-b border-zinc-200 pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Panel</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumen general del sistema de nómina.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sistema
          </p>
          <h2 className="mt-3 text-2xl font-semibold">NominaCes</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Frontend cargando correctamente.
          </p>
        </article>

        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Usuarios
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Base</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Pendiente conectar con backend.
          </p>
        </article>

        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Roles
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Permisos</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Ahora queda dentro del apartado Usuarios.
          </p>
        </article>
      </div>
    </section>
  );
}