// ======================================================
// PATH: src/shared/ui/index.ts
// Exportaciones públicas de componentes UI reutilizables
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar imports de componentes compartidos.
 * - Evitar rutas largas en módulos.
 * - Exponer únicamente componentes reutilizables del sistema.
 *
 * Ejemplo:
 * import { Page, Button, Modal, Table } from "../../shared/ui";
 *
 * No debe:
 * - Exportar componentes específicos de un módulo.
 * - Exportar archivos internos de páginas.
 * - Duplicar componentes con el mismo propósito.
 */

export { Page } from "./Page/Page";
export type { PageProps } from "./Page/Page";

export { Button } from "./Button/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./Button/Button";

export { Badge } from "./Badge/Badge";
export type { BadgeProps, BadgeVariant } from "./Badge/Badge";

export { Toolbar } from "./Toolbar/Toolbar";
export type { ToolbarProps } from "./Toolbar/Toolbar";

export { InputField, SelectField } from "./Form/FormField";
export type {
  InputFieldProps,
  SelectFieldProps,
  SelectOption
} from "./Form/FormField";

export { Modal, ModalFormActions } from "./Modal/Modal";
export type { ModalProps, ModalActionsProps } from "./Modal/Modal";

export { Table } from "./Table/Table";
export type {
  TableAlign,
  TableColumn,
  TableDensity,
  TableFilterChip,
  TableProps,
  TableRowAction,
  TableSort,
  TableVariant
} from "./Table/Table.types";


export { UiScaleSelect } from "./UiScaleSelect/UiScaleSelect";
export type {
  UiScale,
  UiScaleSelectProps
} from "./UiScaleSelect/UiScaleSelect";