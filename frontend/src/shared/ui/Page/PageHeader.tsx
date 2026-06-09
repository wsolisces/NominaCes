// ======================================================
// PATH: src/shared/ui/Page/PageHeader.tsx
// Encabezado estándar para páginas administrativas
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el encabezado principal de páginas del sistema.
 * - Mostrar breadcrumb, título, descripción, acciones y métricas.
 * - Mantener una estructura visual reutilizable entre módulos.
 *
 * No debe:
 * - Consultar APIs.
 * - Calcular datos de negocio.
 * - Definir lógica específica de módulos.
 */

import "./page-header.css";

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
  icon?: string;
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
 * Construye las clases CSS de una métrica según su variante visual.
 */
function getMetricClassName(variant?: PageHeaderMetricVariant): string {
  return [
    "page-header-metric",
    `page-header-metric-${variant ?? "neutral"}`
  ].join(" ");
}

/**
 * Renderiza una acción del encabezado.
 */
function renderHeaderAction(
  action: PageHeaderAction,
  variant: "primary" | "secondary"
) {
  return (
    <button
      type="button"
      className={[
        "page-header-action",
        `page-header-action-${variant}`
      ].join(" ")}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon ? (
        <span
          className="page-header-action-icon"
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
 * Renderiza el encabezado visual estándar para páginas internas.
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
  const hasBreadcrumb = Boolean(eyebrow || section);
  const hasActions = Boolean(action || secondaryAction);
  const hasMetrics = metrics.length > 0;

  return (
    <section className="page-header-shell">
      <div className="page-header-main">
        <div className="page-header-copy">
          <h1 className="page-header-title">
            {title}
          </h1>

          {hasBreadcrumb ? (
            <div className="page-header-breadcrumb">
              {eyebrow ? (
                <span className="page-header-breadcrumb-strong">
                  {eyebrow}
                </span>
              ) : null}

              {eyebrow && section ? (
                <span className="page-header-breadcrumb-separator">
                  /
                </span>
              ) : null}

              {section ? (
                <span className="page-header-breadcrumb-current">
                  {section}
                </span>
              ) : null}
            </div>
          ) : null}

          {description ? (
            <p className="page-header-description">
              {description}
            </p>
          ) : null}
        </div>

        {hasActions ? (
          <div className="page-header-actions">
            {secondaryAction
              ? renderHeaderAction(secondaryAction, "secondary")
              : null}

            {action
              ? renderHeaderAction(action, "primary")
              : null}
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
              <span className="page-header-metric-label">
                {metric.label}
              </span>

              <strong className="page-header-metric-value">
                {metric.value}
              </strong>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}