// ======================================================
// PATH: src/shared/ui/Table/hook/useTable.ts
// Hook de estado y lógica para la tabla reutilizable
// ======================================================

/**
 * Responsabilidades:
 * - Controlar búsqueda, ordenamiento, paginación y columnas visibles.
 * - Persistir preferencias por tabla usando tableId.
 * - Exportar información visible a CSV.
 *
 * No debe:
 * - Renderizar JSX.
 * - Ejecutar peticiones HTTP.
 * - Conocer reglas de negocio de módulos específicos.
 */

import { useEffect, useMemo, useState } from "react";
import type { TableColumn, TableSort, UseTableParams, UseTableResult } from "../Table.types";

/**
 * Normaliza texto para búsquedas tolerantes a mayúsculas, espacios y acentos.
 */
function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Convierte valores a formato comparable para ordenar columnas.
 */
function toComparable(value: unknown): string | number {
  if (value === null || value === undefined) return "";

  if (typeof value === "number") return value;

  if (value instanceof Date) return value.getTime();

  const text = String(value).replace(/,/g, "").trim();
  const numericValue = Number(text);

  if (text !== "" && Number.isFinite(numericValue)) {
    return numericValue;
  }

  return normalizeText(text);
}

/**
 * Lee un arreglo de localStorage sin romper la pantalla si el dato está corrupto.
 */
function readStorageArray(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return fallback;

    return parsed.map(String);
  } catch {
    return fallback;
  }
}

/**
 * Valida que el tamaño de página esté dentro de las opciones permitidas.
 */
function getSafePageSize(
  value: number | string | null | undefined,
  fallback: number,
  options: number[]
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  if (!options.includes(parsed)) return fallback;

  return parsed;
}

/**
 * Escapa valores para exportación CSV.
 */
function escapeCsvValue(value: unknown): string {
  const text = String(value ?? "");

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * Descarga texto como archivo local.
 */
function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Hook principal de la tabla.
 */
export function useTable<T extends Record<string, unknown>>({
  tableId,
  columns,
  rows,
  defaultPageSize,
  pageSizeOptions,
  paginated
}: UseTableParams<T>): UseTableResult<T> {
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const storageColumnsKey = `table:${tableId}:visible-columns`;
  const storagePageSizeKey = `table:${tableId}:page-size`;

  const defaultVisibleKeys = useMemo(() => {
    return safeColumns
      .filter((column) => !column.hidden)
      .map((column) => String(column.key));
  }, [safeColumns]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<TableSort | null>(null);

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() =>
    readStorageArray(storageColumnsKey, defaultVisibleKeys)
  );

  const [pageSize, setPageSize] = useState<number>(() =>
    getSafePageSize(
      localStorage.getItem(storagePageSizeKey),
      defaultPageSize,
      pageSizeOptions
    )
  );

  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Mantiene visibles únicamente columnas existentes.
   */
  useEffect(() => {
    const availableKeys = safeColumns.map((column) => String(column.key));

    setVisibleKeys((current) => {
      const validCurrent = current.filter((key) => availableKeys.includes(key));
      const missingDefaults = defaultVisibleKeys.filter(
        (key) => !validCurrent.includes(key)
      );

      return [...validCurrent, ...missingDefaults];
    });
  }, [safeColumns, defaultVisibleKeys]);

  /**
   * Persiste columnas visibles por tableId.
   */
  useEffect(() => {
    localStorage.setItem(storageColumnsKey, JSON.stringify(visibleKeys));
  }, [storageColumnsKey, visibleKeys]);

  /**
   * Persiste tamaño de página por tableId.
   */
  useEffect(() => {
    localStorage.setItem(storagePageSizeKey, String(pageSize));
  }, [storagePageSizeKey, pageSize]);

  /**
   * Reinicia la paginación al cambiar búsqueda, tamaño o datos.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, rows]);

  const visibleColumns = useMemo(() => {
    return safeColumns.filter((column) =>
      visibleKeys.includes(String(column.key))
    );
  }, [safeColumns, visibleKeys]);

  const searchedRows = useMemo(() => {
    const query = normalizeText(search);

    if (!query) return safeRows;

    const searchableColumns = visibleColumns.filter(
      (column) => column.searchable !== false
    );

    return safeRows.filter((row) => {
      const text = searchableColumns
        .map((column) => String(row[String(column.key)] ?? ""))
        .join(" ");

      return normalizeText(text).includes(query);
    });
  }, [safeRows, visibleColumns, search]);

  const sortedRows = useMemo(() => {
    if (!sort) return searchedRows;

    const column = visibleColumns.find((item) => String(item.key) === sort.key);

    if (!column || column.sortable === false) {
      return searchedRows;
    }

    return [...searchedRows].sort((a, b) => {
      const left = toComparable(a[sort.key]);
      const right = toComparable(b[sort.key]);

      if (left < right) return sort.direction === "asc" ? -1 : 1;
      if (left > right) return sort.direction === "asc" ? 1 : -1;

      return 0;
    });
  }, [searchedRows, sort, visibleColumns]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = paginated ? (safePage - 1) * pageSize : 0;
  const endIndex = paginated
    ? Math.min(startIndex + pageSize, totalRows)
    : totalRows;

  const paginatedRows = useMemo(() => {
    if (!paginated) return sortedRows;

    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, paginated, startIndex, endIndex]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    visibleColumns.forEach((column) => {
      if (!column.isTotal) return;

      const key = String(column.key);

      result[key] = sortedRows.reduce((sum, row) => {
        const value = Number(row[key]);

        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
    });

    return result;
  }, [visibleColumns, sortedRows]);

  function handleSort(column: TableColumn<T>): void {
    const key = String(column.key);

    if (column.sortable === false) return;

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
  }

  function toggleColumn(key: string): void {
    setVisibleKeys((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }

      return [...current, key];
    });
  }

  function resetColumns(): void {
    setVisibleKeys(defaultVisibleKeys);
  }

  function exportCsv(): void {
    const headers = visibleColumns.map((column) => escapeCsvValue(column.title));

    const lines = sortedRows.map((row) => {
      return visibleColumns
        .map((column) => escapeCsvValue(row[String(column.key)]))
        .join(",");
    });

    const csv = [headers.join(","), ...lines].join("\n");

    downloadTextFile(`${tableId}.csv`, csv);
  }

  return {
    search,
    setSearch,
    sort,
    setSort,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    visibleKeys,
    setVisibleKeys,
    visibleColumns,
    searchedRows,
    sortedRows,
    paginatedRows,
    totalRows,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    totals,
    handleSort,
    toggleColumn,
    resetColumns,
    exportCsv
  };
}