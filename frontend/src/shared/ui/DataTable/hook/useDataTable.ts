// ======================================================
// PATH: src/shared/ui/DataTable/hook/useDataTable.ts
// Estado y procesamiento reutilizable del DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Administrar búsqueda global, filtros y ordenamientos.
 * - Procesar filas sin modificar los datos originales.
 * - Persistir temporalmente la configuración por ruta y columnas.
 * - Calcular valores disponibles para filtros y totales.
 *
 * No debe:
 * - Renderizar componentes visuales.
 * - Consultar APIs.
 * - Conocer reglas específicas de módulos.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  Dispatch,
  MouseEvent,
  SetStateAction
} from "react";

import { useLocation } from "react-router-dom";

/**
 * Dirección permitida para un ordenamiento.
 */
export type SortDirection = "asc" | "desc";

/**
 * Configuración de un ordenamiento activo.
 */
export type SortItem = {
  key: string;
  dir: SortDirection;
};

/**
 * Definición mínima necesaria para procesar una columna.
 */
export type DataTableProcessColumn<T> = {
  key: keyof T | string;
  disableSort?: boolean;
  isTotal?: boolean;
};

/**
 * Estado interno persistido del DataTable.
 */
type DataTableState = {
  search: string;
  filters: Record<string, string[]>;
  sorts: SortItem[];
};

/**
 * Valor inicial seguro del estado.
 */
const INITIAL_STATE: DataTableState = {
  search: "",
  filters: {},
  sorts: []
};

/**
 * Normaliza texto para búsquedas tolerantes a acentos y espacios.
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
 * Convierte un valor en una representación comparable.
 */
function toComparable(value: unknown): string | number {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const numericValue = Number(cleaned);

    if (cleaned !== "" && Number.isFinite(numericValue)) {
      return numericValue;
    }

    return normalizeText(cleaned);
  }

  return normalizeText(value);
}

/**
 * Obtiene el valor de una columna usando una clave dinámica.
 */
function getCellValue<T extends Record<string, unknown>>(
  row: T,
  key: string
): unknown {
  return row[key];
}

/**
 * Convierte valores vacíos en una etiqueta filtrable consistente.
 */
function getFilterValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "(Vacío)";
  }

  return String(value);
}

/**
 * Construye el texto completo utilizado por la búsqueda global.
 */
function getRowSearchText<T extends Record<string, unknown>>(
  row: T,
  columns: DataTableProcessColumn<T>[]
): string {
  return columns
    .map((column) => {
      const value = getCellValue(row, String(column.key));

      if (value === null || value === undefined) {
        return "";
      }

      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === "boolean") {
        return value ? "true si sí" : "false no";
      }

      return String(value);
    })
    .join(" ");
}

/**
 * Recupera un estado previamente almacenado.
 */
function readStoredState(storageKey: string): DataTableState {
  try {
    const raw = sessionStorage.getItem(storageKey);

    if (!raw) {
      return INITIAL_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<DataTableState>;

    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      filters:
        parsed.filters && typeof parsed.filters === "object"
          ? parsed.filters
          : {},
      sorts: Array.isArray(parsed.sorts) ? parsed.sorts : []
    };
  } catch {
    sessionStorage.removeItem(storageKey);

    return INITIAL_STATE;
  }
}

/**
 * Hook reutilizable para búsqueda, filtros y ordenamiento.
 */
export function useDataTable<T extends Record<string, unknown>>(
  sourceRows: T[] | undefined,
  columns: DataTableProcessColumn<T>[] | undefined
) {
  const { pathname } = useLocation();

  const safeRows = useMemo(
    () => (Array.isArray(sourceRows) ? sourceRows : []),
    [sourceRows]
  );

  const safeColumns = useMemo(
    () => (Array.isArray(columns) ? columns : []),
    [columns]
  );

  const columnsSignature = useMemo(
    () => safeColumns.map((column) => String(column.key)).join("|"),
    [safeColumns]
  );

  const storageKey = `datatable:${pathname}:${columnsSignature || "default"}`;

  const [state, setState] = useState<DataTableState>(() =>
    readStoredState(storageKey)
  );

  const { search, filters, sorts } = state;

  /**
   * Actualiza únicamente el texto de búsqueda.
   */
  const setSearch = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      search: value
    }));
  }, []);

  /**
   * Actualiza filtros aceptando valor directo o función.
   */
  const setFilters: Dispatch<
    SetStateAction<Record<string, string[]>>
  > = useCallback((value) => {
    setState((current) => ({
      ...current,
      filters:
        typeof value === "function"
          ? value(current.filters)
          : value
    }));
  }, []);

  /**
   * Actualiza ordenamientos aceptando valor directo o función.
   */
  const setSorts: Dispatch<SetStateAction<SortItem[]>> = useCallback(
    (value) => {
      setState((current) => ({
        ...current,
        sorts:
          typeof value === "function"
            ? value(current.sorts)
            : value
      }));
    },
    []
  );

  /**
   * Elimina configuraciones pertenecientes a columnas inexistentes.
   */
  useEffect(() => {
    setState((current) => {
      const validColumnKeys = new Set(
        safeColumns.map((column) => String(column.key))
      );

      const nextFilters = Object.fromEntries(
        Object.entries(current.filters).filter(([key]) =>
          validColumnKeys.has(key)
        )
      );

      const nextSorts = current.sorts.filter((sort) =>
        validColumnKeys.has(sort.key)
      );

      return {
        search: current.search,
        filters: nextFilters,
        sorts: nextSorts
      };
    });
  }, [columnsSignature, safeColumns]);

  /**
   * Recupera el estado correspondiente cuando cambia la tabla.
   */
  useEffect(() => {
    setState(readStoredState(storageKey));
  }, [storageKey]);

  /**
   * Persiste temporalmente búsqueda, filtros y ordenamientos.
   */
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  const searchedRows = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return safeRows;
    }

    return safeRows.filter((row) => {
      const rowText = normalizeText(
        getRowSearchText(row, safeColumns)
      );

      return rowText.includes(normalizedSearch);
    });
  }, [safeRows, safeColumns, search]);

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(
      ([, values]) => Array.isArray(values) && values.length > 0
    );

    if (activeFilters.length === 0) {
      return searchedRows;
    }

    return searchedRows.filter((row) =>
      activeFilters.every(([key, values]) => {
        const value = getFilterValue(getCellValue(row, key));

        return values.includes(value);
      })
    );
  }, [searchedRows, filters]);

  const columnMap = useMemo(() => {
    return new Map(
      safeColumns.map((column) => [
        String(column.key),
        column
      ])
    );
  }, [safeColumns]);

  const orderedRows = useMemo(() => {
    if (sorts.length === 0) {
      return filteredRows;
    }

    const indexedRows = filteredRows.map((row, index) => ({
      row,
      index
    }));

    indexedRows.sort((first, second) => {
      for (const sort of sorts) {
        const column = columnMap.get(sort.key);

        if (!column || column.disableSort) {
          continue;
        }

        const firstValue = toComparable(
          getCellValue(first.row, sort.key)
        );

        const secondValue = toComparable(
          getCellValue(second.row, sort.key)
        );

        if (firstValue < secondValue) {
          return sort.dir === "asc" ? -1 : 1;
        }

        if (firstValue > secondValue) {
          return sort.dir === "asc" ? 1 : -1;
        }
      }

      return first.index - second.index;
    });

    return indexedRows.map(({ row }) => row);
  }, [filteredRows, sorts, columnMap]);

  const columnValues = useMemo(() => {
    const result: Record<string, string[]> = {};

    safeColumns.forEach((column) => {
      const columnKey = String(column.key);

      const rowsAvailableForColumn = searchedRows.filter((row) =>
        Object.entries(filters).every(([filterKey, values]) => {
          if (filterKey === columnKey || values.length === 0) {
            return true;
          }

          const value = getFilterValue(
            getCellValue(row, filterKey)
          );

          return values.includes(value);
        })
      );

      result[columnKey] = Array.from(
        new Set(
          rowsAvailableForColumn.map((row) =>
            getFilterValue(getCellValue(row, columnKey))
          )
        )
      ).sort((first, second) =>
        first.localeCompare(second, "es", {
          numeric: true,
          sensitivity: "base"
        })
      );
    });

    return result;
  }, [safeColumns, searchedRows, filters]);

  const totals = useMemo(() => {
    const result: Record<string, number> = {};

    safeColumns.forEach((column) => {
      if (!column.isTotal) {
        return;
      }

      const columnKey = String(column.key);

      result[columnKey] = orderedRows.reduce((total, row) => {
        const value = Number(getCellValue(row, columnKey));

        return total + (Number.isFinite(value) ? value : 0);
      }, 0);
    });

    return result;
  }, [orderedRows, safeColumns]);

  /**
   * Controla orden simple y orden múltiple con Ctrl o Command.
   *
   * Orden simple:
   * ascendente → descendente → sin orden.
   *
   * Orden múltiple:
   * Ctrl/Command mantiene los demás ordenamientos.
   */
  const handleSortClick = useCallback(
    (key: string, event: MouseEvent) => {
      setSorts((currentSorts) => {
        const existing = currentSorts.find(
          (sort) => sort.key === key
        );

        if (event.ctrlKey || event.metaKey) {
          if (!existing) {
            return [...currentSorts, { key, dir: "asc" }];
          }

          return currentSorts.map((sort) =>
            sort.key === key
              ? {
                  ...sort,
                  dir: sort.dir === "asc" ? "desc" : "asc"
                }
              : sort
          );
        }

        if (!existing) {
          return [{ key, dir: "asc" }];
        }

        if (existing.dir === "asc") {
          return [{ key, dir: "desc" }];
        }

        return [];
      });
    },
    [setSorts]
  );

  return {
    search,
    setSearch,
    filters,
    setFilters,
    sorts,
    setSorts,
    handleSortClick,
    orderedRows,
    columnValues,
    totals
  };
}