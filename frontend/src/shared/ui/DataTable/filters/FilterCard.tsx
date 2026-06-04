// ======================================================
// PATH: src/shared/ui/DataTable/filters/FilterCard.tsx
// Tarjeta flotante para filtros por columna
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar valores disponibles para una columna.
 * - Permitir buscar, seleccionar y limpiar valores.
 * - Mantenerse dentro de los límites visibles de la ventana.
 * - Permitir mover la tarjeta mediante arrastre.
 *
 * No debe:
 * - Procesar filas del DataTable.
 * - Persistir filtros.
 * - Consultar APIs.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import type { MouseEvent as ReactMouseEvent } from "react";

type FilterCardProps = {
  title: string;
  values?: string[];
  selected: string[];
  onApply: (values: string[]) => void;
  onClear: () => void;
  onClose: () => void;
  openAt: {
    x: number;
    y: number;
  };
};

/**
 * Mantiene una coordenada dentro de límites permitidos.
 */
function clamp(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.max(minimum, Math.min(value, maximum));
}

/**
 * Tarjeta flotante reutilizable para filtros.
 */
export default function FilterCard({
  title,
  values = [],
  selected,
  onApply,
  onClear,
  onClose,
  openAt
}: FilterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [localValues, setLocalValues] = useState<string[]>(
    selected ?? []
  );

  const [search, setSearch] = useState("");

  const [position, setPosition] = useState({
    x: openAt.x,
    y: openAt.y
  });

  const safeValues = useMemo(
    () => (Array.isArray(values) ? values : []),
    [values]
  );

  useEffect(() => {
    setLocalValues(selected ?? []);
  }, [selected]);

  useEffect(() => {
    setSearch("");
    setPosition({
      x: openAt.x,
      y: openAt.y
    });
  }, [openAt]);

  /**
   * Reposiciona la tarjeta para que permanezca visible.
   */
  useEffect(() => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const padding = 8;
    const rect = card.getBoundingClientRect();

    const nextPosition = {
      x: clamp(
        position.x,
        padding,
        window.innerWidth - rect.width - padding
      ),
      y: clamp(
        position.y,
        padding,
        window.innerHeight - rect.height - padding
      )
    };

    if (
      nextPosition.x !== position.x ||
      nextPosition.y !== position.y
    ) {
      setPosition(nextPosition);
    }
  }, [position]);

  /**
   * Cierra la tarjeta al hacer click fuera.
   */
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        cardRef.current &&
        !cardRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [onClose]);

  /**
   * Controla el movimiento de la tarjeta.
   */
  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const card = cardRef.current;

      if (!draggingRef.current || !card) {
        return;
      }

      const padding = 6;
      const rect = card.getBoundingClientRect();

      setPosition({
        x: clamp(
          event.clientX - dragOffsetRef.current.x,
          padding,
          window.innerWidth - rect.width - padding
        ),
        y: clamp(
          event.clientY - dragOffsetRef.current.y,
          padding,
          window.innerHeight - rect.height - padding
        )
      });
    }

    function handleMouseUp() {
      draggingRef.current = false;
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const filteredValues = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return safeValues;
    }

    return safeValues.filter((value) =>
      value.toLowerCase().includes(normalizedSearch)
    );
  }, [safeValues, search]);

  const allSelected =
    safeValues.length > 0 &&
    safeValues.every((value) => localValues.includes(value));

  /**
   * Inicia el arrastre desde el encabezado.
   */
  function handleDragStart(event: ReactMouseEvent) {
    draggingRef.current = true;

    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y
    };
  }

  /**
   * Alterna un valor y aplica el filtro inmediatamente.
   */
  function toggleValue(value: string) {
    const nextValues = localValues.includes(value)
      ? localValues.filter((current) => current !== value)
      : [...localValues, value];

    setLocalValues(nextValues);
    queueMicrotask(() => onApply(nextValues));
  }

  /**
   * Selecciona todos los valores o limpia la columna.
   */
  function toggleAllValues() {
    if (allSelected) {
      setLocalValues([]);
      queueMicrotask(onClear);
    } else {
      setLocalValues(safeValues);
      queueMicrotask(() => onApply(safeValues));
    }

    onClose();
  }

  return (
    <div
      ref={cardRef}
      className="data-table-filter-card"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      <div
        className="data-table-filter-card__header"
        onMouseDown={handleDragStart}
      >
        <h4 className="data-table-filter-card__title">
          {title.trim() || "Filtro"}
        </h4>

        <button
          type="button"
          className="data-table-link-button"
          onClick={onClose}
          aria-label="Cerrar filtro"
        >
          ✕
        </button>
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar..."
        className="data-table-filter-card__input"
      />

      <div className="data-table-filter-card__list">
        {filteredValues.length === 0 ? (
          <div className="data-table-modal__empty">
            Sin coincidencias
          </div>
        ) : null}

        {filteredValues.map((value) => (
          <label
            key={value}
            className={[
              "data-table-filter-card__option",
              localValues.includes(value)
                ? "data-table-filter-card__option--active"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="checkbox"
              checked={localValues.includes(value)}
              onChange={() => toggleValue(value)}
              className="data-table-filter-card__checkbox"
            />

            <span className="data-table-filter-card__option-text">
              {value}
            </span>
          </label>
        ))}
      </div>

      <div className="data-table-filter-card__footer">
        <button
          type="button"
          className="data-table-link-button"
          onClick={toggleAllValues}
        >
          {allSelected ? "Limpiar" : "Mostrar todos"}
        </button>
      </div>
    </div>
  );
}