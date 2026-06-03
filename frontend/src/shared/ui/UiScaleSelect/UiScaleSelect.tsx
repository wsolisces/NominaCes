// ======================================================
// PATH: src/shared/ui/UiScaleSelect/UiScaleSelect.tsx
// Selector reutilizable de escala visual del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Permitir cambiar el tamaño general de la interfaz.
 * - Persistir la preferencia en localStorage.
 * - Aplicar la escala mediante data-ui-scale en html.
 *
 * No debe:
 * - Cambiar estilos de un módulo específico.
 * - Guardar preferencias en backend.
 * - Modificar variables CSS directamente fuera del contrato global.
 */

import { useEffect, useState } from "react";

import "./ui-scale-select.css";

export type UiScale = "compact" | "normal" | "comfortable" | "large";

export type UiScaleSelectProps = {
  label?: string;
  compact?: boolean;
};

const STORAGE_KEY = "nominaces.ui.scale";

const SCALE_OPTIONS: Array<{
  value: UiScale;
  label: string;
}> = [
  {
    value: "compact",
    label: "Compacta"
  },
  {
    value: "normal",
    label: "Normal"
  },
  {
    value: "comfortable",
    label: "Cómoda"
  },
  {
    value: "large",
    label: "Grande"
  }
];

/**
 * Verifica que el valor guardado sea una escala válida.
 */
function isUiScale(value: string | null): value is UiScale {
  return (
    value === "compact" ||
    value === "normal" ||
    value === "comfortable" ||
    value === "large"
  );
}

/**
 * Obtiene la escala inicial del sistema.
 */
function getInitialScale(): UiScale {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return isUiScale(storedValue) ? storedValue : "normal";
  } catch {
    return "normal";
  }
}

/**
 * Aplica la escala visual en el elemento html.
 */
function applyScale(scale: UiScale): void {
  document.documentElement.dataset.uiScale = scale;
}

/**
 * Selector de escala visual reutilizable.
 */
export function UiScaleSelect({
  label = "Escala",
  compact = false
}: UiScaleSelectProps) {
  const [scale, setScale] = useState<UiScale>(getInitialScale);

  useEffect(() => {
    applyScale(scale);

    try {
      window.localStorage.setItem(STORAGE_KEY, scale);
    } catch {
      // Si localStorage falla, la escala actual sigue aplicada.
    }
  }, [scale]);

  return (
    <label
      className={`ui-scale-select ${
        compact ? "ui-scale-select--compact" : ""
      }`}
    >
      {!compact ? <span className="ui-scale-select__label">{label}</span> : null}

      <select
        className="ui-scale-select__control"
        value={scale}
        aria-label={label}
        onChange={(event) => setScale(event.target.value as UiScale)}
      >
        {SCALE_OPTIONS.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}