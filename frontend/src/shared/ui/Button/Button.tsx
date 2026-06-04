// ======================================================
// PATH: src/shared/ui/Button/Button.tsx
// Botón reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar estilos y variantes de botones del sistema.
 * - Mantener consistencia visual en acciones principales y secundarias.
 * - Permitir iconos opcionales sin duplicar estructura en cada pantalla.
 *
 * No debe:
 * - Ejecutar lógica de negocio.
 * - Consultar APIs.
 * - Definir acciones específicas de módulos.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

import "./button.css";

/**
 * Variantes visuales permitidas para botones.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

/**
 * Tamaños permitidos para botones.
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props del botón reutilizable.
 */
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> & {
  /**
   * Variante visual del botón.
   */
  variant?: ButtonVariant;

  /**
   * Tamaño visual del botón.
   */
  size?: ButtonSize;

  /**
   * Icono opcional ubicado antes del texto.
   */
  icon?: ReactNode;

  /**
   * Hace que el botón ocupe todo el ancho disponible.
   */
  fullWidth?: boolean;
};

/**
 * Botón estándar del sistema.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const buttonClassName = [
    "app-button",
    `app-button--${variant}`,
    `app-button--${size}`,
    fullWidth ? "app-button--full" : "",
    className ?? ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} type={type} className={buttonClassName}>
      {icon ? <span className="app-button__icon">{icon}</span> : null}
      <span className="app-button__label">{children}</span>
    </button>
  );
}