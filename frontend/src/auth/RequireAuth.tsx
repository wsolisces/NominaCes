// ======================================================
// PATH: src/auth/RequireAuth.tsx
// Módulo: Autenticación frontend
// Capa: Protección de rutas
// Descripción:
//   Protege rutas privadas y evita que usuarios sin sesión accedan
//   a pantallas internas del sistema.
//
// Responsabilidades:
//   - Esperar a que AuthProvider termine de validar sesión inicial.
//   - Redirigir a /login si no hay usuario autenticado.
//   - Conservar la ruta original para regresar después del login.
//   - Renderizar rutas hijas privadas mediante Outlet.
//
// No debe:
//   - Ejecutar login.
//   - Cerrar sesión.
//   - Consultar directamente el backend.
//   - Validar permisos por módulo.
//   - Renderizar layouts completos.
// ======================================================

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Componente guard para rutas privadas.
 *
 * Flujo:
 * - Mientras loading/initialized no termina, muestra estado de validación.
 * - Si no existe usuario, redirige a login.
 * - Si existe usuario, renderiza la ruta privada solicitada.
 */
export function RequireAuth() {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();

  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-zinc-500">Validando sesión…</div>
      </div>
    );
  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}