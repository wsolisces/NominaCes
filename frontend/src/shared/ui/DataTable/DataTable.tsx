// ======================================================
// PATH: src/shared/ui/DataTable/DataTable.tsx
// DataTable reutilizable enterprise
// ======================================================

/**
 * Responsabilidades:
 * - Orquestar búsqueda, filtros, ordenamiento, columnas y paginación.
 * - Mantener persistencia de columnas y registros por página.
 * - Exponer callbacks para integrar datos filtrados con páginas externas.
 * - Mantener header, filtros, tabla y paginación dentro de un mismo card visual.
 * - Servir como única base visual para todas las tablas del sistema.
 *
 * No debe:
 * - Consultar APIs.
 * - Conocer reglas de negocio de módulos.
 * - Definir estilos repetidos en línea.
 * - Depender de clases específicas de módulos.
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
 * scroll:
 * - Permite scroll horizontal.
 * - Recomendado para catálogos administrativos con muchas columnas.
 *
 * fit:
 * - Adapta columnas al ancho disponible.
 * - Recomendado para tablas simples o de pocas columnas.
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
 * Opciones oficiales permitidas para registros por página.
 */
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * Convierte un valor persistido en arreglo de strings seguro.
 */
function safeStringArray(
  raw: string | null,
  fallback: string[]
): string[] {
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
function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

/**
 * Normaliza el tamaño de página permitido.
 *
 * Regla visual:
 * - El DataTable inicia en 10 registros.
 * - Opciones permitidas: 5, 10, 20 y 50.
 */
function getSafePageSize(raw: string | number | null): number {
  const parsed = raw === null ? 10 : Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10;
  }

  if (!PAGE_SIZE_OPTIONS.includes(parsed)) {
    return 10;
  }

  return parsed;
}

/**
 * Normaliza columnas visibles u ordenadas contra las columnas actuales.
 */
function normalizeColumnKeys(
  currentKeys: string[],
  validKeys: string[]
): string[] {
  const validCurrentKeys = currentKeys.filter((key) =>
    validKeys.includes(key)
  );

  const missingKeys = validKeys.filter(
    (key) => !validCurrentKeys.includes(key)
  );

  return [...validCurrentKeys, ...missingKeys];
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

  const [pageSize, setPageSize] = useState<number>(() =>
    getSafePageSize(localStorage.getItem(pageSizeKey))
  );

  const [uniqueColumns, setUniqueColumns] = useState<string[]>([]);
  const [openColumn, setOpenColumn] = useState<ColumnDef<T> | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [openColumnModal, setOpenColumnModal] = useState(false);
  const [openFiltersModal, setOpenFiltersModal] = useState(false);

  const [activeFilterGroup, setActiveFilterGroup] = useState<{
    key: string;
    label: string;
    values: string[];
    count: number;
  } | null>(null);

  const onDataChangeRef = useRef(onDataChange);
  const lastEmitSignatureRef = useRef("");

  /**
   * Mantiene columnas visibles y ordenadas sincronizadas con las columnas reales.
   */
  useEffect(() => {
    if (forceColumnOrder) {
      setVisibleColumns(columnKeys);
      setColumnOrder(columnKeys);
      return;
    }

    setVisibleColumns((previousColumns) => {
      const nextColumns = normalizeColumnKeys(
        previousColumns,
        columnKeys
      );

      return sameStringArray(previousColumns, nextColumns)
        ? previousColumns
        : nextColumns;
    });

    setColumnOrder((previousOrder) => {
      const nextOrder = normalizeColumnKeys(previousOrder, columnKeys);

      return sameStringArray(previousOrder, nextOrder)
        ? previousOrder
        : nextOrder;
    });
  }, [columnKeys, forceColumnOrder]);

  /**
   * Persiste columnas visibles cuando el orden no está forzado.
   */
  useEffect(() => {
    if (forceColumnOrder) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
  }, [storageKey, visibleColumns, forceColumnOrder]);

  /**
   * Persiste orden de columnas cuando el orden no está forzado.
   */
  useEffect(() => {
    if (forceColumnOrder) {
      return;
    }

    localStorage.setItem(orderKey, JSON.stringify(columnOrder));
  }, [orderKey, columnOrder, forceColumnOrder]);

  /**
   * Persiste registros por página.
   */
  useEffect(() => {
    localStorage.setItem(pageSizeKey, String(pageSize));
  }, [pageSizeKey, pageSize]);

  /**
   * Mantiene columnas únicas válidas.
   */
  useEffect(() => {
    setUniqueColumns((previousColumns) =>
      previousColumns.filter((key) => columnKeys.includes(key))
    );
  }, [columnKeys]);

  /**
   * Actualiza referencia del callback externo sin forzar efectos innecesarios.
   */
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  /**
   * Cambia registros por página usando opciones permitidas.
   */
  function handlePageSizeChange(next: number): void {
    const safeNext = getSafePageSize(next);

    setPageSize(safeNext);
  }

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

    const seenRows = new Set<string>();

    return orderedRows.filter((row) => {
      const uniqueKey = uniqueColumns
        .map((columnKey) => {
          const value = row[columnKey];

          if (value === null || value === undefined) {
            return "";
          }

          return String(value).trim();
        })
        .join("|");

      if (seenRows.has(uniqueKey)) {
        return false;
      }

      seenRows.add(uniqueKey);

      return true;
    });
  }, [orderedRows, uniqueColumns]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    visibleDefs.forEach((column) => {
      if (!column.isTotal) {
        return;
      }

      const key = String(column.key);

      result[key] = finalRows.reduce((accumulator, row) => {
        const value = Number(row[key]);

        return accumulator + (Number.isNaN(value) ? 0 : value);
      }, 0);
    });

    return result;
  }, [finalRows, visibleDefs]);

  const hasFilters = Object.keys(filters).length > 0;

  const filterGroups = useMemo(() => {
    return Object.entries(filters)
      .map(([columnKey, values]) => {
        const column = columns.find(
          (currentColumn) => String(currentColumn.key) === columnKey
        );

        return {
          key: columnKey,
          label: column?.header || columnKey,
          values,
          count: values.length
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filters, columns]);

  /**
   * Emite el estado filtrado y ordenado hacia páginas externas.
   */
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

    return (
    <div className="data-table">
      <DataTableHeader
        search={search}
        setSearch={setSearch}
        loading={loading}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        showColumnsButton={!disableColumnConfig}
        onOpenColumns={() => setOpenColumnModal(true)}
      />

      <DataTableFilters
        hasFilters={hasFilters}
        filterGroups={filterGroups}
        setFilters={setFilters}
        setActiveFilterGroup={setActiveFilterGroup}
        setOpenFiltersModal={setOpenFiltersModal}
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

        {error ? <div className="data-table-error">{error}</div> : null}
      </div>

      <ModalChips
        open={openFiltersModal}
        group={activeFilterGroup}
        setFilters={setFilters}
        setOpen={setOpenFiltersModal}
      />

      {openColumn ? (
        <FilterCard
          title={openColumn.header}
          values={columnValues[String(openColumn.key)] || []}
          selected={filters[String(openColumn.key)] || []}
          openAt={cardPosition}
          onApply={(values) =>
            setFilters((previousFilters: Record<string, string[]>) => ({
              ...previousFilters,
              [String(openColumn.key)]: values
            }))
          }
          onClear={() =>
            setFilters((previousFilters: Record<string, string[]>) => {
              const nextFilters = { ...previousFilters };

              delete nextFilters[String(openColumn.key)];

              return nextFilters;
            })
          }
          onClose={() => setOpenColumn(null)}
        />
      ) : null}

      {!disableColumnConfig ? (
        <ColumnsModal
          open={openColumnModal}
          onClose={() => setOpenColumnModal(false)}
          columns={columns.map((column) => ({
            key: String(column.key),
            header: column.header
          }))}
          columnOrder={columnOrder}
          visibleColumns={visibleColumns}
          sorts={sorts}
          uniqueColumns={uniqueColumns}
          onToggleColumn={(key) => {
            setVisibleColumns((previousColumns) =>
              previousColumns.includes(key)
                ? previousColumns.filter((item) => item !== key)
                : [...previousColumns, key]
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
          onChangeSorts={(nextSorts) => {
            setSorts(nextSorts);
          }}
          onChangeUniqueColumns={(nextUniqueColumns) => {
            setUniqueColumns(nextUniqueColumns);
          }}
          onClearSorts={() => setSorts([])}
          onReorderColumns={(nextColumnOrder) => {
            setColumnOrder(nextColumnOrder);
          }}
        />
      ) : null}
    </div>
  );
  
}