// ======================================================
// PATH: src/shared/ui/Modal/Modal.tsx
// Modal reutilizable del sistema
// ======================================================

import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import "./modal.css";

/**
 * Props del modal reutilizable.
 */
export type ModalProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  onClose: () => void;
};

/**
 * Modal base del sistema.
 *
 * Responsabilidades:
 * - Unificar estructura de ventanas flotantes.
 * - Mostrar título, contenido y acciones.
 *
 * No debe:
 * - Contener lógica de negocio.
 * - Hacer submit por sí mismo.
 * - Guardar estado de formularios.
 */
export function Modal({
  open,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  onClose
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="app-modal-backdrop" role="presentation">
      <section
        className={`app-modal app-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="app-modal__header">
          <div>
            {eyebrow && <p className="app-modal__eyebrow">{eyebrow}</p>}
            <h2 className="app-modal__title">{title}</h2>
          </div>

          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </header>

        <div className="app-modal__body">{children}</div>

        {footer && <footer className="app-modal__footer">{footer}</footer>}
      </section>
    </div>
  );
}

/**
 * Footer común para modales con Cancelar / Guardar.
 */
export type ModalActionsProps = {
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  danger?: boolean;
  onCancel: () => void;
};

/**
 * Acciones estándar de modal.
 *
 * Se usa dentro de un <form>, por eso el botón confirmar es submit.
 */
export function ModalFormActions({
  cancelText = "Cancelar",
  confirmText = "Guardar",
  loading = false,
  danger = false,
  onCancel
}: ModalActionsProps) {
  return (
    <div className="app-modal-actions">
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={loading}
      >
        {cancelText}
      </Button>

      <Button type="submit" variant={danger ? "danger" : "primary"} disabled={loading}>
        {loading ? "Procesando..." : confirmText}
      </Button>
    </div>
  );
}