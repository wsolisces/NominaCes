// ======================================================
// PATH: src/shared/ui/Modal/ConfirmActionModal.tsx
// Modal global estándar de confirmación de acciones
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar una confirmación estándar antes de ejecutar acciones sensibles.
 * - Montar una sola instancia global del modal mediante Provider.
 * - Exponer un hook reutilizable para confirmar acciones desde cualquier módulo.
 * - Permitir variantes visuales según el tipo de acción.
 *
 * No debe:
 * - Ejecutar llamadas HTTP directamente.
 * - Conocer reglas de negocio de usuarios, roles, permisos o catálogos.
 * - Modificar estados globales de módulos.
 * - Reemplazar modales de formularios.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import "./ConfirmActionModal.css";

export type ConfirmActionVariant =
  | "default"
  | "danger"
  | "warning"
  | "success";

export type ConfirmActionOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmActionVariant;
};

type ConfirmActionState = ConfirmActionOptions & {
  open: boolean;
};

type ConfirmActionContextValue = {
  confirmAction: (options: ConfirmActionOptions) => Promise<boolean>;
};

type ConfirmActionModalProps = ConfirmActionState & {
  onCancel: () => void;
  onConfirm: () => void;
};

const EMPTY_STATE: ConfirmActionState = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
  variant: "default"
};

const ConfirmActionContext =
  createContext<ConfirmActionContextValue | null>(null);

/**
 * Devuelve el texto superior según la variante.
 */
function getVariantLabel(variant: ConfirmActionVariant): string {
  if (variant === "danger") return "Acción destructiva";
  if (variant === "warning") return "Confirmación requerida";
  if (variant === "success") return "Confirmar acción";

  return "Confirmación";
}

/**
 * Devuelve el símbolo visual del modal.
 */
function getVariantIcon(variant: ConfirmActionVariant): string {
  if (variant === "danger") return "!";
  if (variant === "warning") return "!";
  if (variant === "success") return "✓";

  return " ?";
}

/**
 * Modal visual interno.
 */
function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onCancel,
  onConfirm
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div className="confirm-action-modal-backdrop" role="presentation">
      <section
        className={`confirm-action-modal confirm-action-modal--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-modal-title"
        aria-describedby="confirm-action-modal-message"
      >
        <header className="confirm-action-modal__header">
          <div className="confirm-action-modal__icon" aria-hidden="true">
            {getVariantIcon(variant)}
          </div>

          <div className="confirm-action-modal__heading">
            <p className="confirm-action-modal__eyebrow">
              {getVariantLabel(variant)}
            </p>

            <h2
              id="confirm-action-modal-title"
              className="confirm-action-modal__title"
            >
              {title}
            </h2>
          </div>
        </header>

        <p
          id="confirm-action-modal-message"
          className="confirm-action-modal__message"
        >
          {message}
        </p>

        <footer className="confirm-action-modal__footer">
          <button
            type="button"
            className="confirm-action-modal__button confirm-action-modal__button--secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="confirm-action-modal__button confirm-action-modal__button--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}

/**
 * Provider global de confirmaciones.
 */
export function ConfirmActionProvider({
  children
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<ConfirmActionState>(EMPTY_STATE);

  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const closeModal = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setState(EMPTY_STATE);
  }, []);

  const confirmAction = useCallback(
    (options: ConfirmActionOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        resolverRef.current = resolve;

        setState({
          open: true,
          title: options.title,
          message: options.message,
          confirmLabel: options.confirmLabel ?? "Confirmar",
          cancelLabel: options.cancelLabel ?? "Cancelar",
          variant: options.variant ?? "default"
        });
      });
    },
    []
  );

  const value = useMemo<ConfirmActionContextValue>(
    () => ({
      confirmAction
    }),
    [confirmAction]
  );

  return (
    <ConfirmActionContext.Provider value={value}>
      {children}

      <ConfirmActionModal
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        variant={state.variant}
        onCancel={() => closeModal(false)}
        onConfirm={() => closeModal(true)}
      />
    </ConfirmActionContext.Provider>
  );
}

/**
 * Hook global para solicitar confirmación antes de una acción.
 */
export function useConfirmAction(): ConfirmActionContextValue {
  const context = useContext(ConfirmActionContext);

  if (!context) {
    throw new Error(
      "useConfirmAction debe usarse dentro de ConfirmActionProvider."
    );
  }

  return context;
}