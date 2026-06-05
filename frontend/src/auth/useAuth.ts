// ======================================================
// PATH: src/auth/useAuth.ts
// Módulo: Autenticación frontend
// Capa: Hook
// ======================================================

/**
 * Responsabilidades:
 * - Leer el contexto global de autenticación.
 * - Validar que el hook se utilice dentro de AuthProvider.
 * - Exponer sesión, autenticación y helpers de permisos.
 * - Entregar un contrato fuertemente tipado a los componentes.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Guardar estado propio.
 * - Redirigir rutas.
 * - Aplicar reglas específicas de módulos.
 * - Sustituir las validaciones de permisos del backend.
 */

import { useContext } from "react";

import { AuthContext } from "./AuthProvider";

import type { AuthContextValue } from "./auth.types";

/**
 * Hook principal para consumir autenticación y permisos.
 *
 * Regla:
 * - Solo debe utilizarse dentro de componentes envueltos
 *   por AuthProvider.
 *
 * Incluye:
 * - Usuario y estado de sesión.
 * - Login y logout.
 * - Actualización de sesión.
 * - Validación visual de permisos.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}