// ======================================================
// PATH: src/shared/ui/DataTable/DataTable.tsx
// DataTable reutilizable enterprise
// ======================================================

/**
 * Responsabilidades:
 * - Orquestar búsqueda, filtros, ordenamiento, columnas y paginación.
 * - Mantener persistencia de columnas y registros por página.
 * - Exponer callbacks para integrar datos filtrados con páginas externas.
 *
 * No debe:
 * - Consultar APIs.
 * - Conocer reglas de negocio de módulos.
 * - Definir estilos repetidos en línea.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { useDataTable } from "./hook/useDataTable";

import DataTableFilters from "./components/DataTableFiltersBar";
import DataTableHeader from "./components/DataTableHeader";
import DataTableTable from "./components/DataTableTable";

import FilterCard from "./filters/FilterCard";
import ModalChips from "./modals/ModalChips";
import ColumnsModal from "./modals/ConfigurarColumnasModal";

import "./dataTable.css";

/**
 * Alineación permitida por columna.
 */
export type Align = "left" | "center" | "right";

/**
 * Modo visual de tabla.
 *
 * scroll: permite scroll horizontal.
 * fit: adapta columnas al ancho disponible.
 */
export type TableMode = "scroll" | "fit";

/**
 * Definición de columna reutilizable.
 */
export type ColumnDef<T> = {
  key: keyof T | string;
  header: string;
  width?: number | string;
  align?: Align;
  cell?: (row: T, rowIndex: number) => ReactNode;
  filterValue?: (row: T) => string;
  disableSort?: boolean;
  isTotal?: boolean;
  wrap?: boolean;
  fitWidth?: number | string;
  sticky?: "left" | "right";
  stickyOffset?: number;
  compact?: boolean;
};

/**
 * Estado de ordenamiento expuesto hacia el exterior.
 */
export type SortState = {
  key: string;
  direction: "asc" | "desc";
  priority: number;
};

/**
 * Props públicas del DataTable.
 */
export type DataTableProps<T extends Record<string, unknown>> = {
  tableId: string;
  sourceRows: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string | null;
  onRowClick?: (row: T, rowIndex: number) => void;
  onRowDoubleClick?: (row: T, rowIndex: number) => void;
  onDataChange?: (data: {
    rows: T[];
    visibleColumns: string[];
    columnOrder: string[];
    filters: Record<string, string[]>;
    sortState: SortState[];
  }) => void;
  disableColumnConfig?: boolean;
  forceColumnOrder?: boolean;
  tableMode?: TableMode;
};

/**
 * Convierte un valor persistido en arreglo de strings seguro.
 */
function safeStringArray(raw: string | null, fallback: string[]) {
  try {
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return parsed.map(String);
  } catch {
    return fallback;
  }
}

/**
 * Compara dos arreglos de strings conservando orden.
 */
function sameStringArray(a: string[], b: string[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

/**
 * Normaliza el tamaño de página permitido.
 */
function getSafePageSize(raw: string | null) {
  const parsed = raw ? Number(raw) : 10;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  if (![5, 10, 25, 50, 100, 250].includes(parsed)) {
    return 10;
  }

  return parsed;
}

/**
 * Tabla reutilizable con búsqueda, filtros, ordenamiento, columnas y paginación.
 */
export default function DataTable<T extends Record<string, unknown>>({
  tableId,
  sourceRows,
  columns,
  loading = false,
  error = null,
  onRowClick,
  onRowDoubleClick,
  onDataChange,
  disableColumnConfig = false,
  forceColumnOrder = false,
  tableMode = "scroll"
}: DataTableProps<T>) {
  const storageKey = `datatable:${tableId}:columns`;
  const orderKey = `datatable:${tableId}:columns:order`;
  const pageSizeKey = `datatable:${tableId}:pageSize`;

  const columnKeys = useMemo(
    () => columns.map((column) => String(column.key)),
    [columns]
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    forceColumnOrder
      ? columnKeys
      : safeStringArray(localStorage.getItem(storageKey), columnKeys)
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    forceColumnOrder
      ? columnKeys
      : safeStringArray(localStorage.getItem(orderKey), columnKeys)
  );

  useEffect(() => {
    if (forceColumnOrder) {
      setVisibleColumns(columnKeys);
      setColumnOrder(columnKeys);
      return;
    }

    setVisibleColumns((prev) => {
      const validPrev = prev.filter((key) => columnKeys.includes(key));
      const missingKeys = columnKeys.filter((key) => !validPrev.includes(key));
      const next = [...validPrev, ...missingKeys];

      return sameStringArray(prev, next) ? prev : next;
    });

    setColumnOrder((prev) => {
      const validPrev = prev.filter((key) => columnKeys.includes(key));
      const missingKeys = columnKeys.filter((key) => !validPrev.includes(key));
      const next = [...validPrev, ...missingKeys];

      return sameStringArray(prev, next) ? prev : next;
    });
  }, [columnKeys, forceColumnOrder]);

  useEffect(() => {
    if (forceColumnOrder) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
  }, [storageKey, visibleColumns, forceColumnOrder]);

  useEffect(() => {
    if (forceColumnOrder) {
      return;
    }

    localStorage.setItem(orderKey, JSON.stringify(columnOrder));
  }, [orderKey, columnOrder, forceColumnOrder]);

  const [pageSize, setPageSize] = useState<number>(() =>
    getSafePageSize(localStorage.getItem(pageSizeKey))
  );

  const handlePageSizeChange = (next: number) => {
    const safeNext = getSafePageSize(String(next));
    setPageSize(safeNext);
  };

  useEffect(() => {
    localStorage.setItem(pageSizeKey, String(pageSize));
  }, [pageSizeKey, pageSize]);

  const [uniqueColumns, setUniqueColumns] = useState<string[]>([]);

  useEffect(() => {
    setUniqueColumns((prev) => prev.filter((key) => columnKeys.includes(key)));
  }, [columnKeys]);

  const visibleDefs = useMemo(() => {
    return columnOrder
      .filter((key) => visibleColumns.includes(key))
      .map((key) => columns.find((column) => String(column.key) === key))
      .filter(Boolean) as ColumnDef<T>[];
  }, [columns, visibleColumns, columnOrder]);

  const {
    search,
    setSearch,
    filters,
    setFilters,
    sorts,
    setSorts,
    handleSortClick,
    orderedRows,
    columnValues
  } = useDataTable(sourceRows, visibleDefs);

  const finalRows = useMemo(() => {
    if (!uniqueColumns.length) {
      return orderedRows;
    }

    const seen = new Set<string>();

    return orderedRows.filter((row) => {
      const key = uniqueColumns
        .map((col) => {
          const value = row[col];

          if (value === null || value === undefined) {
            return "";
          }

          return String(value).trim();
        })
        .join("|");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    });
  }, [orderedRows, uniqueColumns]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    visibleDefs.forEach((col) => {
      if (!col.isTotal) {
        return;
      }

      const key = String(col.key);

      result[key] = finalRows.reduce((acc, row) => {
        const value = Number(row[key]);

        return acc + (Number.isNaN(value) ? 0 : value);
      }, 0);
    });

    return result;
  }, [finalRows, visibleDefs]);

  const onDataChangeRef = useRef(onDataChange);
  const lastEmitSignatureRef = useRef("");

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    if (!onDataChangeRef.current) {
      return;
    }

    const mappedSorts: SortState[] = sorts.map((sort, index) => ({
      key: sort.key,
      direction: sort.dir,
      priority: index + 1
    }));

    const signature = JSON.stringify({
      rowsLength: finalRows.length,
      visibleColumns,
      columnOrder,
      filters,
      sortState: mappedSorts,
      firstRow: finalRows[0] ?? null,
      lastRow: finalRows[finalRows.length - 1] ?? null
    });

    if (signature === lastEmitSignatureRef.current) {
      return;
    }

    lastEmitSignatureRef.current = signature;

    onDataChangeRef.current({
      rows: finalRows,
      visibleColumns,
      columnOrder,
      filters,
      sortState: mappedSorts
    });
  }, [finalRows, visibleColumns, columnOrder, filters, sorts]);

  const [openColumn, setOpenColumn] = useState<ColumnDef<T> | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });

  const [openModal, setOpenModal] = useState(false);

  const [openFiltersModal, setOpenFiltersModal] = useState(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState<{
    key: string;
    label: string;
    values: string[];
    count: number;
  } | null>(null);

  const hasFilters = Object.keys(filters).length > 0;

  const filterGroups = useMemo(() => {
    return Object.entries(filters)
      .map(([colKey, values]) => {
        const column = columns.find((c) => String(c.key) === colKey);

        return {
          key: colKey,
          label: column?.header || colKey,
          values,
          count: values.length
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filters, columns]);

  return (
    <div className="data-table">
      

      <DataTableHeader
        search={search}
        setSearch={setSearch}
        loading={loading}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        showColumnsButton={!disableColumnConfig}
        onOpenColumns={() => setOpenModal(true)}
      />

      <DataTableFilters
        hasFilters={hasFilters}
        filterGroups={filterGroups}
        setFilters={setFilters}
        setActiveFilterGroup={setActiveFilterGroup}
        setOpenFiltersModal={setOpenFiltersModal}
      />

      <ModalChips
        open={openFiltersModal}
        group={activeFilterGroup}
        setFilters={setFilters}
        setOpen={setOpenFiltersModal}
      />

      <div className="data-table__card">
        <DataTableTable
          rows={finalRows}
          visibleDefs={visibleDefs}
          sorts={sorts}
          handleSortClick={handleSortClick}
          setOpenColumn={setOpenColumn}
          setCardPosition={setCardPosition}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          totals={totals}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={false}
          tableMode={tableMode}
        />
      </div>

      {openColumn ? (
        <FilterCard
          title={openColumn.header}
          values={columnValues[String(openColumn.key)] || []}
          selected={filters[String(openColumn.key)] || []}
          openAt={cardPosition}
          onApply={(vals) =>
            setFilters((prev: Record<string, string[]>) => ({
              ...prev,
              [String(openColumn.key)]: vals
            }))
          }
          onClear={() =>
            setFilters((prev: Record<string, string[]>) => {
              const copy = { ...prev };

              delete copy[String(openColumn.key)];

              return copy;
            })
          }
          onClose={() => setOpenColumn(null)}
        />
      ) : null}

      {!disableColumnConfig ? (
        <ColumnsModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          columns={columns.map((column) => ({
            key: String(column.key),
            header: column.header
          }))}
          columnOrder={columnOrder}
          visibleColumns={visibleColumns}
          sorts={sorts}
          uniqueColumns={uniqueColumns}
          onToggleColumn={(key) => {
            setVisibleColumns((prev) =>
              prev.includes(key)
                ? prev.filter((item) => item !== key)
                : [...prev, key]
            );
          }}
          onSelectAll={() => setVisibleColumns(columnKeys)}
          onClearAll={() => setVisibleColumns([])}
          onReset={() => {
            setVisibleColumns(columnKeys);
            setColumnOrder(columnKeys);
            setSorts([]);
            setUniqueColumns([]);
          }}
          onChangeSorts={(next) => {
            setSorts(next);
          }}
          onChangeUniqueColumns={(cols) => {
            setUniqueColumns(cols);
          }}
          onClearSorts={() => setSorts([])}
          onReorderColumns={(next) => {
            setColumnOrder(next);
          }}
        />
      ) : null}

      {error ? <div className="data-table-error">{error}</div> : null}
    </div>
  );
}