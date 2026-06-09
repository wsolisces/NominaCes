// ======================================================
// PATH: src/shared/ui/DataTable/modals/ModalChips.tsx
// Modal de valores activos de un filtro
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar los valores seleccionados de un filtro.
 * - Permitir eliminar valores individuales.
 * - Permitir limpiar completamente una columna.
 *
 * No debe:
 * - Calcular valores disponibles.
 * - Modificar ordenamientos o columnas.
 * - Consultar APIs.
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  Dispatch,
  SetStateAction
} from "react";

type FilterGroup = {
  key: string;
  label: string;
  values: string[];
  count: number;
};

type ModalChipsProps = {
  open: boolean;
  group: FilterGroup | null;
  setFilters: Dispatch<
    SetStateAction<Record<string, string[]>>
  >;
  setOpen: (open: boolean) => void;
};

type ChipItemProps = {
  value: string;
  onRemove: (value: string) => void;
};

/**
 * Valor activo individual memoizado.
 */
const ChipItem = memo(function ChipItem({
  value,
  onRemove
}: ChipItemProps) {
  return (
    <div className="data-table-chip-item">
      <span className="data-table-chip-item__text">
        {value}
      </span>

      <button
        type="button"
        className="data-table-chip-item__remove"
        onClick={() => onRemove(value)}
        aria-label={`Eliminar filtro ${value}`}
        title="Eliminar valor"
      >
        ✕
      </button>
    </div>
  );
});

/**
 * Modal para administrar valores seleccionados.
 */
export default function ModalChips({
  open,
  group,
  setFilters,
  setOpen
}: ModalChipsProps) {
  const [search, setSearch] = useState("");
  const [valueSet, setValueSet] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setValueSet(new Set(group?.values ?? []));
  }, [group]);

  const values = useMemo(
    () => Array.from(valueSet),
    [valueSet]
  );

  const visibleValues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filteredValues =
      normalizedSearch.length < 2
        ? values
        : values.filter((value) =>
            value.toLowerCase().includes(normalizedSearch)
          );

    return filteredValues.slice(0, 200);
  }, [search, values]);

  const hasSearch = search.trim().length > 0;

  /**
   * Elimina un valor del filtro activo.
   */
  const removeValue = useCallback(
    (value: string) => {
      if (!group) {
        return;
      }

      const groupKey = group.key;

      setValueSet((current) => {
        const next = new Set(current);
        next.delete(value);

        return next;
      });

      setFilters((current) => {
        const next = { ...current };

        next[groupKey] = (next[groupKey] ?? []).filter(
          (currentValue) => currentValue !== value
        );

        if (next[groupKey].length === 0) {
          delete next[groupKey];
        }

        return next;
      });
    },
    [group, setFilters]
  );

  /**
   * Cierra y limpia el estado temporal del modal.
   */
  function closeModal() {
    setOpen(false);
    setSearch("");
    setValueSet(new Set());
  }

  /**
   * Elimina por completo el filtro de la columna.
   */
  function clearColumn() {
    if (!group) {
      return;
    }

    setFilters((current) => {
      const next = { ...current };
      delete next[group.key];

      return next;
    });

    closeModal();
  }

  if (!open || !group) {
    return null;
  }

  return (
    <div
      className="data-table-modal-backdrop"
      onClick={closeModal}
    >
      <div
        className="data-table-modal data-table-modal--chips"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="data-table-modal__header data-table-modal__header--chips">
          <div className="data-table-modal__heading">
           
            <h2 className="data-table-modal__title">
              {group.label}
            </h2>

            <p className="data-table-modal__subtitle">
              Administra los valores aplicados a esta columna.
            </p>
          </div>

          <button
            type="button"
            className="data-table-modal__close"
            onClick={closeModal}
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        

        <div className="data-table-modal__body data-table-modal__body--chips">
          <div className="data-table-chip-search">
            <span className="data-table-chip-search__icon">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar valor seleccionado..."
              className="data-table-chip-search__input"
            />

            {hasSearch ? (
              <button
                type="button"
                className="data-table-chip-search__clear"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            ) : null}
          </div>

          <div className="data-table-chip-list">
            {visibleValues.length === 0 ? (
              <div className="data-table-chips-empty">
                <strong>Sin resultados</strong>

                <span>
                  No se encontraron valores con la búsqueda actual.
                </span>
              </div>
            ) : null}

            {visibleValues.map((value) => (
              <ChipItem
                key={value}
                value={value}
                onRemove={removeValue}
              />
            ))}
          </div>
        </div>

        <footer className="data-table-modal__footer data-table-modal__footer--chips">
         

          <button
            type="button"
            className="data-table-button data-table-button--danger data-table-button--soft-danger"
            onClick={clearColumn}
          >
            Limpiar columna
          </button>
        </footer>
      </div>
    </div>
  );
}