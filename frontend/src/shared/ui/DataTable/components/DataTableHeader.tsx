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

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

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
      <path d="M10.5 4a6.5 6.5 0 0 1 5.17 10.44l3.45 3.45a.85.85 0 0 1-1.2 1.2l-3.45-3.45A6.5 6.5 0 1 1 10.5 4Zm0 1.7a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z" />
    </svg>
  );
}

/**
 * Devuelve opciones únicas, ordenadas y válidas.
 */
function normalizePageSizeOptions(options?: number[]): number[] {
  const source = options?.length ? options : DEFAULT_PAGE_SIZE_OPTIONS;

  return Array.from(
    new Set(source.filter((value) => Number.isFinite(value) && value > 0))
  ).sort((a, b) => a - b);
}

/**
 * Encabezado superior de controles del DataTable.
 */
export default function DataTableHeader({
  search,
  setSearch,
  loading = false,
  onOpenColumns,
  showColumnsButton = true,
  pageSize,
  setPageSize,
  pageSizeOptions
}: Props) {
  const options = normalizePageSizeOptions(pageSizeOptions);

  return (
    <header className="data-table-header">
      <div className="data-table-header__search">
        <SearchIcon />

        <input
          type="search"
          value={search}
          disabled={loading}
          placeholder="Buscar..."
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="data-table-header__actions">
        <label className="data-table-header__page-size">
          <span>Registros</span>

          <select
            value={pageSize}
            disabled={loading}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {showColumnsButton ? (
          <button
            type="button"
            className="data-table-header__columns"
            disabled={loading}
            onClick={onOpenColumns}
            aria-label="Configurar columnas"
            title="Configurar columnas"
          >
            <IconColumnsSettings />
          </button>
        ) : null}
      </div>
    </header>
  );
}