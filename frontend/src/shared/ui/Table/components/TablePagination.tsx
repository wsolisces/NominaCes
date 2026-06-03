// ======================================================
// PATH: src/shared/ui/Table/components/TablePagination.tsx
// Paginación reutilizable para Table
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar navegación de páginas.
 * - Permitir avanzar y retroceder.
 *
 * No debe:
 * - Filtrar datos.
 * - Ordenar datos.
 * - Conocer columnas o estructura de filas.
 */

export type TablePaginationProps = {
  paginated: boolean;
  totalRows: number;
  startIndex: number;
  endIndex: number;
  safePage: number;
  totalPages: number;
  onPageChange: (page: number | ((current: number) => number)) => void;
};

export function TablePagination({
  paginated,
  totalRows,
  startIndex,
  endIndex,
  safePage,
  totalPages,
  onPageChange
}: TablePaginationProps) {
  if (!paginated) {
    return null;
  }

  return (
    <footer className="ni-table__footer">
      <span>
        {totalRows === 0
          ? "0 registros"
          : `${startIndex + 1} - ${endIndex} de ${totalRows}`}
      </span>

      <div className="ni-table__pagination">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
        >
          Anterior
        </button>

        <span>
          {safePage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() =>
            onPageChange((current) => Math.min(totalPages, current + 1))
          }
        >
          Siguiente
        </button>
      </div>
    </footer>
  );
}