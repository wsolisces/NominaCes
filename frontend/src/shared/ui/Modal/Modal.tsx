// ======================================================
// PATH: src/shared/ui/Modal/Modal.tsx
// Modal reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Unificar la estructura de ventanas flotantes.
 * - Mostrar encabezado, contenido y acciones.
 * - Permitir cerrar mediante Escape o al seleccionar el backdrop.
 * - Bloquear el desplazamiento de la página mientras está abierto.
 *
 * No debe:
 * - Contener lógica de negocio.
 * - Realizar peticiones al backend.
 * - Administrar formularios específicos.
 * - Guardar estado de módulos.
 */

import {
  useEffect,
  type MouseEvent,
  type ReactNode
} from "react";

import { Button } from "../Button/Button";

import "./modal.css";

/**
 * Tamaños permitidos para el modal.
 */
export type ModalSize = "sm" | "md" | "lg";

/**
 * Props públicas del modal reutilizable.
 */
export type ModalProps = {
  open: boolean;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  onClose: () => void;
};

/**
 * Modal base reutilizable del sistema.
 */
export function Modal({
  open,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  onClose
}: ModalProps) {
  /**
   * Bloquea el scroll general y permite cerrar mediante Escape.
   */
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  /**
   * Cierra el modal únicamente cuando se selecciona directamente
   * el área oscura exterior.
   */
  function handleBackdropMouseDown(
    event: MouseEvent<HTMLDivElement>
  ): void {
    if (!closeOnBackdrop) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="app-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        className={`app-modal app-modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
      >
        <header className="app-modal__header">
          <div className="app-modal__heading">
            {eyebrow ? (
              <p className="app-modal__eyebrow">
                {eyebrow}
              </p>
            ) : null}

            <h2
              id="app-modal-title"
              className="app-modal__title"
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="app-modal__body">
          {children}
        </div>

        {footer ? (
          <footer className="app-modal__footer">
            <div className="app-modal-actions">
              {footer}
            </div>
          </footer>
        ) : null}
      </section>
    </div>
  );
}

/**
 * Props de las acciones estándar para formularios dentro de modales.
 */
export type ModalActionsProps = {
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
  danger?: boolean;
  onCancel: () => void;
};

/**
 * Acciones estándar para formularios con Cancelar y Confirmar.
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

      <Button
        type="submit"
        variant={danger ? "danger" : "primary"}
        disabled={loading}
      >
        {loading ? "Procesando..." : confirmText}
      </Button>
    </div>
  );
}