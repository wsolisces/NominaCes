// ======================================================
// PATH: src/auth/useAuth.ts
// Módulo: Autenticación frontend
// Capa: Hook
// Descripción:
//   Expone un hook reutilizable para consumir el contexto global
//   de autenticación desde cualquier componente React.
//
// Responsabilidades:
//   - Leer AuthContext.
//   - Validar que el hook se use dentro de AuthProvider.
//   - Entregar el contrato AuthContextValue a pantallas y layouts.
//
// No debe:
//   - Ejecutar peticiones HTTP.
//   - Guardar estado propio.
//   - Redirigir rutas.
//   - Contener lógica visual.
// ======================================================

import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

/**
 * Hook principal para consumir autenticación.
 *
 * Regla:
 * - Solo debe usarse dentro de componentes envueltos por AuthProvider.
 * - Si se usa fuera del provider, lanza un error claro para detectar
 *   problemas de estructura en main.tsx o AppRoutes.tsx.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}