// ======================================================
// PATH: src/modules/permisos/components/PermissionsTable.tsx
// Tabla del catálogo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar permisos en formato tabular usando DataTable reutilizable.
 * - Renderizar estado, módulo, descripción, fechas y acciones disponibles.
 * - Mantener la tabla independiente de llamadas HTTP.
 * - Usar permission_key como identificador real del permiso.
 * - Mantener columnas limpias, proporcionadas y alineadas al diseño corporativo.
 * - Usar columna principal fija y scroll horizontal cuando la tabla lo requiera.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Abrir modales por sí misma.
 * - Mutar el estado global de permisos.
 * - Usar id, porque app_permission no tiene columna id.
 */

import DataTable, {
  type ColumnDef
} from "../../shared/ui/DataTable/DataTable";

import type { PermissionDto } from "./permisos.types";

type PermissionTableRow = PermissionDto &
  Record<string, unknown> & {
    row_key: string;
    permission_label: string;
    module_label: string;
    status_label: string;
    updated_label: string;
  };

export type PermissionsTableProps = {
  permissions: PermissionDto[];
  loading?: boolean;
  onEdit: (permission: PermissionDto) => void;
  onToggleStatus: (permission: PermissionDto) => void;
  onDelete: (permission: PermissionDto) => void;
};

/**
 * Formatea fechas recibidas desde el backend en formato local.
 */
function formatDate(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

/**
 * Obtiene el nombre visible del módulo usando el nombre como prioridad.
 */
function getModuleLabel(permission: PermissionDto): string {
  return (
    permission.module_name?.trim() ||
    permission.module_key?.trim() ||
    "Sin módulo"
  );
}

/**
 * Obtiene el nombre visible del permiso.
 */
function getPermissionLabel(permission: PermissionDto): string {
  return (
    permission.permission_name?.trim() ||
    permission.permission_key?.trim() ||
    "Sin nombre"
  );
}

/**
 * Renderiza la celda principal del permiso.
 */
function renderPermissionCell(permission: PermissionTableRow) {
  return (
    <div className="permissions-table__main-cell">
      <strong>{permission.permission_label}</strong>
    </div>
  );
}

/**
 * Renderiza la celda del módulo.
 */
function renderModuleCell(permission: PermissionTableRow) {
  return (
  
    <span className="permissions-table__description">
      {permission.module_label}
    </span>
  );
}

/**
 * Renderiza la descripción del permiso.
 */
function renderDescriptionCell(permission: PermissionTableRow) {
  return (
    <span className="permissions-table__description">
      {permission.description?.trim() || "—"}
    </span>
  );
}

/**
 * Renderiza el estado activo/inactivo.
 */
function renderStatusCell(permission: PermissionTableRow) {
  const isActive = Boolean(permission.is_active);

  return (
    <span
      className={
        isActive
          ? "permission-status permission-status--active"
          : "permission-status permission-status--inactive"
      }
    >
      {permission.status_label}
    </span>
  );
}

/**
 * Renderiza los botones de acción del permiso.
 */
function renderActionsCell(
  permission: PermissionTableRow,
  handlers: Pick<
    PermissionsTableProps,
    "onEdit" | "onToggleStatus" | "onDelete"
  >
) {
  return (
    <div className="permissions-actions">
      <button
        type="button"
        className="permissions-icon-button"
        onClick={(event) => {
          event.stopPropagation();
          handlers.onEdit(permission);
        }}
        aria-label={`Editar ${permission.permission_label}`}
        title="Editar"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 20h4.6L19.2 9.4a2.1 2.1 0 0 0 0-3L17.6 4.8a2.1 2.1 0 0 0-3 0L4 15.4V20Z" />
          <path d="m13.5 5.9 4.6 4.6" />
        </svg>
      </button>

      <button
        type="button"
        className="permissions-icon-button permissions-icon-button--danger"
        onClick={(event) => {
          event.stopPropagation();
          handlers.onDelete(permission);
        }}
        aria-label={`Eliminar ${permission.permission_label}`}
        title="Eliminar"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4 7h16" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M9 7V4h6v3" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Convierte permisos al tipo requerido por el DataTable.
 */
function toTableRows(permissions: PermissionDto[]): PermissionTableRow[] {
  return permissions.map((permission) => {
    const updatedLabel = formatDate(
      permission.updated_at ?? permission.created_at
    );

    return {
      ...permission,
      row_key: permission.permission_key,
      permission_label: getPermissionLabel(permission),
      module_label: getModuleLabel(permission),
      status_label: permission.is_active ? "Activo" : "Inactivo",
      updated_label: updatedLabel
    };
  });
}

/**
 * Construye las columnas oficiales de la tabla de permisos.
 */
function getPermissionColumns(
  handlers: Pick<
    PermissionsTableProps,
    "onEdit" | "onToggleStatus" | "onDelete"
  >
): ColumnDef<PermissionTableRow>[] {
  return [
    {
      key: "permission_label",
      label: "Permiso",
      width: "16rem",
      minWidth: "15rem",
      fixed: "left",
      render: (permission) => renderPermissionCell(permission)
    },
    {
      key: "module_label",
      label: "Módulo",
      width: "12rem",
      minWidth: "11rem",
      render: (permission) => renderModuleCell(permission)
    },
    {
      key: "description",
      label: "Descripción",
      width: "25rem",
      minWidth: "22rem",
      sortable: false,
      render: (permission) => renderDescriptionCell(permission)
    },
    {
      key: "status_label",
      label: "Estado",
      width: "8.5rem",
      minWidth: "8rem",
      align: "center",
      render: (permission) => renderStatusCell(permission)
    },
    {
      key: "updated_label",
      label: "Actualizado",
      width: "10rem",
      minWidth: "9rem",
      align: "center"
    },
    {
      key: "actions",
      label: "Acciones",
      width: "9rem",
      minWidth: "8.5rem",
      align: "right",
      sortable: false,
      filterable: false,
      render: (permission) => renderActionsCell(permission, handlers)
    }
  ];
}

/**
 * Tabla reutilizable del catálogo de permisos.
 */
export function PermissionsTable({
  permissions,
  loading = false,
  onEdit,
  onToggleStatus,
  onDelete
}: PermissionsTableProps) {
  const rows = toTableRows(permissions);

  const columns = getPermissionColumns({
    onEdit,
    onToggleStatus,
    onDelete
  });

  return (
    <DataTable<PermissionTableRow>
      tableId="permissions-table"
      sourceRows={rows}
      columns={columns}
      loading={loading}
      rowKey={(permission) => permission.row_key}
    />
  );
}

export default PermissionsTable;