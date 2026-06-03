// ======================================================
// PATH: src/shared/ui/Table/modals/TableChipsModal.tsx
// Modal de filtros activos para Table
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar chips de filtros activos enviados por cada módulo.
 * - Permitir limpiar un filtro o todos.
 *
 * No debe:
 * - Calcular filtros de negocio.
 * - Modificar directamente datos de filas.
 */

import type { TableFilterChip } from "../Table.types";

export type TableChipsModalProps = {
  open: boolean;
  chips: TableFilterChip[];
  onClearChip?: (chip: TableFilterChip) => void;
  onClearAll?: () => void;
  onClose: () => void;
};

export function TableChipsModal({
  open,
  chips,
  onClearChip,
  onClearAll,
  onClose
}: TableChipsModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="ni-table-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="ni-table-modal__backdrop"
        aria-label="Cerrar filtros activos"
        onClick={onClose}
      />

      <section className="ni-table-modal__panel">
        <header className="ni-table-modal__header">
          <div>
            <p>Filtros</p>
            <h3>Filtros activos</h3>
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
          {chips.length === 0 ? (
            <p className="ni-table-modal__empty">
              No hay filtros activos.
            </p>
          ) : (
            <div className="ni-table-modal__chips">
              {chips.map((chip) => (
                <div key={`${chip.key}-${chip.value}`} className="ni-table-chip">
                  <span>
                    <strong>{chip.label}:</strong> {chip.value}
                  </span>

                  {onClearChip && (
                    <button
                      type="button"
                      onClick={() => onClearChip(chip)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="ni-table-modal__footer">
          {onClearAll && chips.length > 0 && (
            <button
              type="button"
              className="ni-table-modal__secondary"
              onClick={onClearAll}
            >
              Limpiar todos
            </button>
          )}

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