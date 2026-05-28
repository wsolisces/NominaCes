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

import "./index.css";

/**
 * Inicializa la aplicación React.
 *
 * AuthProvider debe envolver AppRoutes para que Login,
 * RequireAuth y AppLayout puedan consumir useAuth().
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </React.StrictMode>
);