// ======================================================
// PATH: src/shared/ui/DataTable/components/DataTableHeader.tsx
// Encabezado del DataTable
// ======================================================

import { IconColumnsSettings } from "../../../../components/icons/Icons";
/**
 * Responsabilidades:
 * - Mostrar búsqueda global.
 * - Mostrar selector de registros por página.
 * - Abrir configuración de columnas cuando aplique.
 *
 * No debe:
 * - Filtrar datos por sí mismo.
 * - Persistir configuración.
 * - Conocer reglas de módulos.
 */

type Props = {
  search: string;
  setSearch: (value: string) => void;
  loading?: boolean;
  onOpenColumns: () => void;
  showColumnsButton?: boolean;
  pageSize: number;
  setPageSize: (value: number) => void;
  pageSizeOptions?: number[];
};

/**
 * Ícono decorativo del buscador.
 */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 4a6.5 6.5 0 0 1 5.15 10.46l3.45 3.44a1 1 0 0 1-1.42 1.42l-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
    </svg>
  );
}

/**
 * Encabezado visual del DataTable.
 */
export default function DataTableHeader({
  search,
  setSearch,
  loading = false,
  onOpenColumns,
  showColumnsButton = true,
  pageSize,
  setPageSize,
  pageSizeOptions = [5, 10, 25, 50, 100, 250]
}: Props) {
  return (
    <div className="data-table-header">
      <div className="data-table-header__left">
        <div className="data-table-search">
          <span className="data-table-search__icon">
            <SearchIcon />
          </span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className="data-table-search__input"
          />
        </div>

        {loading ? (
          <span className="data-table-header__loading">Cargando...</span>
        ) : null}
      </div>

      <div className="data-table-header__right">
        <div className="data-table-page-size">
          <span className="data-table-page-size__label">Registros</span>

          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="data-table-select"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        
        {showColumnsButton ? (
          <button
            type="button"
            className="data-table-button data-table-button--icon"
            onClick={onOpenColumns}
            aria-label="Configurar columnas"
            title="Configurar columnas"
          >
            <IconColumnsSettings className="data-table-button__icon" />
          </button>
        ) : null}
      </div>
    </div>
  );
}