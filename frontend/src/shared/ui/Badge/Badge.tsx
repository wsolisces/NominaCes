// ======================================================
// PATH: src/shared/ui/Badge/Badge.tsx
// Badge reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar estados compactos dentro de tablas, cards y formularios.
 * - Unificar colores para estados administrativos.
 * - Evitar duplicar etiquetas de estado en cada módulo.
 *
 * No debe:
 * - Calcular estados de negocio.
 * - Consultar APIs.
 * - Definir reglas específicas de usuarios, roles o permisos.
 */

import type { ReactNode } from "react";

import "./badge.css";

/**
 * Variantes visuales disponibles para badges.
 */
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

/**
 * Props del badge reutilizable.
 */
export type BadgeProps = {
  /**
   * Contenido visible del badge.
   */
  children: ReactNode;

  /**
   * Variante visual.
   */
  variant?: BadgeVariant;

  /**
   * Clase opcional para ajustes puntuales.
   */
  className?: string;
};

/**
 * Etiqueta visual compacta para estados y categorías.
 */
export function Badge({
  children,
  variant = "neutral",
  className
}: BadgeProps) {
  const badgeClassName = [
    "app-badge",
    `app-badge--${variant}`,
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={badgeClassName}>{children}</span>;
}