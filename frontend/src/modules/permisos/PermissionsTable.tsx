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
 * - Permitir columna principal y acciones fijas cuando exista scroll horizontal.
 * - Usar columnas compactas para aprovechar mejor el espacio.
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
  };

export type PermissionsTableProps = {
  permissions: PermissionDto[];
  loading?: boolean;
  onEdit: (permission: PermissionDto) => void;
  onToggleStatus: (permission: PermissionDto) => void;
  onDelete: (permission: PermissionDto) => void;
};

/**
 * Formatea fechas recibidas desde el backend.
 */
function formatDate(value?: string | Date | null): string {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

/**
 * Obtiene el nombre visible del módulo.
 */
function getModuleLabel(permission: PermissionDto): string {
  return (
    permission.module_name?.trim() ||
    permission.module_key?.trim() ||
    "Sin módulo"
  );
}

/**
 * Renderiza la celda principal del permiso.
 */
function renderPermissionCell(permission: PermissionDto) {
  return (
    <div className="permissions-table__main-cell">
      <strong>{permission.permission_name}</strong>
    </div>
  );
}

/**
 * Renderiza la celda del módulo.
 */
function renderModuleCell(permission: PermissionDto) {
  return (
    <div className="permissions-table__module-cell">
      <strong>{getModuleLabel(permission)}</strong>
    </div>
  );
}

/**
 * Renderiza la descripción del permiso.
 */
function renderDescriptionCell(permission: PermissionDto) {
  return (
    <span className="permissions-table__description">
      {permission.description || "—"}
    </span>
  );
}

/**
 * Renderiza el estado activo/inactivo.
 */
function renderStatusCell(permission: PermissionDto) {
  return (
    <span
      className={
        permission.is_active
          ? "permission-status permission-status--active"
          : "permission-status permission-status--inactive"
      }
    >
      {permission.is_active ? "Activo" : "Inactivo"}
    </span>
  );
}

/**
 * Renderiza los botones de acción del permiso.
 */
function renderActionsCell(
  permission: PermissionDto,
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
        aria-label={`Editar ${permission.permission_name}`}
        title="Editar"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
        aria-label={`Eliminar ${permission.permission_name}`}
        title="Eliminar"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  return permissions.map((permission) => ({
    ...permission,
    row_key: permission.permission_key
  }));
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

  const columns: ColumnDef<PermissionTableRow>[] = [
    {
      key: "permission_name",
      header: "Permiso",
      width: "13rem",
      sticky: "left",
      cell: (permission) => renderPermissionCell(permission),
      filterValue: (permission) =>
        `${permission.permission_name} `,
      wrap: true
    },
    {
      key: "module_name",
      header: "Módulo",
      width: "13rem",
      
      cell: (permission) => renderModuleCell(permission),
      filterValue: (permission) =>
        `${permission.module_name ?? ""} `,
      wrap: true
    },
    {
      key: "description",
      header: "Descripción",
      compact: true,
      cell: (permission) => renderDescriptionCell(permission),
      filterValue: (permission) => permission.description ?? "",
      wrap: true,
      disableSort: true
    },
    {
      key: "is_active",
      header: "Estado",
      align: "center",
      compact: true,
      cell: (permission) => renderStatusCell(permission),
      filterValue: (permission) =>
        permission.is_active ? "Activo" : "Inactivo"
    },
    {
      key: "updated_at",
      header: "Actualizado",
      align: "center",
      compact: true,
      cell: (permission) =>
        formatDate(permission.updated_at ?? permission.created_at),
      filterValue: (permission) =>
        formatDate(permission.updated_at ?? permission.created_at)
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      compact: true,
      disableSort: true,
      cell: (permission) =>
        renderActionsCell(permission, {
          onEdit,
          onToggleStatus,
          onDelete
        })
    }
  ];

  return (
    <DataTable<PermissionTableRow>
      tableId="permissions-table"
      sourceRows={rows}
      columns={columns}
      loading={loading}
      disableColumnConfig={false}
      forceColumnOrder
      tableMode="scroll"
    />
  );
}

export default PermissionsTable;