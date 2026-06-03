// ======================================================
// PATH: src/shared/ui/Table/Table.tsx
// Tabla reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Componer la tabla reusable con encabezado, barra de controles, cuerpo y paginación.
 * - Permitir activar o desactivar búsqueda, columnas configurables, exportación, paginación y totales.
 * - Mantener una API simple para que cada módulo use solo lo necesario.
 *
 * No debe:
 * - Hacer peticiones HTTP.
 * - Contener reglas de negocio de Usuarios, Roles, Head Count, Catálogos o Plantilla.
 * - Modificar los datos originales recibidos por props.
 */

import { useState } from "react";

import { TableBody } from "./components/TableBody";
import { TableFiltersBar } from "./components/TableFiltersBar";
import { TableHeader } from "./components/TableHeader";
import { TablePagination } from "./components/TablePagination";
import { useTable } from "./hook/useTable";
import { TableChipsModal } from "./modals/TableChipsModal";
import { TableColumnsModal } from "./modals/TableColumnsModal";

import type { TableProps } from "./Table.types";

import "./Table.css";

/**
 * Tabla base reutilizable.
 */
export function Table<T extends Record<string, unknown>>({
  tableId,
  columns,
  rows,

  title,
  subtitle,
  actions,

  loading = false,
  error = null,
  emptyMessage = "Sin registros para mostrar.",

  searchable = true,
  configurableColumns = true,
  exportable = false,
  paginated = true,
  showPageSize = true,
  showCount = true,
  showTotals = false,
  showFilterChips = false,

  variant = "elegant",
  density = "normal",
  compact = false,
  maxHeight,
  minWidth = "850px",

  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],

  filterChips = [],
  onClearFilterChip,
  onClearAllFilterChips,

  onRowClick
}: TableProps<T>) {
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const [chipsModalOpen, setChipsModalOpen] = useState(false);

  const safeDensity = compact ? "compact" : density;

  const table = useTable<T>({
    tableId,
    columns,
    rows,
    defaultPageSize,
    pageSizeOptions,
    paginated
  });

  return (
    <section
      className={[
        "ni-table",
        `ni-table--${variant}`,
        `ni-table--${safeDensity}`
      ].join(" ")}
    >
      <TableHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
      />

      <TableFiltersBar
        search={table.search}
        onSearchChange={table.setSearch}
        searchable={searchable}
        configurableColumns={configurableColumns}
        exportable={exportable}
        paginated={paginated}
        showPageSize={showPageSize}
        showCount={showCount}
        showFilterChips={showFilterChips}
        loading={loading}
        totalRows={table.totalRows}
        pageSize={table.pageSize}
        pageSizeOptions={pageSizeOptions}
        filterChips={filterChips}
        onPageSizeChange={table.setPageSize}
        onOpenColumns={() => setColumnsModalOpen(true)}
        onOpenChips={() => setChipsModalOpen(true)}
        onExportCsv={table.exportCsv}
      />

      {error && (
        <div className="ni-table__error">
          {error}
        </div>
      )}

      <TableBody
        columns={table.visibleColumns}
        rows={table.paginatedRows}
        sort={table.sort}
        totals={table.totals}
        emptyMessage={loading ? "Cargando información..." : emptyMessage}
        showTotals={showTotals}
        startIndex={table.startIndex}
        minWidth={minWidth}
        maxHeight={maxHeight}
        onSort={table.handleSort}
        onRowClick={onRowClick}
      />

      <TablePagination
        paginated={paginated}
        totalRows={table.totalRows}
        startIndex={table.startIndex}
        endIndex={table.endIndex}
        safePage={table.safePage}
        totalPages={table.totalPages}
        onPageChange={table.setCurrentPage}
      />

      <TableColumnsModal
        open={columnsModalOpen}
        columns={columns}
        visibleKeys={table.visibleKeys}
        onToggleColumn={table.toggleColumn}
        onResetColumns={table.resetColumns}
        onClose={() => setColumnsModalOpen(false)}
      />

      <TableChipsModal
        open={chipsModalOpen}
        chips={filterChips}
        onClearChip={onClearFilterChip}
        onClearAll={onClearAllFilterChips}
        onClose={() => setChipsModalOpen(false)}
      />
    </section>
  );
}