// ======================================================
// PATH: src/shared/ui/DataTable/components/DataTableTable.tsx
// Tabla interna reutilizable del DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar encabezados, filas, totales y paginación.
 * - Mantener compatibilidad con filas y columnas genéricas.
 * - Permitir abrir filtros por columna.
 * - Permitir ordenar mediante click derecho.
 * - Soportar modos visuales scroll y fit.
 * - Soportar columnas fijas a izquierda o derecha.
 * - Soportar columnas compactas reutilizables.
 *
 * No debe:
 * - Filtrar datos.
 * - Ordenar datos directamente.
 * - Persistir configuración.
 * - Consultar APIs.
 */

import { useEffect, useMemo, useState } from "react";

import type {
  CSSProperties,
  MouseEvent,
  ReactNode
} from "react";

/**
 * Modos visuales permitidos para la tabla.
 */
type TableMode = "scroll" | "fit";

/**
 * Posiciones sticky permitidas por columna.
 */
type StickyPosition = "left" | "right";

/**
 * Definición interna compatible con columnas genéricas.
 */
type DataTableColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  cell?: (row: T, rowIndex: number) => ReactNode;
  disableSort?: boolean;
  isTotal?: boolean;
  wrap?: boolean;
  fitWidth?: number | string;
  sticky?: StickyPosition;
  stickyOffset?: number;
  compact?: boolean;
};

/**
 * Definición interna de un ordenamiento activo.
 */
type DataTableSort = {
  key: string;
  dir: "asc" | "desc";
};

/**
 * Props de la tabla visual interna.
 */
type DataTableTableProps<T extends Record<string, unknown>> = {
  rows: T[];
  visibleDefs: DataTableColumn<T>[];
  sorts: DataTableSort[];
  handleSortClick: (key: string, event: MouseEvent) => void;
  setOpenColumn: (column: DataTableColumn<T>) => void;
  setCardPosition: (position: { x: number; y: number }) => void;
  onRowClick?: (row: T, rowIndex: number) => void;
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  totals?: Record<string, number>;
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
  showPageSizeSelector?: boolean;
  tableMode?: TableMode;
};

/**
 * Convierte un ancho numérico a pixeles.
 */
function getColumnWidth(width?: number | string): string | undefined {
  if (width === undefined || width === null) {
    return undefined;
  }

  return typeof width === "number" ? `${width}px` : width;
}

/**
 * Calcula el ancho compacto como el doble del encabezado.
 *
 * Ejemplo:
 * - "Estado" tiene 6 caracteres.
 * - compact: true genera 12ch.
 */
function getCompactHeaderWidth<T extends Record<string, unknown>>(
  column: DataTableColumn<T>
): string {
  const headerLength = String(column.header || "").trim().length;
  const safeLength = Math.max(headerLength, 4);

  return `${safeLength * 2}ch`;
}

/**
 * Devuelve texto utilizable como tooltip.
 */
function getTextTitle(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return undefined;
}

/**
 * Obtiene un valor de fila utilizando una clave normalizada.
 */
function getRowValue<T extends Record<string, unknown>>(
  row: T,
  key: keyof T | string
): unknown {
  return row[String(key)];
}

/**
 * Genera una clave estable para una fila.
 */
function getRowKey<T extends Record<string, unknown>>(
  row: T,
  rowIndex: number
): string {
  const rowKey = getRowValue(row, "row_key");

  if (rowKey !== undefined && rowKey !== null) {
    return String(rowKey);
  }

  const permissionKey = getRowValue(row, "permission_key");

  if (permissionKey !== undefined && permissionKey !== null) {
    return `permission-${String(permissionKey)}-${rowIndex}`;
  }

  const id = getRowValue(row, "id");

  if (id !== undefined && id !== null) {
    return `id-${String(id)}-${rowIndex}`;
  }

  const employeeId = getRowValue(row, "employee_id");

  if (employeeId !== undefined && employeeId !== null) {
    const parts = [
      employeeId,
      getRowValue(row, "payroll_type_name"),
      getRowValue(row, "end_period"),
      getRowValue(row, "rule_id"),
      rowIndex
    ];

    return `employee-${parts
      .filter((value) => value !== undefined && value !== null)
      .map(String)
      .join("-")}`;
  }

  const groupKey = getRowValue(row, "group_key");

  if (groupKey !== undefined && groupKey !== null) {
    return `group-${String(groupKey)}-${rowIndex}`;
  }

  return `row-${rowIndex}`;
}

/**
 * Calcula el ancho porcentual de una columna para modo fit.
 */
function getFitColumnWidth<T extends Record<string, unknown>>(
  column: DataTableColumn<T>,
  columnCount: number
): string {
  if (column.fitWidth !== undefined) {
    return getColumnWidth(column.fitWidth) ?? "auto";
  }

  if (typeof column.width === "string" && column.width.includes("%")) {
    return column.width;
  }

  return `${100 / Math.max(columnCount, 1)}%`;
}

/**
 * Calcula el desplazamiento sticky.
 */
function getStickyOffset<T extends Record<string, unknown>>(
  column: DataTableColumn<T>
): number {
  if (typeof column.stickyOffset === "number") {
    return column.stickyOffset;
  }

  return 0;
}

/**
 * Genera clases sticky para th y td.
 */
function getStickyClass<T extends Record<string, unknown>>(
  column: DataTableColumn<T>
): string {
  if (!column.sticky) {
    return "";
  }

  return column.sticky === "left"
    ? "data-table-table__cell--sticky-left"
    : "data-table-table__cell--sticky-right";
}

/**
 * Genera los estilos mínimos necesarios para una celda.
 */
function getCellStyle<T extends Record<string, unknown>>(
  column: DataTableColumn<T>,
  tableMode: TableMode
): CSSProperties {
  const width = column.compact
    ? getCompactHeaderWidth(column)
    : getColumnWidth(column.width);

  const defaultMinWidth = column.compact ? width : "78px";
  const defaultMaxWidth = column.compact ? width : "220px";

  const baseStyle: CSSProperties =
    tableMode === "scroll"
      ? {
          width: width ?? "auto",
          minWidth: width ?? defaultMinWidth,
          maxWidth: width ?? defaultMaxWidth,
          textAlign: column.align ?? "left"
        }
      : {
          width: "auto",
          minWidth: column.compact ? width : 0,
          maxWidth: column.compact ? width : "none",
          textAlign: column.align ?? "left"
        };

  if (!column.sticky) {
    return baseStyle;
  }

  const offset = getStickyOffset(column);

  return {
    ...baseStyle,
    position: "sticky",
    zIndex: 3,
    left: column.sticky === "left" ? offset : undefined,
    right: column.sticky === "right" ? offset : undefined
  };
}

/**
 * Genera las clases de contenido de una celda.
 */

function getContentClass<T extends Record<string, unknown>>(
  column: DataTableColumn<T>,
  tableMode: TableMode
): string {
  const alignClass =
    `data-table-table__content--${column.align ?? "left"}`;

  const wrapClass =
    column.compact || tableMode === "fit" || column.wrap
      ? "data-table-table__content--wrap"
      : "data-table-table__content--truncate";

  const compactClass = column.compact
    ? "data-table-table__content--compact"
    : "";

  return [
    "data-table-table__content",
    alignClass,
    wrapClass,
    compactClass
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Tabla visual interna del DataTable.
 */
export default function DataTableTable<T extends Record<string, unknown>>({
  rows,
  visibleDefs,
  sorts,
  handleSortClick,
  setOpenColumn,
  setCardPosition,
  onRowClick,
  onRowDoubleClick,
  totals,
  pageSize: controlledPageSize,
  onPageSizeChange,
  showPageSizeSelector = false,
  tableMode = "scroll"
}: DataTableTableProps<T>) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeVisibleDefs = Array.isArray(visibleDefs) ? visibleDefs : [];

  const hasTotals = safeVisibleDefs.some((column) => column.isTotal);

  const [internalPageSize, setInternalPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedControlledPageSize = Number(controlledPageSize);

  const pageSize =
    Number.isFinite(normalizedControlledPageSize) &&
    normalizedControlledPageSize > 0
      ? normalizedControlledPageSize
      : internalPageSize;

  const totalRows = safeRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = totalRows === 0 ? 0 : (safePage - 1) * pageSize;

  const endIndex = Math.min(startIndex + pageSize, totalRows);

  const pageRows = useMemo(() => {
    return safeRows.slice(startIndex, endIndex);
  }, [safeRows, startIndex, endIndex]);

  useEffect(() => {
    setCurrentPage(1);
  }, [safeRows, pageSize]);

  useEffect(() => {
    setCurrentPage((previous) => Math.min(Math.max(previous, 1), totalPages));
  }, [totalPages]);

  /**
   * Actualiza el tamaño de página controlado o interno.
   */
  function setPageSize(nextPageSize: number) {
    if (onPageSizeChange) {
      onPageSizeChange(nextPageSize);
    } else {
      setInternalPageSize(nextPageSize);
    }

    setCurrentPage(1);
  }

  const rowsAreClickable = Boolean(onRowClick || onRowDoubleClick);

  return (
    <div className="data-table-table">
      <div
        className={[
          "data-table-table__scroll",
          tableMode === "fit" ? "data-table-table__scroll--fit" : ""
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <table
          className={[
            "data-table-table__table",
            tableMode === "fit"
              ? "data-table-table__table--fit"
              : "data-table-table__table--scroll"
          ].join(" ")}
        >
          {tableMode === "fit" ? (
            <colgroup>
              {safeVisibleDefs.map((column) => (
                <col
                  key={`column-${String(column.key)}`}
                  style={{
                    width: getFitColumnWidth(column, safeVisibleDefs.length)
                  }}
                />
              ))}
            </colgroup>
          ) : null}

          <thead className="data-table-table__head">
            <tr>
              {safeVisibleDefs.map((column) => {
                const key = String(column.key);
                const activeSort = sorts.find((sort) => sort.key === key);
                const sortPriority =
                  sorts.findIndex((sort) => sort.key === key) + 1;

                return (
                  <th
                    key={key}
                    className={[
                      "data-table-table__th",
                      column.compact ? "data-table-table__th--compact" : "",
                      getStickyClass(column)
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      ...getCellStyle(column, tableMode),
                      zIndex: column.sticky ? 8 : undefined
                    }}
                    title={`${column.header} | Click: filtrar | Click derecho: ordenar`}
                    onClick={(event) => {
                      const rectangle =
                        event.currentTarget.getBoundingClientRect();

                      setCardPosition({
                        x: rectangle.left,
                        y: rectangle.bottom + 4
                      });

                      setOpenColumn(column);
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();

                      if (!column.disableSort) {
                        handleSortClick(key, event);
                      }
                    }}
                  >
                    <div
                      className={[
                        "data-table-table__th-inner",
                        `data-table-table__th-inner--${column.align ?? "left"}`
                      ].join(" ")}
                    >
                      <span className="data-table-table__content data-table-table__content--truncate">
                        {column.header}
                      </span>

                      {activeSort ? (
                        <span className="data-table-table__sort-badge">
                          {activeSort.dir === "asc" ? "▲" : "▼"}{" "}
                          {sortPriority}
                        </span>
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="data-table-table__body">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={safeVisibleDefs.length || 1}
                  className="data-table-table__empty"
                >
                  Sin datos
                </td>
              </tr>
            ) : (
              pageRows.map((row, rowIndex) => {
                const realIndex = startIndex + rowIndex;
                const rowKey = getRowKey(row, realIndex);

                return (
                  <tr
                    key={rowKey}
                    className={[
                      "data-table-table__tr",
                      rowsAreClickable ? "data-table-table__tr--clickable" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onRowClick?.(row, realIndex)}
                    onDoubleClick={() => onRowDoubleClick?.(row, realIndex)}
                  >
                    {safeVisibleDefs.map((column) => {
                      const key = String(column.key);

                      const value = column.cell
                        ? column.cell(row, realIndex)
                        : getRowValue(row, key);

                      return (
                        <td
                          key={`${rowKey}-${key}`}
                          className={[
                            "data-table-table__td",
                            column.compact
                              ? "data-table-table__td--compact"
                              : "",
                            getStickyClass(column)
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={getCellStyle(column, tableMode)}
                        >
                          <div
                            className={getContentClass(column, tableMode)}
                            title={getTextTitle(value)}
                          >
                            {value as ReactNode}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {hasTotals ? (
            <tfoot className="data-table-table__foot">
              <tr>
                {safeVisibleDefs.map((column) => {
                  const key = String(column.key);

                  return (
                    <td
                      key={`total-${key}`}
                      className={[
                        "data-table-table__td",
                        column.compact ? "data-table-table__td--compact" : "",
                        getStickyClass(column)
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={getCellStyle(column, tableMode)}
                    >
                      <div className={getContentClass(column, tableMode)}>
                        {column.isTotal
                          ? Number(totals?.[key] ?? 0).toLocaleString(
                              "es-MX",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }
                            )
                          : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="data-table-pagination">
        <div className="data-table-pagination__left">
          <span>
            {totalRows === 0
              ? "0 registros"
              : `${startIndex + 1} - ${endIndex} de ${totalRows}`}
          </span>

          {showPageSizeSelector ? (
            <>
              <span className="data-table-pagination__divider" />

              <div className="data-table-page-size">
                <span className="data-table-page-size__label">
                  Registros
                </span>

                <select
                  value={pageSize}
                  className="data-table-select"
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>
            </>
          ) : null}
        </div>

        <div className="data-table-pagination__right">
          <button
            type="button"
            disabled={safePage <= 1}
            className="data-table-button data-table-button--icon"
            title="Página anterior"
            onClick={() =>
              setCurrentPage((previous) => Math.max(1, previous - 1))
            }
          >
            ‹
          </button>

          <span className="data-table-pagination__page">
            {safePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            className="data-table-button data-table-button--icon"
            title="Página siguiente"
            onClick={() =>
              setCurrentPage((previous) => Math.min(totalPages, previous + 1))
            }
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}