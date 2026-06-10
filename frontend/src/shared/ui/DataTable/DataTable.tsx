// ======================================================
// PATH: src/shared/ui/DataTable/DataTable.tsx
// DataTable reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar búsqueda, paginación, ordenamiento y filtros.
 * - Administrar configuración visible de columnas desde un modal.
 * - Permitir reorganizar columnas mediante arrastre.
 * - Permitir marcar columnas como valor único.
 * - Renderizar tabla con scroll horizontal.
 * - Permitir columna principal y acciones fijas.
 * - Abrir filtros por columna desde el encabezado.
 * - Aplicar filtros jerárquicos entre columnas.
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

import type {
  DragEvent,
  ReactNode
} from "react";

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
 * Normaliza las opciones oficiales de registros por página.
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
 * Reordena un arreglo moviendo una llave de origen a destino.
 */
function reorderKeys(
  keys: string[],
  sourceKey: string,
  targetKey: string
): string[] {
  const sourceIndex = keys.indexOf(sourceKey);
  const targetIndex = keys.indexOf(targetKey);

  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex === targetIndex
  ) {
    return keys;
  }

  const next = [...keys];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);

  return next;
}

/**
 * Aplica búsqueda global y filtros activos.
 */
function applySearchAndFilters<T extends Record<string, unknown>>({
  rows,
  search,
  columns,
  filters,
  excludeFilterKey
}: {
  rows: T[];
  search: string;
  columns: Array<ColumnDef<T> & { key: string; visible: boolean }>;
  filters: Record<string, string[]>;
  excludeFilterKey?: string;
}): T[] {
  let nextRows = [...rows];

  if (search.trim()) {
    const query = normalizeValue(search);

    nextRows = nextRows.filter((row) => {
      return columns.some((column) => {
        if (!column.visible) {
          return false;
        }

        const value = readColumnValue(row, column.key);
        return normalizeValue(value).includes(query);
      });
    });
  }

  Object.entries(filters).forEach(([key, values]) => {
    if (key === excludeFilterKey || values.length === 0) {
      return;
    }

    const normalizedValues = values.map(normalizeValue);

    nextRows = nextRows.filter((row) => {
      const value = normalizeValue(readColumnValue(row, key));
      return normalizedValues.includes(value);
    });
  });

  return nextRows;
}

/**
 * Aplica columnas marcadas como valor único.
 */
function applyUniqueColumns<T extends Record<string, unknown>>(
  rows: T[],
  uniqueKeys: Record<string, boolean>
): T[] {
  const activeKeys = Object.entries(uniqueKeys)
    .filter(([, active]) => active)
    .map(([key]) => key);

  if (activeKeys.length === 0) {
    return rows;
  }

  const seen = new Set<string>();

  return rows.filter((row) => {
    const signature = activeKeys
      .map((key) => normalizeValue(readColumnValue(row, key)))
      .join("::");

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
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
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.map((column) => String(column.key))
  );

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    columns.forEach((column) => {
      const key = String(column.key);
      initial[key] = column.visible !== false;
    });

    return initial;
  });

  const [uniqueKeys, setUniqueKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPage(1);
  }, [search, filters, sort, pageSize, uniqueKeys]);

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

    setColumnOrder((current) => {
      const incomingKeys = columns.map((column) => String(column.key));
      const currentKeys = current.filter((key) => incomingKeys.includes(key));
      const newKeys = incomingKeys.filter((key) => !currentKeys.includes(key));

      return [...currentKeys, ...newKeys];
    });
  }, [columns]);

  const normalizedColumns = useMemo(() => {
    const baseColumns = columns.map((column) => ({
      ...column,
      key: String(column.key),
      sortable: column.sortable !== false,
      filterable: column.filterable !== false,
      visible: visibleKeys[String(column.key)] !== false
    }));

    return [...baseColumns].sort((a, b) => {
      const firstIndex = columnOrder.indexOf(a.key);
      const secondIndex = columnOrder.indexOf(b.key);

      return firstIndex - secondIndex;
    });
  }, [columns, visibleKeys, columnOrder]);

  const visibleColumns = useMemo(() => {
    return normalizedColumns.filter((column) => column.visible);
  }, [normalizedColumns]);

  const filteredRows = useMemo(() => {
    const searchedRows = applySearchAndFilters({
      rows: sourceRows,
      search,
      columns: normalizedColumns,
      filters
    });

    const uniqueRows = applyUniqueColumns(searchedRows, uniqueKeys);

    if (!sort) {
      return uniqueRows;
    }

    return [...uniqueRows].sort((a, b) => {
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
  }, [sourceRows, search, normalizedColumns, filters, uniqueKeys, sort]);

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

    const rowsForFilter = applySearchAndFilters({
      rows: sourceRows,
      search,
      columns: normalizedColumns,
      filters,
      excludeFilterKey: filterCard.key
    });

    const values = new Set<string>();

    rowsForFilter.forEach((row) => {
      const value = readColumnValue(row, filterCard.key);

      if (value !== null && value !== undefined && String(value).trim()) {
        values.add(String(value));
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [sourceRows, search, normalizedColumns, filters, filterCard]);

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

      if (current.direction === "asc") {
        return {
          key,
          direction: "desc"
        };
      }

      return null;
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

  const setColumnUnique = useCallback((key: string, unique: boolean) => {
    setUniqueKeys((current) => ({
      ...current,
      [key]: unique
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

  const clearFilters = useCallback(() => {
    setFilters({});
    setFilterCard(null);
  }, []);

  const resetColumnsConfig = useCallback(() => {
    setColumnOrder(columns.map((column) => String(column.key)));
    setSort(null);
    setUniqueKeys({});
    setFilters({});
    setFilterCard(null);

    setVisibleKeys(() => {
      const next: Record<string, boolean> = {};

      columns.forEach((column) => {
        const key = String(column.key);
        next[key] = column.visible !== false;
      });

      return next;
    });
  }, [columns]);

  function handleColumnDragStart(
    event: DragEvent<HTMLDivElement>,
    key: string
  ): void {
    setDraggedColumnKey(key);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleColumnDrop(
    event: DragEvent<HTMLDivElement>,
    targetKey: string
  ): void {
    event.preventDefault();

    if (!draggedColumnKey) {
      return;
    }

    setColumnOrder((current) =>
      reorderKeys(current, draggedColumnKey, targetKey)
    );

    setDraggedColumnKey(null);
  }

  const startRow =
    filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;

  const endRow = Math.min(safePage * pageSize, filteredRows.length);

  return (
    <section className="data-table-shell" data-table-id={tableId}>
      <DataTableHeader
        search={search}
        setSearch={setSearch}
        loading={loading}
        onOpenColumns={() => setShowColumnsConfig(true)}
        showColumnsButton={columns.length > 0}
        pageSize={pageSize}
        setPageSize={setPageSize}
        pageSizeOptions={safePageSizeOptions}
      />

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

      {showColumnsConfig ? (
        <div
          className="data-table-columns-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Configuración de columnas"
        >
          <button
            type="button"
            className="data-table-columns-modal__backdrop"
            aria-label="Cerrar configuración de columnas"
            onClick={() => setShowColumnsConfig(false)}
          />

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
                className="data-table-columns-panel__button"
                onClick={() => setShowColumnsConfig(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="data-table-columns-panel__actions">
              <button type="button" onClick={showAllColumns}>
                Mostrar todas
              </button>

              <button type="button" onClick={resetColumnsConfig}>
                Restablecer
              </button>

            </div>

            <div className="data-table-columns-panel__grid">
              {normalizedColumns.map((column, index) => (
                <div
                  key={column.key}
                  className={
                    draggedColumnKey === column.key
                      ? "data-table-columns-panel__item data-table-columns-panel__item--dragging"
                      : "data-table-columns-panel__item"
                  }
                  draggable
                  onDragStart={(event) =>
                    handleColumnDragStart(event, column.key)
                  }
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleColumnDrop(event, column.key)}
                  title={column.label}
                >
                  <span
                    className="data-table-columns-panel__order"
                    aria-label={`Orden ${index + 1}`}
                  >
                    {index + 1}
                  </span>

                  <span
                    className="data-table-columns-panel__drag"
                    aria-hidden="true"
                  >
                    ⋮⋮
                  </span>

                  <label className="data-table-columns-panel__unique">
                    <span>Único</span>

                    <input
                      type="checkbox"
                      checked={uniqueKeys[column.key] === true}
                      onChange={(event) =>
                        setColumnUnique(column.key, event.target.checked)
                      }
                    />
                  </label>

                  <label className="data-table-columns-panel__check">
                    <span>Mostrar</span>

                    <input
                      type="checkbox"
                      checked={visibleKeys[column.key] !== false}
                      onChange={(event) =>
                        setColumnVisibility(column.key, event.target.checked)
                      }
                    />
                  </label>

                  <span className="data-table-columns-panel__name">
                    {column.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

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