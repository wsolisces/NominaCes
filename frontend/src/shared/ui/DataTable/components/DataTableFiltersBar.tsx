// ======================================================
// PATH: src/shared/ui/DataTable/components/DataTableFiltersBar.tsx
// Barra de filtros activos del DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar filtros aplicados como chips.
 * - Abrir el modal de valores activos por filtro.
 * - Permitir limpiar todos los filtros.
 *
 * No debe:
 * - Calcular filtros.
 * - Consultar APIs.
 * - Modificar columnas u ordenamientos.
 */

import type { Dispatch, SetStateAction } from "react";

type FilterGroup = {
  key: string;
  label: string;
  values: string[];
  count: number;
};

type Props = {
  hasFilters: boolean;
  filterGroups: FilterGroup[];
  setFilters: Dispatch<SetStateAction<Record<string, string[]>>>;
  setActiveFilterGroup: (group: FilterGroup) => void;
  setOpenFiltersModal: (open: boolean) => void;
};

/**
 * Renderiza los filtros activos del DataTable.
 */
export default function DataTableFilters({
  hasFilters,
  filterGroups,
  setFilters,
  setActiveFilterGroup,
  setOpenFiltersModal
}: Props) {
  if (!hasFilters) {
    return null;
  }

  return (
    <div
      className="data-table-filters-bar"
      aria-label="Filtros activos"
    >
      <div className="data-table-filters-bar__list">
        {filterGroups.map((group) => (
          <button
            key={group.key}
            type="button"
            onClick={() => {
              setActiveFilterGroup(group);
              setOpenFiltersModal(true);
            }}
            className="data-table-filter-chip"
            title={`Ver filtro ${group.label}`}
          >
            <span className="data-table-filter-chip__label">
              {group.label}
            </span>

            <span className="data-table-filter-chip__count">
              {group.count}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setFilters({})}
        className="data-table-filters-bar__clear"
      >
        Limpiar
      </button>
    </div>
  );
}