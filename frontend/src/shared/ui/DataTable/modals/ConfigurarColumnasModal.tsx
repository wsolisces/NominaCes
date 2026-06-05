// ======================================================
// PATH: src/shared/ui/DataTable/modals/ConfigurarColumnasModal.tsx
// Modal compacto de configuración de columnas
// ======================================================

/**
 * Responsabilidades:
 * - Configurar columnas visibles.
 * - Reordenar columnas.
 * - Configurar ordenamiento múltiple.
 * - Configurar columnas únicas.
 *
 * No debe:
 * - Filtrar datos.
 * - Persistir configuración.
 * - Consultar APIs.
 */

import { useEffect, useMemo, useState } from "react";

type ColumnItem = {
  key: string;
  header: string;
};

type SortItem = {
  key: string;
  dir: "asc" | "desc";
};

type ColumnsModalProps = {
  open: boolean;
  onClose: () => void;
  columns: ColumnItem[];
  columnOrder: string[];
  visibleColumns: string[];
  sorts: SortItem[];
  uniqueColumns: string[];
  onToggleColumn: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onReset: () => void;
  onChangeSorts: (sorts: SortItem[]) => void;
  onChangeUniqueColumns: (columns: string[]) => void;
  onClearSorts: () => void;
  onReorderColumns: (columns: string[]) => void;
};

/**
 * Mueve un elemento dentro de un arreglo.
 */
function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);

  if (item === undefined) {
    return copy;
  }

  copy.splice(toIndex, 0, item);

  return copy;
}

/**
 * Construye una cadena de clases válida.
 */
function classNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Modal compacto para configurar las columnas del DataTable.
 */
export default function ColumnsModal({
  open,
  onClose,
  columns,
  columnOrder,
  visibleColumns,
  sorts,
  uniqueColumns,
  onToggleColumn,
  onSelectAll,
  onClearAll,
  onReset,
  onChangeSorts,
  onChangeUniqueColumns,
  onClearSorts,
  onReorderColumns
}: ColumnsModalProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [hoverColumn, setHoverColumn] = useState<string | null>(null);

  const orderedColumns = useMemo(() => {
    const columnsByKey = new Map(
      columns.map((column) => [column.key, column])
    );

    const configured = columnOrder
      .map((key) => columnsByKey.get(key))
      .filter((column): column is ColumnItem => Boolean(column));

    const configuredKeys = new Set(
      configured.map((column) => column.key)
    );

    const missing = columns.filter(
      (column) => !configuredKeys.has(column.key)
    );

    return [...configured, ...missing];
  }, [columns, columnOrder]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function toggleSort(key: string) {
    const existing = sorts.find((sort) => sort.key === key);

    if (!existing) {
      onChangeSorts([...sorts, { key, dir: "asc" }]);
      return;
    }

    if (existing.dir === "asc") {
      onChangeSorts(
        sorts.map((sort) =>
          sort.key === key
            ? { ...sort, dir: "desc" }
            : sort
        )
      );
      return;
    }

    onChangeSorts(
      sorts.filter((sort) => sort.key !== key)
    );
  }

  function toggleUnique(key: string) {
    if (uniqueColumns.includes(key)) {
      onChangeUniqueColumns(
        uniqueColumns.filter((columnKey) => columnKey !== key)
      );
      return;
    }

    onChangeUniqueColumns([...uniqueColumns, key]);
  }

  function handleDrop(targetKey: string) {
    if (!draggedColumn || draggedColumn === targetKey) {
      setDraggedColumn(null);
      setHoverColumn(null);
      return;
    }

    const currentOrder = orderedColumns.map(
      (column) => column.key
    );

    const fromIndex = currentOrder.indexOf(draggedColumn);
    const toIndex = currentOrder.indexOf(targetKey);

    if (fromIndex >= 0 && toIndex >= 0) {
      onReorderColumns(
        moveItem(currentOrder, fromIndex, toIndex)
      );
    }

    setDraggedColumn(null);
    setHoverColumn(null);
  }

  return (
    <div
      className="data-table-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="data-table-modal data-table-modal--columns"
        role="dialog"
        aria-modal="true"
        aria-label="Configurar columnas"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="data-table-modal__header">
          <div>
            <h3 className="data-table-modal__title">
              Configurar columnas
            </h3>

            <p className="data-table-modal__subtitle">
              Selecciona, ordena y configura las columnas.
            </p>
          </div>

          <button
            type="button"
            className="data-table-button data-table-button--icon data-table-button--close"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="data-table-modal__quick-actions">
          <button
            type="button"
            className="data-table-button data-table-button--small"
            onClick={onSelectAll}
          >
            Mostrar todas
          </button>

          <button
            type="button"
            className="data-table-button data-table-button--small"
            onClick={onClearAll}
          >
            Ocultar todas
          </button>

          <button
            type="button"
            className="data-table-button data-table-button--small"
            onClick={onClearSorts}
            disabled={sorts.length === 0}
          >
            Limpiar orden
          </button>
        </div>

        <div className="data-table-modal__body">
          <div className="data-table-modal__scroll">
            {orderedColumns.map((column, index) => {
              const isVisible = visibleColumns.includes(column.key);
              const isUnique = uniqueColumns.includes(column.key);
              const sort = sorts.find(
                (item) => item.key === column.key
              );
              const sortIndex = sorts.findIndex(
                (item) => item.key === column.key
              );

              return (
                <div
                  key={column.key}
                  className={classNames(
                    "data-table-modal-row",
                    "data-table-modal-row--column",
                    !isVisible && "data-table-modal-row--hidden",
                    draggedColumn === column.key &&
                      "data-table-modal-row--dragging",
                    hoverColumn === column.key &&
                      draggedColumn !== column.key &&
                      "data-table-modal-row--hover"
                  )}
                  draggable
                  onDragStart={() => setDraggedColumn(column.key)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setHoverColumn(column.key);
                  }}
                  onDrop={() => handleDrop(column.key)}
                  onDragEnd={() => {
                    setDraggedColumn(null);
                    setHoverColumn(null);
                  }}
                >
                  <span
                    className="data-table-drag-handle"
                    title="Arrastrar para mover"
                  >
                    ⋮⋮
                  </span>

                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleColumn(column.key)}
                    className="data-table-modal-checkbox"
                    aria-label={`Mostrar columna ${column.header}`}
                  />

                  <span className="data-table-modal-pill">
                    {index + 1}
                  </span>

                  <span className="data-table-modal-label">
                    {column.header}
                  </span>

                  <button
                    type="button"
                    className={classNames(
                      "data-table-button",
                      "data-table-button--small",
                      sort && "data-table-button--primary"
                    )}
                    onClick={() => toggleSort(column.key)}
                    title="Cambiar orden"
                  >
                    {sort
                      ? `${
                          sort.dir === "asc" ? "↑" : "↓"
                        } ${sortIndex + 1}`
                      : "Orden"}
                  </button>

                  <button
                    type="button"
                    className={classNames(
                      "data-table-button",
                      "data-table-button--small",
                      isUnique && "data-table-button--primary"
                    )}
                    onClick={() => toggleUnique(column.key)}
                    title="Mostrar valores únicos"
                  >
                    Único
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="data-table-modal__footer">
          <button
            type="button"
            className="data-table-button data-table-button--danger"
            onClick={onReset}
          >
            Restablecer
          </button>

          <button
            type="button"
            className="data-table-button data-table-button--primary"
            onClick={onClose}
          >
            Listo
          </button>
        </footer>
      </section>
    </div>
  );
}