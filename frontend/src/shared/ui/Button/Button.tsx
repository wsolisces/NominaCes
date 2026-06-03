// ======================================================
// PATH: src/shared/ui/Button/Button.tsx
// Botón reutilizable del sistema
// ======================================================

import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.css";

/**
 * Variantes visuales soportadas por el botón.
 *
 * primary:
 * - Acción principal de una pantalla o modal.
 *
 * secondary:
 * - Acción alternativa o neutral.
 *
 * danger:
 * - Acción destructiva o delicada.
 *
 * ghost:
 * - Acción ligera sin fondo fuerte.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/**
 * Tamaños visuales del botón.
 */
export type ButtonSize = "sm" | "md";

/**
 * Props del botón reutilizable.
 *
 * Extiende las propiedades nativas de button para permitir:
 * - type
 * - disabled
 * - onClick
 * - aria-label
 */
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

/**
 * Botón base del sistema.
 *
 * Responsabilidades:
 * - Homologar apariencia de botones.
 * - Evitar clases repetidas en cada módulo.
 *
 * No debe:
 * - Ejecutar lógica de negocio.
 * - Decidir permisos.
 * - Navegar por sí mismo.
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    "app-button",
    `app-button--${variant}`,
    `app-button--${size}`,
    fullWidth ? "app-button--full" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}