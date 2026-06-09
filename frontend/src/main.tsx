// ======================================================
// PATH: src/main.tsx
// Módulo: Arranque frontend
// Capa: Entry point
// Descripción:
//   Punto de entrada de React para NominaCes.
//
// Responsabilidades:
//   - Montar React en el DOM.
//   - Envolver la app con AuthProvider.
//   - Envolver la app con ConfirmActionProvider.
//   - Renderizar AppRoutes.
//
// No debe:
//   - Definir rutas.
//   - Ejecutar lógica de negocio.
//   - Consultar APIs.
// ======================================================

import React from "react";
import ReactDOM from "react-dom/client";

import { AuthProvider } from "./auth/AuthProvider";
import AppRoutes from "./routes/AppRoutes";

import { ConfirmActionProvider } from "./shared/ui";

import "./index.css";

/**
 * Inicializa la aplicación React.
 *
 * AuthProvider debe envolver AppRoutes para que Login,
 * RequireAuth y AppLayout puedan consumir useAuth().
 *
 * ConfirmActionProvider se monta una sola vez para permitir
 * confirmaciones globales reutilizables en todo el sistema.
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfirmActionProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfirmActionProvider>
  </React.StrictMode>
);