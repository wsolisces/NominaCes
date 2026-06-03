// ======================================================
// PATH: src/shared/ui/Table/components/TableHeader.tsx
// Encabezado reutilizable para Table
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar título, subtítulo y acciones superiores de la tabla.
 *
 * No debe:
 * - Contener lógica de datos.
 * - Hacer peticiones HTTP.
 * - Conocer acciones específicas de módulos.
 */

import type { ReactNode } from "react";

export type TableHeaderProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function TableHeader({ title, subtitle, actions }: TableHeaderProps) {
  if (!title && !subtitle && !actions) {
    return null;
  }

  return (
    <header className="ni-table__header">
      <div className="ni-table__titleBlock">
        {title && <h2 className="ni-table__title">{title}</h2>}
        {subtitle && <p className="ni-table__subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div className="ni-table__actions">
          {actions}
        </div>
      )}
    </header>
  );
}