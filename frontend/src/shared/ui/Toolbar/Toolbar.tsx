// ======================================================
// PATH: src/shared/ui/Toolbar/Toolbar.tsx
// Barra de herramientas reutilizable del sistema
// ======================================================

/**
 * Responsabilidades:
 * - Unificar la estructura de buscadores, filtros y acciones secundarias.
 * - Servir como contenedor previo a tablas, cards o listados.
 * - Mantener alineación responsive en páginas administrativas.
 *
 * No debe:
 * - Consultar APIs.
 * - Guardar estado de búsqueda o filtros.
 * - Definir lógica específica de módulos.
 */

import type { ReactNode } from "react";

import "./toolbar.css";

/**
 * Props de la barra de herramientas.
 */
export type ToolbarProps = {
  /**
   * Contenido alineado a la izquierda.
   *
   * Ejemplo:
   * Buscador, filtros principales o chips.
   */
  left?: ReactNode;

  /**
   * Contenido alineado a la derecha.
   *
   * Ejemplo:
   * Botón de filtros, exportar o refrescar.
   */
  right?: ReactNode;

  /**
   * Contenido personalizado.
   *
   * Si se envía, reemplaza la estructura left/right.
   */
  children?: ReactNode;

  /**
   * Clase opcional para ajustes puntuales.
   */
  className?: string;
};

/**
 * Barra reutilizable para controles de listados.
 */
export function Toolbar({ left, right, children, className }: ToolbarProps) {
  const toolbarClassName = ["app-toolbar", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={toolbarClassName}>
      {children ? (
        children
      ) : (
        <>
          {left ? <div className="app-toolbar__left">{left}</div> : null}
          {right ? <div className="app-toolbar__right">{right}</div> : null}
        </>
      )}
    </div>
  );
}