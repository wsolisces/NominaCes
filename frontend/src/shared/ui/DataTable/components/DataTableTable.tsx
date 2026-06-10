// ======================================================
// PATH: src/shared/ui/DataTable/components/DataTableTable.tsx
// Tabla interna reutilizable del DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar encabezados, filas y celdas del DataTable.
 * - Mantener compatibilidad con filas y columnas genéricas.
 * - Abrir filtros por columna con un click.
 * - Ordenar columnas con doble click.
 * - Soportar columnas fijas a izquierda o derecha.
 * - Mostrar estados de carga y vacío.
 *
 * No debe:
 * - Filtrar datos.
 * - Ordenar datos directamente.
 * - Paginar registros.
 * - Persistir configuración.
 * - Consultar APIs.
 */

import { useRef } from "react";

import type { ReactNode } from "react";

import type { ColumnDef } from "../DataTable";

type SortState = {
  key: string;
  direction: "asc" | "desc";
} | null;

type NormalizedColumn<T extends Record<string, unknown>> = ColumnDef<T> & {
  key: string;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
};

export type DataTableTableProps<T extends Record<string, unknown>> = {
  rows: T[];
  columns: NormalizedColumn<T>[];
  loading: boolean;
  emptyMessage: string;
  sort: SortState;
  onSort: (key: string) => void;
  onOpenFilter: (
    key: string,
    label: string,
    x: number,
    y: number
  ) => void;
  onRowDoubleClick?: (row: T) => void;
  rowKey?: (row: T, index: number) => string;
  toCssSize: (value?: number | string) => string | undefined;
};

/**
 * Lee el contenido visible de una celda.
 */
function renderCellValue<T extends Record<string, unknown>>(
  row: T,
  column: NormalizedColumn<T>
): ReactNode {
  if (column.render) {
    return column.render(row);
  }

  const value = row[column.key];

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

/**
 * Obtiene la clase de alineación de una columna.
 */
function getAlignClass(align?: "left" | "center" | "right"): string {
  if (align === "center") {
    return "data-table-cell--center";
  }

  if (align === "right") {
    return "data-table-cell--right";
  }

  return "data-table-cell--left";
}

/**
 * Obtiene la clase de columna fija.
 */
function getFixedClass(fixed?: "left" | "right"): string {
  if (fixed === "left") {
    return "data-table-cell--fixed-left";
  }

  if (fixed === "right") {
    return "data-table-cell--fixed-right";
  }

  return "";
}

/**
 * Obtiene el indicador visual de ordenamiento.
 */
function getSortSymbol(
  isSorted: boolean,
  direction?: "asc" | "desc"
): string {
  if (!isSorted) {
    return "↕";
  }

  return direction === "asc" ? "↑" : "↓";
}

/**
 * Tabla visual interna del DataTable.
 */
export default function DataTableTable<T extends Record<string, unknown>>({
  rows,
  columns,
  loading,
  emptyMessage,
  sort,
  onSort,
  onOpenFilter,
  onRowDoubleClick,
  rowKey,
  toCssSize
}: DataTableTableProps<T>) {
  const clickTimerRef = useRef<number | null>(null);

  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];
  const columnCount = Math.max(safeColumns.length, 1);

  /**
   * Abre el filtro con un click simple.
   */
  function handleHeaderClick(
    column: NormalizedColumn<T>,
    rect: DOMRect
  ): void {
    if (!column.filterable) {
      return;
    }

    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = window.setTimeout(() => {
      onOpenFilter(
        column.key,
        column.label,
        rect.left,
        rect.bottom + 8
      );

      clickTimerRef.current = null;
    }, 180);
  }

  /**
   * Ordena con doble click y evita abrir el filtro.
   */
  function handleHeaderDoubleClick(column: NormalizedColumn<T>): void {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (column.sortable) {
      onSort(column.key);
    }
  }

  return (
    <div className="data-table-card">
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {safeColumns.map((column) => {
                const isSorted = sort?.key === column.key;

                return (
                  <th
                    key={column.key}
                    className={[
                      getAlignClass(column.align),
                      getFixedClass(column.fixed)
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      width: toCssSize(column.width),
                      minWidth: toCssSize(column.minWidth ?? column.width)
                    }}
                    title="1 click: filtrar | 2 clicks: ordenar"
                    onClick={(event) => {
                      const rect =
                        event.currentTarget.getBoundingClientRect();

                      handleHeaderClick(column, rect);
                    }}
                    onDoubleClick={() => handleHeaderDoubleClick(column)}
                  >
                    <div className="data-table-th-content">
                      <span className="data-table-th-label">
                        <span>{column.label}</span>

                        {column.sortable ? (
                          <span
                            className={
                              isSorted
                                ? "data-table-sort-indicator data-table-sort-indicator--active"
                                : "data-table-sort-indicator"
                            }
                          >
                            {getSortSymbol(isSorted, sort?.direction)}
                          </span>
                        ) : null}
                      </span>

                      {column.filterable ? (
                        <span className="data-table-filter-button">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path d="M4 6h16" />
                            <path d="M7 12h10" />
                            <path d="M10 18h4" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columnCount}>
                  <div className="data-table-state">
                    Cargando registros...
                  </div>
                </td>
              </tr>
            ) : null}

            {!loading && safeRows.length === 0 ? (
              <tr>
                <td colSpan={columnCount}>
                  <div className="data-table-state">
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : null}

            {!loading
              ? safeRows.map((row, rowIndex) => (
                  <tr
                    key={rowKey ? rowKey(row, rowIndex) : `row-${rowIndex}`}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                  >
                    {safeColumns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={[
                          getAlignClass(column.align),
                          getFixedClass(column.fixed)
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          width: toCssSize(column.width),
                          minWidth: toCssSize(
                            column.minWidth ?? column.width
                          )
                        }}
                      >
                        {renderCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}