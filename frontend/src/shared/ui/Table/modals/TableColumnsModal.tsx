// ======================================================
// PATH: src/shared/ui/Table/modals/TableColumnsModal.tsx
// Modal de configuración de columnas para Table
// ======================================================

/**
 * Responsabilidades:
 * - Permitir activar o desactivar columnas visibles.
 * - Restablecer columnas por defecto.
 *
 * No debe:
 * - Modificar columnas originales.
 * - Guardar datos de negocio.
 */

import type { TableColumn } from "../Table.types";

export type TableColumnsModalProps<T extends Record<string, unknown>> = {
  open: boolean;
  columns: TableColumn<T>[];
  visibleKeys: string[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  onClose: () => void;
};

export function TableColumnsModal<T extends Record<string, unknown>>({
  open,
  columns,
  visibleKeys,
  onToggleColumn,
  onResetColumns,
  onClose
}: TableColumnsModalProps<T>) {
  if (!open) {
    return null;
  }

  return (
    <div className="ni-table-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="ni-table-modal__backdrop"
        aria-label="Cerrar configuración de columnas"
        onClick={onClose}
      />

      <section className="ni-table-modal__panel">
        <header className="ni-table-modal__header">
          <div>
            <p>Configuración</p>
            <h3>Columnas visibles</h3>
          </div>

          <button
            type="button"
            className="ni-table-modal__close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ni-table-modal__content">
          {columns.map((column) => {
            const key = String(column.key);

            return (
              <label key={key} className="ni-table-modal__option">
                <input
                  type="checkbox"
                  checked={visibleKeys.includes(key)}
                  onChange={() => onToggleColumn(key)}
                />

                <span>{column.title}</span>
              </label>
            );
          })}
        </div>

        <footer className="ni-table-modal__footer">
          <button
            type="button"
            className="ni-table-modal__secondary"
            onClick={onResetColumns}
          >
            Restablecer
          </button>

          <button
            type="button"
            className="ni-table-modal__primary"
            onClick={onClose}
          >
            Listo
          </button>
        </footer>
      </section>
    </div>
  );
}