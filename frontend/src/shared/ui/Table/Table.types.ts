// ======================================================
// PATH: src/shared/ui/Table/Table.types.ts
// Tipos públicos de la tabla reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar los contratos TypeScript de la tabla reutilizable.
 * - Permitir que cada módulo active solo las funciones que necesita.
 * - Mantener una API clara para Usuarios, Roles, Catálogos, Head Count y Plantilla.
 *
 * No debe:
 * - Contener lógica de renderizado.
 * - Contener estilos.
 * - Contener reglas de negocio específicas de un módulo.
 */

import type { ReactNode } from "react";

export type TableAlign = "left" | "center" | "right";

export type TableDensity = "comfortable" | "normal" | "compact";

export type TableVariant = "default" | "elegant" | "simple";

export type TableSortDirection = "asc" | "desc";

export type TableSort = {
  key: string;
  direction: TableSortDirection;
};

export type TableColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  title: string;
  width?: string;
  align?: TableAlign;

  /**
   * Si se define en false, la columna no participa en ordenamiento.
   */
  sortable?: boolean;

  /**
   * Si se define en false, la columna no participa en búsqueda global.
   */
  searchable?: boolean;

  /**
   * Si se define en true, la columna inicia oculta.
   */
  hidden?: boolean;

  /**
   * Si se define en true, se suma en el footer cuando showTotals está activo.
   */
  isTotal?: boolean;

  /**
   * Permite pintar contenido personalizado por celda.
   */
  render?: (row: T, rowIndex: number) => ReactNode;
};

export type TableFilterChip = {
  key: string;
  label: string;
  value: string;
};

export type TableRowAction<T extends Record<string, unknown>> = {
  key: string;
  label: string;
  onClick: (row: T, rowIndex: number) => void;
  disabled?: (row: T) => boolean;
};

export type TableProps<T extends Record<string, unknown>> = {
  tableId: string;
  columns: TableColumn<T>[];
  rows: T[];

  title?: string;
  subtitle?: string;
  actions?: ReactNode;

  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;

  /**
   * Funciones opcionales.
   * Cada pantalla decide cuáles usar.
   */
  searchable?: boolean;
  configurableColumns?: boolean;
  exportable?: boolean;
  paginated?: boolean;
  showPageSize?: boolean;
  showCount?: boolean;
  showTotals?: boolean;
  showFilterChips?: boolean;

  /**
   * Apariencia.
   */
  variant?: TableVariant;
  density?: TableDensity;
  compact?: boolean;
  maxHeight?: string;
  minWidth?: string;

  /**
   * Paginación.
   */
  defaultPageSize?: number;
  pageSizeOptions?: number[];

  /**
   * Filtros activos externos.
   * La tabla no calcula filtros de negocio; solo muestra chips.
   */
  filterChips?: TableFilterChip[];
  onClearFilterChip?: (chip: TableFilterChip) => void;
  onClearAllFilterChips?: () => void;

  /**
   * Eventos.
   */
  onRowClick?: (row: T, rowIndex: number) => void;
};

export type UseTableParams<T extends Record<string, unknown>> = {
  tableId: string;
  columns: TableColumn<T>[];
  rows: T[];
  defaultPageSize: number;
  pageSizeOptions: number[];
  paginated: boolean;
};

export type UseTableResult<T extends Record<string, unknown>> = {
  search: string;
  setSearch: (value: string) => void;

  sort: TableSort | null;
  setSort: (value: TableSort | null) => void;

  pageSize: number;
  setPageSize: (value: number) => void;

  currentPage: number;
  setCurrentPage: (value: number | ((current: number) => number)) => void;

  visibleKeys: string[];
  setVisibleKeys: (value: string[] | ((current: string[]) => string[])) => void;

  visibleColumns: TableColumn<T>[];
  searchedRows: T[];
  sortedRows: T[];
  paginatedRows: T[];

  totalRows: number;
  totalPages: number;
  safePage: number;
  startIndex: number;
  endIndex: number;

  totals: Record<string, number>;

  handleSort: (column: TableColumn<T>) => void;
  toggleColumn: (key: string) => void;
  resetColumns: () => void;
  exportCsv: () => void;
};