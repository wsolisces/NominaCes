// ======================================================
// PATH: src/routes/AppRoutes.tsx
// Módulo: Ruteo frontend
// Capa: Router principal
// Descripción:
//   Define las rutas públicas y privadas del frontend NominaCes.
//
// Responsabilidades:
//   - Registrar pantallas públicas como Login y Crear contraseña.
//   - Proteger rutas internas mediante RequireAuth.
//   - Montar el layout principal para pantallas privadas.
//   - Redirigir rutas base o desconocidas hacia una ruta válida.
//
// No debe:
//   - Ejecutar login/logout.
//   - Consultar directamente el backend.
//   - Validar permisos específicos por pantalla.
//   - Contener lógica visual del sidebar o layout.
// ======================================================

import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { RequireAuth } from "../auth/RequireAuth";
import AppLayout from "../layouts/AppLayout";

import Login from "../pages/Login";
import ResetPassword from "../pages/ResetPassword";

import PanelPage from "../pages/Panel/PanelPage";
import RolesPage from "../pages/Roles/RolesPage";
import UsuariosHomePage from "../pages/Usuarios/UsuariosHomePage";
import UsuariosPage from "../pages/Usuarios/UsuariosPage";

/**
 * Router principal de NominaCes.
 *
 * Estructura:
 * - /login es público.
 * - /crear-password es público porque el usuario todavía no tiene sesión.
 * - Las rutas internas viven dentro de RequireAuth + AppLayout.
 */
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/crear-password",
    element: <ResetPassword />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/panel" replace />,
          },
          {
            path: "panel",
            element: <PanelPage />,
          },
          {
            path: "usuarios",
            element: <UsuariosPage />,
            children: [
              {
                index: true,
                element: <UsuariosHomePage />,
              },
              {
                path: "roles",
                element: <RolesPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/panel" replace />,
  },
]);

/**
 * Proveedor del router para la aplicación.
 *
 * Se mantiene en un componente para que main.tsx solo tenga
 * responsabilidades de arranque.
 */
export default function AppRoutes() {
  return <RouterProvider router={router} />;
}