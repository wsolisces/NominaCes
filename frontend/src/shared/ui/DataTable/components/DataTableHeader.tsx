// ======================================================
// PATH: src/shared/ui/DataTable/components/DataTableHeader.tsx
// Encabezado del DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar búsqueda global.
 * - Mostrar selector de registros por página.
 * - Abrir configuración de columnas cuando aplique.
 * - Mantener buscador, registros y acciones alineados.
 * - Normalizar opciones permitidas de registros por página.
 *
 * No debe:
 * - Filtrar datos por sí mismo.
 * - Persistir configuración.
 * - Conocer reglas de módulos.
 * - Definir estilos visuales fuera de las clases del DataTable.
 */

import { IconColumnsSettings } from "../../../../components/icons/Icons";

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
 * Opciones oficiales permitidas para registros por página.
 */
const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * Ícono decorativo del buscador.
 */
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.5 4a6.5 6.5 0 0 1 5.15 10.46l3.45 3.44a1 1 0 0 1-1.42 1.42l-3.44-3.45A6.5 6.5 0 1 1 10.5 4Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
    </svg>
  );
}

/**
 * Limpia la búsqueda actual.
 */
function clearSearch(setSearch: (value: string) => void): void {
  setSearch("");
}

/**
 * Normaliza las opciones del selector de registros.
 */
function getSafePageSizeOptions(options?: number[]): number[] {
  const source = options?.length ? options : DEFAULT_PAGE_SIZE_OPTIONS;

  const normalizedOptions = source
    .map(Number)
    .filter((option) => Number.isFinite(option))
    .filter((option) => DEFAULT_PAGE_SIZE_OPTIONS.includes(option));

  const uniqueOptions = Array.from(new Set(normalizedOptions));

  return uniqueOptions.length ? uniqueOptions : DEFAULT_PAGE_SIZE_OPTIONS;
}

/**
 * Obtiene un pageSize seguro para evitar que el select quede sin opción válida.
 */
function getSafePageSize(
  pageSize: number,
  pageSizeOptions: number[]
): number {
  return pageSizeOptions.includes(pageSize)
    ? pageSize
    : pageSizeOptions[0];
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
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
}: Props) {
  const hasSearch = search.trim().length > 0;
  const safePageSizeOptions = getSafePageSizeOptions(pageSizeOptions);
  const safePageSize = getSafePageSize(pageSize, safePageSizeOptions);

  return (
    <div className="data-table-header">
      <div className="data-table-header__left">
        <label
          className="data-table-search"
          aria-label="Buscar en la tabla"
        >
          <span
            className="data-table-search__icon"
            aria-hidden="true"
          >
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar..."
            className="data-table-search__input"
            autoComplete="off"
            disabled={loading}
          />

          {hasSearch ? (
            <button
              type="button"
              className="data-table-search__clear"
              onClick={() => clearSearch(setSearch)}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              disabled={loading}
            >
              ×
            </button>
          ) : null}
        </label>

        {loading ? (
          <span
            className="data-table-header__loading"
            role="status"
            aria-live="polite"
          >
            <span
              className="data-table-header__loading-indicator"
              aria-hidden="true"
            />
            Cargando...
          </span>
        ) : null}
      </div>

      <div className="data-table-header__right">
        <label className="data-table-page-size">
          <span className="data-table-page-size__label">
            Registros
          </span>

          <select
            value={safePageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="data-table-select"
            aria-label="Registros por página"
            disabled={loading}
          >
            {safePageSizeOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </label>

        {showColumnsButton ? (
          <button
            type="button"
            className="data-table-button data-table-button--icon"
            onClick={onOpenColumns}
            aria-label="Configurar columnas"
            title="Configurar columnas"
            disabled={loading}
          >
            <span
              className="data-table-button__icon"
              aria-hidden="true"
            >
              <IconColumnsSettings />
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}