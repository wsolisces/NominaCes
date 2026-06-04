// ======================================================
// PATH: src/shared/ui/DataTable/components/PaginacionTable.tsx
// Paginación reutilizable para DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Exponer una paginación aislada para compatibilidad.
 * - Permitir reutilizar controles cuando una tabla externa lo requiera.
 *
 * No debe:
 * - Calcular filtros.
 * - Ordenar datos.
 * - Consultar APIs.
 */

type PaginacionTableProps = {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  startIndex: number;
  endIndex: number;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Paginación visual independiente.
 */
export default function PaginacionTable({
  currentPage,
  totalPages,
  totalRows,
  startIndex,
  endIndex,
  onPrevious,
  onNext
}: PaginacionTableProps) {
  return (
    <div className="data-table-pagination">
      <div className="data-table-pagination__left">
        <span>
          {totalRows === 0
            ? "0 registros"
            : `${startIndex + 1} - ${endIndex} de ${totalRows}`}
        </span>
      </div>

      <div className="data-table-pagination__right">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={onPrevious}
          className="data-table-button data-table-button--icon"
          title="Página anterior"
        >
          ‹
        </button>

        <span className="data-table-pagination__page">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={onNext}
          className="data-table-button data-table-button--icon"
          title="Página siguiente"
        >
          ›
        </button>
      </div>
    </div>
  );
}