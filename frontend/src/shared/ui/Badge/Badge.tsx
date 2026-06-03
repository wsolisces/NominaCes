// ======================================================
// PATH: src/shared/ui/Badge/Badge.tsx
// Badge reutilizable para estados y etiquetas
// ======================================================

import type { ReactNode } from "react";
import "./badge.css";

/**
 * Variantes visuales del badge.
 *
 * success:
 * - Estados correctos o activos.
 *
 * warning:
 * - Estados pendientes o que requieren atención.
 *
 * danger:
 * - Estados bloqueados, errores o riesgos.
 *
 * muted:
 * - Estados inactivos o neutrales.
 *
 * info:
 * - Información auxiliar.
 */
export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "info";

/**
 * Props del badge.
 */
export type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

/**
 * Badge base del sistema.
 *
 * Responsabilidades:
 * - Homologar estados visuales.
 * - Evitar clases por módulo como users-status, roles-status, etc.
 *
 * No debe:
 * - Calcular reglas de negocio.
 */
export function Badge({ variant = "muted", children }: BadgeProps) {
  return (
    <span className={`app-badge app-badge--${variant}`}>
      {children}
    </span>
  );
}