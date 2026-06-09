// ======================================================
// PATH: src/shared/ui/DataTable/components/PaginacionTable.tsx
// Paginación reutilizable para DataTable
// ======================================================

/**
 * Responsabilidades:
 * - Exponer una paginación aislada para DataTable.
 * - Mostrar el rango visible de registros.
 * - Mostrar páginas numeradas cuando aplique.
 * - Permitir navegar entre página anterior y siguiente.
 * - Mantener una estructura visual consistente con DataTable.
 *
 * No debe:
 * - Calcular filtros.
 * - Ordenar datos.
 * - Consultar APIs.
 * - Conocer reglas internas de módulos.
 */

type PaginacionTableProps = {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  startIndex: number;
  endIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  label?: string;
};

/**
 * Normaliza el total de páginas para evitar valores inválidos.
 */
function getSafeTotalPages(totalPages: number): number {
  return Math.max(totalPages, 1);
}

/**
 * Normaliza la página actual para evitar valores fuera de rango.
 */
function getSafeCurrentPage(
  currentPage: number,
  safeTotalPages: number
): number {
  return Math.min(Math.max(currentPage, 1), safeTotalPages);
}

/**
 * Normaliza el índice final visible.
 */
function getSafeEndIndex(
  totalRows: number,
  endIndex: number
): number {
  if (totalRows <= 0) {
    return 0;
  }

  return Math.min(endIndex, totalRows);
}

/**
 * Construye el texto visible del rango paginado.
 */
function getPaginationSummary(
  totalRows: number,
  startIndex: number,
  endIndex: number,
  label: string
): string {
  if (totalRows <= 0) {
    return `Mostrando 0 ${label}`;
  }

  return `Mostrando ${startIndex + 1} a ${endIndex} de ${totalRows} ${label}`;
}

/**
 * Construye la lista de páginas visibles.
 *
 * Regla visual:
 * - Mostrar máximo 3 páginas.
 * - Iniciar con 1, 2, 3.
 * - Conforme avanza, mover la ventana: 2, 3, 4 / 3, 4, 5.
 */
function getVisiblePages(
  currentPage: number,
  totalPages: number
): number[] {
  const safeTotalPages = Math.max(totalPages, 1);
  const visibleCount = Math.min(3, safeTotalPages);

  if (safeTotalPages <= 3) {
    return Array.from(
      { length: safeTotalPages },
      (_, index) => index + 1
    );
  }

  const middlePage = Math.max(currentPage, 2);

  let startPage = middlePage - 1;
  let endPage = startPage + visibleCount - 1;

  if (endPage > safeTotalPages) {
    endPage = safeTotalPages;
    startPage = endPage - visibleCount + 1;
  }

  return Array.from(
    { length: visibleCount },
    (_, index) => startPage + index
  );
}

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
  onNext,
  onPageChange,
  label = "registros"
}: PaginacionTableProps) {
  const safeTotalPages = getSafeTotalPages(totalPages);

  const safeCurrentPage = getSafeCurrentPage(
    currentPage,
    safeTotalPages
  );

  const safeEndIndex = getSafeEndIndex(totalRows, endIndex);

  const visiblePages = getVisiblePages(
    safeCurrentPage,
    safeTotalPages
  );

  const isPreviousDisabled = safeCurrentPage <= 1 || totalRows <= 0;

  const isNextDisabled =
    safeCurrentPage >= safeTotalPages || totalRows <= 0;

  return (
    <footer className="data-table-footer">
      <p className="data-table-footer__summary">
        {getPaginationSummary(
          totalRows,
          startIndex,
          safeEndIndex,
          label
        )}
      </p>

      <nav
        className="data-table-pagination"
        aria-label="Paginación de tabla"
      >
        <button
          type="button"
          disabled={isPreviousDisabled}
          onClick={onPrevious}
          className="data-table-pagination__button"
          aria-label="Página anterior"
          title="Página anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            disabled={page === safeCurrentPage}
            onClick={() => onPageChange?.(page)}
            className={[
              "data-table-pagination__number",
              page === safeCurrentPage
                ? "data-table-pagination__number--active"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}
            aria-current={page === safeCurrentPage ? "page" : undefined}
            aria-label={`Página ${page}`}
            title={`Página ${page}`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={onNext}
          className="data-table-pagination__button"
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <span aria-hidden="true">›</span>
        </button>
      </nav>
    </footer>
  );
}