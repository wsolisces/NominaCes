// ======================================================
// PATH: src/shared/ui/index.ts
// Exportaciones públicas de componentes UI reutilizables
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar imports de componentes compartidos.
 * - Evitar rutas largas en módulos.
 * - Exponer únicamente componentes reutilizables del sistema.
 * - Mantener un único punto público de acceso a la capa UI.
 *
 * Ejemplo:
 * import {
 *   Page,
 *   PageHeader,
 *   Button,
 *   Modal,
 *   DataTable
 * } from "../../shared/ui";
 *
 * No debe:
 * - Exportar componentes específicos de un módulo.
 * - Exportar archivos internos de páginas.
 * - Duplicar componentes con el mismo propósito.
 * - Contener lógica de negocio.
 */

/* ======================================================
   PAGE
   ====================================================== */

export {
  Page,
  PageHeader
} from "./Page";

export type {
  PageContentVariant,
  PageHeaderAction,
  PageHeaderMetric,
  PageHeaderMetricVariant,
  PageHeaderProps,
  PageProps,
  PageVariant
} from "./Page";

/* ======================================================
   BUTTON
   ====================================================== */

export { Button } from "./Button/Button";

export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant
} from "./Button/Button";

/* ======================================================
   BADGE
   ====================================================== */

export { Badge } from "./Badge/Badge";

export type {
  BadgeProps,
  BadgeVariant
} from "./Badge/Badge";

/* ======================================================
   TOOLBAR
   ====================================================== */

export { Toolbar } from "./Toolbar/Toolbar";

export type { ToolbarProps } from "./Toolbar/Toolbar";

/* ======================================================
   FORM
   ====================================================== */

export {
  InputField,
  SelectField
} from "./Form/FormField";

export type {
  InputFieldProps,
  SelectFieldProps,
  SelectOption
} from "./Form/FormField";

/* ======================================================
   MODAL
   ====================================================== */

export {
  Modal,
  ModalFormActions
} from "./Modal/Modal";

export type {
  ModalActionsProps,
  ModalProps
} from "./Modal/Modal";

/* ======================================================
   CONFIRM ACTION MODAL
   ====================================================== */

/**
 * ConfirmAction:
 * Modal global reutilizable para confirmar acciones sensibles
 * como eliminar, activar, desactivar o cancelar procesos.
 */
export {
  ConfirmActionProvider,
  useConfirmAction
} from "./Modal/ConfirmActionModal";

export type {
  ConfirmActionOptions,
  ConfirmActionVariant
} from "./Modal/ConfirmActionModal";

/* ======================================================
   ACTION FEEDBACK MODAL
   ====================================================== */

/**
 * ActionFeedbackModal:
 * Modal global para mostrar retroalimentación visual
 * después de acciones exitosas o con error.
 */
export { ActionFeedbackModal } from "./Modal/ActionFeedbackModal/ActionFeedbackModal";

export type {
  ActionFeedbackModalProps,
  ActionFeedbackVariant
} from "./Modal/ActionFeedbackModal/ActionFeedbackModal";

/* ======================================================
   DATA TABLE
   ====================================================== */

/**
 * DataTable:
 * Tabla avanzada reutilizable con búsqueda, filtros,
 * ordenamiento, configuración de columnas y paginación.
 */
export { default as DataTable } from "./DataTable/DataTable";

export type {
  ColumnDef as DataTableColumn,
  DataTableProps
} from "./DataTable/DataTable";

/* ======================================================
   UI SCALE
   ====================================================== */

export { UiScaleSelect } from "./UiScaleSelect/UiScaleSelect";

export type {
  UiScale,
  UiScaleSelectProps
} from "./UiScaleSelect/UiScaleSelect";