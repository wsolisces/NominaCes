// ======================================================
// PATH: src/shared/ui/Table/components/TableBody.tsx
// Cuerpo visual de Table
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar encabezados, filas, celdas y totales.
 * - Respetar columnas visibles, render personalizado y alineación.
 *
 * No debe:
 * - Calcular datos remotos.
 * - Contener lógica de filtros de negocio.
 * - Persistir configuración.
 */

import type { TableColumn, TableSort } from "../Table.types";

export type TableBodyProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[];
  rows: T[];
  sort: TableSort | null;
  totals: Record<string, number>;
  emptyMessage: string;
  showTotals: boolean;
  startIndex: number;
  minWidth: string;
  maxHeight?: string;
  onSort: (column: TableColumn<T>) => void;
  onRowClick?: (row: T, rowIndex: number) => void;
};

/**
 * Genera una llave de fila estable usando IDs comunes si existen.
 */
function getRowKey(row: Record<string, unknown>, index: number): string {
  const possibleKeys = ["id", "user_id", "employee_id", "role_id", "key"];

  for (const key of possibleKeys) {
    const value = row[key];

    if (value !== undefined && value !== null && value !== "") {
      return `${key}-${String(value)}-${index}`;
    }
  }

  return `row-${index}`;
}

export function TableBody<T extends Record<string, unknown>>({
  columns,
  rows,
  sort,
  totals,
  emptyMessage,
  showTotals,
  startIndex,
  minWidth,
  maxHeight,
  onSort,
  onRowClick
}: TableBodyProps<T>) {
  const hasTotals = showTotals && columns.some((column) => column.isTotal);

  return (
    <div className="ni-table__frame">
      <div
        className="ni-table__scroll"
        style={{
          maxHeight
        }}
      >
        <table style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((column) => {
                const key = String(column.key);
                const activeSort = sort?.key === key ? sort.direction : null;

                return (
                  <th
                    key={key}
                    style={{
                      width: column.width,
                      textAlign: column.align ?? "left"
                    }}
                  >
                    <button
                      type="button"
                      className={[
                        "ni-table__headButton",
                        column.sortable === false
                          ? "ni-table__headButton--disabled"
                          : ""
                      ].join(" ")}
                      onClick={() => onSort(column)}
                    >
                      <span>{column.title}</span>

                      {activeSort && (
                        <span className="ni-table__sort">
                          {activeSort === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="ni-table__empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const realIndex = startIndex + rowIndex;
                const rowKey = getRowKey(row, realIndex);

                return (
                  <tr
                    key={rowKey}
                    className={onRowClick ? "ni-table__row--clickable" : ""}
                    onClick={() => onRowClick?.(row, realIndex)}
                  >
                    {columns.map((column) => {
                      const key = String(column.key);
                      const value = row[key];

                      return (
                        <td
                          key={`${rowKey}-${key}`}
                          style={{
                            width: column.width,
                            textAlign: column.align ?? "left"
                          }}
                        >
                          {column.render
                            ? column.render(row, realIndex)
                            : String(value ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>

          {hasTotals && (
            <tfoot>
              <tr>
                {columns.map((column) => {
                  const key = String(column.key);

                  return (
                    <td
                      key={`total-${key}`}
                      style={{
                        textAlign: column.align ?? "left"
                      }}
                    >
                      {column.isTotal
                        ? totals[key]?.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })
                        : ""}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}