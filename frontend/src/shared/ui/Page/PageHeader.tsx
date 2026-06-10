// ======================================================
// PATH: src/shared/ui/Page/PageHeader.tsx
// Encabezado reutilizable para páginas administrativas
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el encabezado principal de páginas internas.
 * - Mostrar breadcrumb, título, descripción y acciones.
 * - Permitir métricas como contenido opcional sin definir su estilo principal aquí.
 * - Usar clases globales definidas en src/styles/pages/pages.css.
 * - Mantener una estructura reutilizable entre módulos administrativos.
 *
 * No debe:
 * - Consultar APIs.
 * - Calcular reglas de negocio.
 * - Definir estilos inline.
 * - Importar CSS específico de módulos.
 * - Conocer permisos, usuarios, roles o catálogos.
 */

import type { ReactNode } from "react";

export type PageHeaderMetricVariant =
  | "neutral"
  | "success"
  | "danger"
  | "info"
  | "warning";

export type PageHeaderMetric = {
  label: string;
  value: string | number;
  variant?: PageHeaderMetricVariant;
};

export type PageHeaderAction = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
};

export type PageHeaderProps = {
  eyebrow?: string;
  section?: string;
  title: string;
  description?: string;
  action?: PageHeaderAction;
  secondaryAction?: PageHeaderAction;
  metrics?: PageHeaderMetric[];
};

/**
 * Construye la clase visual de una métrica según su variante.
 * El estilo fino de KPIs puede vivir después en su propio CSS.
 */
function getMetricClassName(
  variant: PageHeaderMetricVariant = "neutral"
): string {
  return `page-header-metric page-header-metric--${variant}`;
}

/**
 * Renderiza el breadcrumb superior del encabezado.
 */
function renderBreadcrumb(
  eyebrow?: string,
  section?: string
): ReactNode {
  if (!eyebrow && !section) return null;

  return (
    <div className="page-header-breadcrumb" aria-label="Ruta de página">
      {eyebrow ? (
        <span className="page-header-breadcrumb__item">
          {eyebrow}
        </span>
      ) : null}

      {eyebrow && section ? (
        <span
          className="page-header-breadcrumb__separator"
          aria-hidden="true"
        >
          /
        </span>
      ) : null}

      {section ? (
        <span className="page-header-breadcrumb__item page-header-breadcrumb__item--active">
          {section}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Renderiza una acción del encabezado.
 */
function renderAction(
  action: PageHeaderAction,
  variant: "primary" | "secondary"
): ReactNode {
  return (
    <button
      type="button"
      className={`page-header-action page-header-action--${variant}`}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon ? (
        <span
          className="page-header-action__icon"
          aria-hidden="true"
        >
          {action.icon}
        </span>
      ) : null}

      <span>{action.label}</span>
    </button>
  );
}

/**
 * Encabezado estándar para páginas administrativas.
 */
export function PageHeader({
  eyebrow,
  section,
  title,
  description,
  action,
  secondaryAction,
  metrics = []
}: PageHeaderProps) {
  const hasActions = Boolean(action || secondaryAction);
  const hasMetrics = metrics.length > 0;

  return (
    <header className="page-header-shell">
      <div className="page-header-main">
        <div className="page-header-copy">
          {renderBreadcrumb(eyebrow, section)}

          <h1 className="page-header-title">{title}</h1>

          {description ? (
            <p className="page-header-description">
              {description}
            </p>
          ) : null}
        </div>

        {hasActions ? (
          <div className="page-header-actions">
            {secondaryAction
              ? renderAction(secondaryAction, "secondary")
              : null}

            {action ? renderAction(action, "primary") : null}
          </div>
        ) : null}
      </div>

      {hasMetrics ? (
        <div className="page-header-metrics">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className={getMetricClassName(metric.variant)}
            >
              <div className="page-header-metric__content">
                <span className="page-header-metric__label">
                  {metric.label}
                </span>

                <strong className="page-header-metric__value">
                  {metric.value}
                </strong>
              </div>

              <span
                className="page-header-metric__indicator"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      ) : null}
    </header>
  );
}