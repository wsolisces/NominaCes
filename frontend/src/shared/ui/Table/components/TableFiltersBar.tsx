// ======================================================
// PATH: src/shared/ui/Table/components/TableFiltersBar.tsx
// Barra superior de controles para Table
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar búsqueda global, contador, selector de página y botones opcionales.
 * - Abrir configuración de columnas cuando la tabla lo permite.
 * - Ejecutar exportación cuando la tabla lo permite.
 *
 * No debe:
 * - Calcular filtros de negocio.
 * - Renderizar la tabla.
 * - Modificar datos originales.
 */

import type { TableFilterChip } from "../Table.types";

export type TableFiltersBarProps = {
  search: string;
  onSearchChange: (value: string) => void;

  searchable: boolean;
  configurableColumns: boolean;
  exportable: boolean;
  paginated: boolean;
  showPageSize: boolean;
  showCount: boolean;
  showFilterChips: boolean;

  loading: boolean;
  totalRows: number;
  pageSize: number;
  pageSizeOptions: number[];

  filterChips: TableFilterChip[];

  onPageSizeChange: (value: number) => void;
  onOpenColumns: () => void;
  onOpenChips: () => void;
  onExportCsv: () => void;
};

export function TableFiltersBar({
  search,
  onSearchChange,
  searchable,
  configurableColumns,
  exportable,
  paginated,
  showPageSize,
  showCount,
  showFilterChips,
  loading,
  totalRows,
  pageSize,
  pageSizeOptions,
  filterChips,
  onPageSizeChange,
  onOpenColumns,
  onOpenChips,
  onExportCsv
}: TableFiltersBarProps) {
  const hasRightActions =
    showCount ||
    exportable ||
    configurableColumns ||
    showFilterChips ||
    (showPageSize && paginated);

  if (!searchable && !hasRightActions && !loading) {
    return null;
  }

  return (
    <div className="ni-table__toolbar">
      <div className="ni-table__toolbarLeft">
        {searchable && (
          <label className="ni-table__search">
            <span>Buscar</span>

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar en la tabla..."
            />
          </label>
        )}

        {loading && (
          <span className="ni-table__status">
            Cargando...
          </span>
        )}
      </div>

      {hasRightActions && (
        <div className="ni-table__toolbarRight">
          {showFilterChips && filterChips.length > 0 && (
            <button
              type="button"
              className="ni-table__ghostButton"
              onClick={onOpenChips}
            >
              Filtros · {filterChips.length}
            </button>
          )}

          {showCount && (
            <span className="ni-table__count">
              {totalRows.toLocaleString("es-MX")} registros
            </span>
          )}

          {showPageSize && paginated && (
            <label className="ni-table__pageSize">
              <span>Mostrar</span>

              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          {exportable && (
            <button
              type="button"
              className="ni-table__ghostButton"
              onClick={onExportCsv}
            >
              Exportar
            </button>
          )}

          {configurableColumns && (
            <button
              type="button"
              className="ni-table__ghostButton"
              onClick={onOpenColumns}
            >
              Columnas
            </button>
          )}
        </div>
      )}
    </div>
  );
}