// ======================================================
// PATH: src/routes/AppRoutes.tsx
// Router principal del frontend NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Registrar rutas públicas y privadas.
 * - Proteger pantallas internas con RequireAuth.
 * - Montar AppLayout para el sistema interno.
 * - Mantener users, roles y permisos como módulos independientes.
 *
 * No debe:
 * - Ejecutar login/logout.
 * - Consultar directamente el backend.
 * - Contener lógica visual del sidebar.
 */

import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { RequireAuth } from "../auth/RequireAuth";
import AppLayout from "../layouts/AppLayout";

import Login from "../pages/Login";
import ResetPassword from "../pages/ResetPassword";

import PanelPage from "../pages/Panel/PanelPage";
import UsersPage from "../modules/users/pages/UsersPage";
import RolesPage from "../modules/roles/pages/RolesPage";
import PermisosPage from "../modules/permisos/pages/PermisosPage";

/**
 * Router principal de NominaCes.
 */
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/crear-password",
    element: <ResetPassword />
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/panel" replace />
          },
          {
            path: "panel",
            element: <PanelPage />
          },
          {
            path: "usuarios",
            element: <UsersPage />
          },
          {
            path: "roles",
            element: <RolesPage />
          },
          {
            path: "permisos",
            element: <PermisosPage />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/panel" replace />
  }
]);

/**
 * Proveedor del router para la aplicación.
 */
export default function AppRoutes() {
  return <RouterProvider router={router} />;
}