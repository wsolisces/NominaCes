// ======================================================
// PATH: src/shared/ui/Toolbar/Toolbar.tsx
// Barra reutilizable de acciones y búsqueda
// ======================================================

import type { ReactNode } from "react";
import "./toolbar.css";

/**
 * Props del Toolbar.
 *
 * left:
 * - Buscador, filtros o controles principales.
 *
 * right:
 * - Acciones secundarias como actualizar, exportar, limpiar.
 */
export type ToolbarProps = {
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
};

/**
 * Toolbar reutilizable.
 *
 * Responsabilidades:
 * - Homologar barras superiores de tablas o listados.
 * - Evitar repetir flex, gaps y responsividad.
 *
 * No debe:
 * - Contener lógica de filtros.
 * - Saber qué módulo lo usa.
 */
export function Toolbar({ left, right, children }: ToolbarProps) {
  return (
    <div className="app-toolbar">
      {children ? (
        children
      ) : (
        <>
          <div className="app-toolbar__left">{left}</div>
          <div className="app-toolbar__right">{right}</div>
        </>
      )}
    </div>
  );
}