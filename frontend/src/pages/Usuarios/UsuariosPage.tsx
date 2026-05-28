// ======================================================
// PATH: src/pages/Usuarios/UsuariosPage.tsx
// Página principal de administración de usuarios
// ======================================================

import { NavLink, Outlet } from "react-router-dom";

function tabClass(isActive: boolean): string {
  return [
    "inline-flex h-9 items-center rounded-md border px-4 text-sm font-semibold transition-colors",
    isActive
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-950",
  ].join(" ");
}

export default function UsuariosPage() {
  return (
    <section className="min-h-screen bg-[#f7f7f7] px-8 py-7 text-zinc-950">
      <header className="mb-5 border-b border-zinc-200 pb-5">
        <h1 className="text-[24px] font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Administración de usuarios, roles y permisos del sistema.
        </p>
      </header>

      <nav className="mb-5 flex flex-wrap gap-2">
        <NavLink to="/usuarios" end className={({ isActive }) => tabClass(isActive)}>
          Usuarios
        </NavLink>

        <NavLink
          to="/usuarios/roles"
          className={({ isActive }) => tabClass(isActive)}
        >
          Roles
        </NavLink>
      </nav>

      <Outlet />
    </section>
  );
}