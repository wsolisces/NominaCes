// ======================================================
// PATH: frontend\src\shared\ui\Modal\ActionFeedbackModal\ActionFeedbackModal.tsx
// Modal pequeño de confirmación visual de acciones
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar resultado visual de una acción del sistema.
 * - Representar estados de éxito o error con iconografía clara.
 * - Permitir cerrar el mensaje desde un botón principal.
 * - Mantener el componente reutilizable para usuarios, roles y permisos.
 *
 * No debe:
 * - Ejecutar acciones HTTP.
 * - Conocer reglas de negocio de módulos.
 * - Mutar estados externos por sí mismo.
 */

import "./action-feedback-modal.css";

export type ActionFeedbackVariant = "success" | "error";

export type ActionFeedbackModalProps = {
  open: boolean;
  variant: ActionFeedbackVariant;
  title: string;
  message?: string;
  confirmText?: string;
  onClose: () => void;
};

/**
 * Renderiza el ícono visual según el resultado de la acción.
 */
function renderIcon(variant: ActionFeedbackVariant) {
  if (variant === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.1 2.7 17.3A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.7L13.7 4.1a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

/**
 * Modal reutilizable de resultado de acción.
 */
export function ActionFeedbackModal({
  open,
  variant,
  title,
  message,
  confirmText = "Aceptar",
  onClose
}: ActionFeedbackModalProps) {
  if (!open) return null;

  return (
    <div
      className="action-feedback-modal__backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="action-feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-feedback-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={
            variant === "success"
              ? "action-feedback-modal__icon action-feedback-modal__icon--success"
              : "action-feedback-modal__icon action-feedback-modal__icon--error"
          }
        >
          {renderIcon(variant)}
        </div>

        <div className="action-feedback-modal__content">
          <h2 id="action-feedback-modal-title">{title}</h2>

          {message ? (
            <p>{message}</p>
          ) : null}
        </div>

        <div className="action-feedback-modal__actions">
          <button
            type="button"
            className="action-feedback-modal__button"
            onClick={onClose}
          >
            {confirmText}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ActionFeedbackModal;