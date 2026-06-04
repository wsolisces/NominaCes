// ======================================================
// PATH: src/shared/ui/DataTable/modals/ConfigurarColumnasModal.tsx
// Modal de configuración de columnas del DataTable
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

import { useMemo, useState } from "react";

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
 * Obtiene la etiqueta de una columna por key.
 */
function getColumnHeader(columns: ColumnItem[], key: string) {
  return columns.find((column) => column.key === key)?.header ?? key;
}

/**
 * Mueve un elemento de una posición a otra dentro de un arreglo.
 */
function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);

  copy.splice(toIndex, 0, item);

  return copy;
}

/**
 * Modal de configuración del DataTable.
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
    return columnOrder
      .map((key) => columns.find((column) => column.key === key))
      .filter(Boolean) as ColumnItem[];
  }, [columns, columnOrder]);

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
          sort.key === key ? { ...sort, dir: "desc" } : sort
        )
      );
      return;
    }

    onChangeSorts(sorts.filter((sort) => sort.key !== key));
  }

  function toggleUnique(key: string) {
    if (uniqueColumns.includes(key)) {
      onChangeUniqueColumns(uniqueColumns.filter((item) => item !== key));
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

    const fromIndex = columnOrder.indexOf(draggedColumn);
    const toIndex = columnOrder.indexOf(targetKey);

    if (fromIndex >= 0 && toIndex >= 0) {
      onReorderColumns(moveItem(columnOrder, fromIndex, toIndex));
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
        className="data-table-modal"
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
              Muestra, oculta, ordena y define reglas visuales de la tabla.
            </p>
          </div>

          <button
            type="button"
            className="data-table-button data-table-button--icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="data-table-modal__body">
          <section className="data-table-modal__section data-table-modal__section--fluid">
            <header className="data-table-modal__section-header">
              <h4 className="data-table-modal__section-title">
                Columnas visibles y orden
              </h4>
              <p className="data-table-modal__section-subtitle">
                Arrastra para reordenar. Marca para mostrar u ocultar.
              </p>
            </header>

            <div className="data-table-modal__scroll">
              {orderedColumns.map((column, index) => {
                const isDragging = draggedColumn === column.key;
                const isHover = hoverColumn === column.key;
                const isVisible = visibleColumns.includes(column.key);
                const isUnique = uniqueColumns.includes(column.key);
                const sort = sorts.find((item) => item.key === column.key);
                const sortIndex = sorts.findIndex((item) => item.key === column.key);

                return (
                  <div
                    key={column.key}
                    className={[
                      "data-table-modal-row",
                      "data-table-modal-row--column",
                      isDragging ? "data-table-modal-row--dragging" : "",
                      isHover ? "data-table-modal-row--hover" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
                    {isHover && draggedColumn !== column.key ? (
                      <span className="data-table-modal-row__line" />
                    ) : null}

                    <button
                      type="button"
                      className="data-table-drag-handle"
                      aria-label="Mover columna"
                    >
                      ⋮⋮
                    </button>

                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => onToggleColumn(column.key)}
                      className="data-table-modal-checkbox"
                    />

                    <span className="data-table-modal-label">
                      {column.header}
                    </span>

                    <span className="data-table-modal-pill">
                      {index + 1}
                    </span>

                    <button
                      type="button"
                      className={[
                        "data-table-button",
                        sort ? "data-table-button--primary" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => toggleSort(column.key)}
                      title="Ordenar columna"
                    >
                      {sort
                        ? `${sort.dir === "asc" ? "▲" : "▼"} ${sortIndex + 1}`
                        : "Orden"}
                    </button>

                    <button
                      type="button"
                      className={[
                        "data-table-button",
                        isUnique ? "data-table-button--primary" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => toggleUnique(column.key)}
                      title="Agrupar como único"
                    >
                      Único
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="data-table-modal__footer">
          <button
            type="button"
            className="data-table-button"
            onClick={onSelectAll}
          >
            Mostrar todas
          </button>

          <button
            type="button"
            className="data-table-button"
            onClick={onClearAll}
          >
            Ocultar todas
          </button>

          <button
            type="button"
            className="data-table-button"
            onClick={onClearSorts}
          >
            Limpiar orden
          </button>

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