// ======================================================
// PATH: src/layouts/AppLayout.tsx
// Layout principal autenticado de NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Montar el sidebar fijo del sistema.
 * - Reservar el espacio horizontal del contenido.
 * - Renderizar rutas internas mediante Outlet.
 * - Mantener el estado visual de colapso del sidebar.
 *
 * No debe:
 * - Consultar APIs del negocio.
 * - Manejar login o permisos directamente.
 * - Definir lógica específica de páginas.
 */

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import SideBar from "./SideBar";
import "./layout.css";

const SIDEBAR_STORAGE_KEY = "nominaces.sidebar.collapsed";

/**
 * Obtiene el estado inicial del sidebar desde localStorage.
 */
function getInitialCollapsedState(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Layout principal para todas las pantallas privadas.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(getInitialCollapsedState);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Si localStorage no está disponible, el layout sigue funcionando.
    }
  }, [collapsed]);

  return (
    <div
      className={`app-shell ${collapsed ? "app-shell--sidebar-collapsed" : ""}`}
    >
      <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}