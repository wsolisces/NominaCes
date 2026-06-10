// ======================================================
// PATH: src/shared/ui/DataTable/DataTable.tsx
// DataTable reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar búsqueda, paginación, ordenamiento y filtros.
 * - Administrar configuración visible de columnas.
 * - Renderizar tabla con scroll horizontal.
 * - Permitir columna principal y acciones fijas.
 * - Abrir filtros por columna desde el encabezado.
 *
 * No debe:
 * - Consultar APIs.
 * - Conocer reglas de módulos específicos.
 * - Persistir datos de negocio.
 * - Definir lógica visual específica de Permisos, Roles o Usuarios.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import type { ReactNode } from "react";

import DataTableHeader from "./components/DataTableHeader";
import DataTableTable from "./components/DataTableTable";
import FilterCard from "./filters/FilterCard";

import "./dataTable.css";

export type ColumnDef<T extends Record<string, unknown>> = {
  key: keyof T | string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean;
  fixed?: "left" | "right";
  render?: (row: T) => ReactNode;
};

type SortDirection = "asc" | "desc";

type SortState = {
  key: string;
  direction: SortDirection;
} | null;

type FilterCardState = {
  key: string;
  label: string;
  x: number;
  y: number;
} | null;

export type DataTableProps<T extends Record<string, unknown>> = {
  tableId: string;
  sourceRows: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  onRowDoubleClick?: (row: T) => void;
  onDataChange?: (rows: T[]) => void;
  rowKey?: (row: T, index: number) => string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * Convierte cualquier valor visible en texto comparable.
 */
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).toLowerCase().trim();
}

/**
 * Lee el valor base de una columna usando la llave configurada.
 */
function readColumnValue<T extends Record<string, unknown>>(
  row: T,
  key: string
): unknown {
  return row[key];
}

/**
 * Normaliza medidas numéricas o string para aplicarlas como CSS.
 */
function toCssSize(value?: number | string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  return value;
}

/**
 * Normaliza las opciones permitidas de registros por página.
 */
function normalizePageSizeOptions(options?: number[]): number[] {
  if (!Array.isArray(options) || options.length === 0) {
    return DEFAULT_PAGE_SIZE_OPTIONS;
  }

  const allowedValues = new Set(DEFAULT_PAGE_SIZE_OPTIONS);

  const normalizedOptions = options.filter((option) =>
    allowedValues.has(option)
  );

  return normalizedOptions.length > 0
    ? normalizedOptions
    : DEFAULT_PAGE_SIZE_OPTIONS;
}

/**
 * DataTable centralizado.
 */
export default function DataTable<T extends Record<string, unknown>>({
  tableId,
  sourceRows,
  columns,
  loading = false,
  error = null,
  emptyMessage = "Sin registros disponibles.",
  pageSizeOptions,
  defaultPageSize = 10,
  onRowDoubleClick,
  onDataChange,
  rowKey
}: DataTableProps<T>) {
  const safePageSizeOptions = useMemo(
    () => normalizePageSizeOptions(pageSizeOptions),
    [pageSizeOptions]
  );

  const initialPageSize = safePageSizeOptions.includes(defaultPageSize)
    ? defaultPageSize
    : 10;

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [filterCard, setFilterCard] = useState<FilterCardState>(null);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    columns.forEach((column) => {
      const key = String(column.key);
      initial[key] = column.visible !== false;
    });

    return initial;
  });

  useEffect(() => {
    setPage(1);
  }, [search, filters, sort, pageSize]);

  useEffect(() => {
    setPageSize((current) =>
      safePageSizeOptions.includes(current) ? current : 10
    );
  }, [safePageSizeOptions]);

  useEffect(() => {
    setVisibleKeys((current) => {
      const next: Record<string, boolean> = {};

      columns.forEach((column) => {
        const key = String(column.key);
        next[key] = current[key] ?? column.visible !== false;
      });

      return next;
    });
  }, [columns]);

  const normalizedColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      key: String(column.key),
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      visible: visibleKeys[String(column.key)] !== false
    }));
  }, [columns, visibleKeys]);

  const visibleColumns = useMemo(() => {
    return normalizedColumns.filter((column) => column.visible);
  }, [normalizedColumns]);

  const searchableColumns = useMemo(() => {
    return normalizedColumns.filter((column) => column.visible);
  }, [normalizedColumns]);

  const filteredRows = useMemo(() => {
    let rows = [...sourceRows];

    if (search.trim()) {
      const query = normalizeValue(search);

      rows = rows.filter((row) => {
        return searchableColumns.some((column) => {
          const value = readColumnValue(row, column.key);
          return normalizeValue(value).includes(query);
        });
      });
    }

    Object.entries(filters).forEach(([key, values]) => {
      if (!values.length) {
        return;
      }

      const normalizedValues = values.map(normalizeValue);

      rows = rows.filter((row) => {
        const value = normalizeValue(readColumnValue(row, key));
        return normalizedValues.includes(value);
      });
    });

    if (sort) {
      rows.sort((a, b) => {
        const first = normalizeValue(readColumnValue(a, sort.key));
        const second = normalizeValue(readColumnValue(b, sort.key));

        if (first < second) {
          return sort.direction === "asc" ? -1 : 1;
        }

        if (first > second) {
          return sort.direction === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    return rows;
  }, [sourceRows, search, searchableColumns, filters, sort]);

  useEffect(() => {
    onDataChange?.(filteredRows);
  }, [filteredRows, onDataChange]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const filterGroups = useMemo(() => {
    return Object.entries(filters)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => {
        const column = normalizedColumns.find((item) => item.key === key);

        return {
          key,
          label: column?.label ?? key,
          values,
          count: values.length
        };
      });
  }, [filters, normalizedColumns]);

  const hasFilters = filterGroups.length > 0;

  const availableFilterValues = useMemo(() => {
    if (!filterCard) {
      return [];
    }

    const values = new Set<string>();

    sourceRows.forEach((row) => {
      const value = readColumnValue(row, filterCard.key);

      if (value !== null && value !== undefined && String(value).trim()) {
        values.add(String(value));
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [sourceRows, filterCard]);

  const selectedFilterValues = filterCard
    ? filters[filterCard.key] ?? []
    : [];

  const toggleSort = useCallback((key: string) => {
    setSort((current) => {
      if (!current || current.key !== key) {
        return {
          key,
          direction: "asc"
        };
      }

      return {
        key,
        direction: current.direction === "asc" ? "desc" : "asc"
      };
    });
  }, []);

  const openFilterCard = useCallback(
    (key: string, label: string, x: number, y: number) => {
      setFilterCard({
        key,
        label,
        x,
        y
      });
    },
    []
  );

  const setColumnVisibility = useCallback((key: string, visible: boolean) => {
    setVisibleKeys((current) => ({
      ...current,
      [key]: visible
    }));
  }, []);

  const showAllColumns = useCallback(() => {
    setVisibleKeys((current) => {
      const next = { ...current };

      normalizedColumns.forEach((column) => {
        next[column.key] = true;
      });

      return next;
    });
  }, [normalizedColumns]);

  const hideOptionalColumns = useCallback(() => {
    setVisibleKeys((current) => {
      const next = { ...current };

      normalizedColumns.forEach((column, index) => {
        next[column.key] =
          index < 2 ||
          column.fixed === "left" ||
          column.fixed === "right";
      });

      return next;
    });
  }, [normalizedColumns]);

  const clearFilters = useCallback(() => {
    setFilters({});
    setFilterCard(null);
  }, []);

  const clearSort = useCallback(() => {
    setSort(null);
  }, []);

  const startRow =
    filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;

  const endRow = Math.min(safePage * pageSize, filteredRows.length);

  return (
    <section className="data-table-shell" data-table-id={tableId}>
      <DataTableHeader
        search={search}
        setSearch={setSearch}
        loading={loading}
        onOpenColumns={() => setShowColumnsConfig((current) => !current)}
        showColumnsButton={columns.length > 0}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageSizeOptions={safePageSizeOptions}
      />

      {showColumnsConfig ? (
        <div className="data-table-columns-panel">
          <div className="data-table-columns-panel__header">
            <div>
              <p className="data-table-columns-panel__eyebrow">
                Configuración
              </p>
              <h3>Columnas visibles</h3>
            </div>

            <button
              type="button"
              className="data-table-columns-panel__close"
              onClick={() => setShowColumnsConfig(false)}
            >
              Cerrar
            </button>
          </div>

          <div className="data-table-columns-panel__actions">
            <button type="button" onClick={showAllColumns}>
              Mostrar todas
            </button>

            <button type="button" onClick={hideOptionalColumns}>
              Ocultar opcionales
            </button>

            <button type="button" onClick={clearSort}>
              Quitar orden
            </button>

            <button type="button" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>

          <div className="data-table-columns-panel__grid">
            {normalizedColumns.map((column) => (
              <label
                key={column.key}
                className="data-table-columns-panel__item"
              >
                <input
                  type="checkbox"
                  checked={visibleKeys[column.key] !== false}
                  onChange={(event) =>
                    setColumnVisibility(column.key, event.target.checked)
                  }
                />

                <span>{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {hasFilters ? (
        <div className="data-table-active-filters">
          <div className="data-table-active-filters__list">
            {filterGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                className="data-table-active-filter"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();

                  openFilterCard(
                    group.key,
                    group.label,
                    rect.left,
                    rect.bottom + 8
                  );
                }}
              >
                <span>{group.label}</span>
                <strong>{group.count}</strong>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="data-table-active-filters__clear"
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="data-table-error">
          {error}
        </div>
      ) : null}

      <DataTableTable
        rows={paginatedRows}
        columns={visibleColumns}
        loading={loading}
        emptyMessage={emptyMessage}
        sort={sort}
        onSort={toggleSort}
        onOpenFilter={openFilterCard}
        onRowDoubleClick={onRowDoubleClick}
        rowKey={rowKey}
        toCssSize={toCssSize}
      />

      <footer className="data-table-footer">
        <p>
          Mostrando <strong>{startRow}</strong> a <strong>{endRow}</strong> de{" "}
          <strong>{filteredRows.length}</strong> registros
        </p>

        <div className="data-table-pagination">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="Página anterior"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={
                  pageNumber === safePage
                    ? "data-table-pagination__page data-table-pagination__page--active"
                    : "data-table-pagination__page"
                }
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            aria-label="Página siguiente"
          >
            →
          </button>
        </div>
      </footer>

      {filterCard ? (
        <FilterCard
          title={filterCard.label}
          values={availableFilterValues}
          selected={selectedFilterValues}
          openAt={{
            x: filterCard.x,
            y: filterCard.y
          }}
          onApply={(values: string[]) => {
            setFilters((current) => ({
              ...current,
              [filterCard.key]: values
            }));
          }}
          onClear={() => {
            setFilters((current) => {
              const next = { ...current };
              delete next[filterCard.key];
              return next;
            });
          }}
          onClose={() => setFilterCard(null)}
        />
      ) : null}
    </section>
  );
}