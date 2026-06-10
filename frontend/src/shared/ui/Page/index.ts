// ======================================================
// PATH: src/shared/ui/Page/index.ts
// Exportaciones públicas de Page
// ======================================================

/**
 * Responsabilidades:
 * - Exponer componentes reutilizables de Page.
 * - Centralizar los tipos públicos de Page y PageHeader.
 * - Mantener limpia la importación desde src/shared/ui.
 *
 * No debe:
 * - Definir lógica visual.
 * - Importar CSS.
 * - Exportar componentes específicos de módulos.
 * - Duplicar rutas públicas de los mismos componentes.
 */

export { Page } from "./Page";

export type {
  PageContentVariant,
  PageProps,
  PageVariant
} from "./Page";

export { PageHeader } from "./PageHeader";

export type {
  PageHeaderAction,
  PageHeaderMetric,
  PageHeaderMetricVariant,
  PageHeaderProps
} from "./PageHeader";