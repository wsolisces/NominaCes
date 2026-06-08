// ======================================================
// PATH: src/modules/roles/components/RolesTable.tsx
// Tabla reutilizable del catálogo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir columnas visibles del catálogo de roles.
 * - Renderizar roles mediante DataTable reutilizable.
 * - Mostrar acciones por iconos.
 * - Presentar estado, fechas y descripciones de forma consistente.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Administrar modales.
 * - Modificar directamente el estado de roles.
 * - Contener reglas de negocio del módulo.
 */

import {
  useMemo,
  type MouseEvent,
  type ReactNode,
  type SVGProps
} from "react";

import DataTable, {
  type ColumnDef
} from "../../shared/ui/DataTable/DataTable";

import type { RoleDto } from "./roles.types";

/**
 * Props públicas de la tabla de roles.
 */
export type RolesTableProps = {
  roles: RoleDto[];
  isLoading: boolean;
  errorMessage?: string;

  onEdit: (role: RoleDto) => void;
  onToggleStatus: (role: RoleDto) => void;
  onDelete: (role: RoleDto) => void;
  onPermissions: (role: RoleDto) => void;
  onAudit: (role: RoleDto) => void;
};

/**
 * Props internas para botones de acción.
 */
type RoleActionButtonProps = {
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  variant?: "default" | "success" | "danger";
  onClick: () => void;
};

/**
 * Props compartidas por iconos internos.
 */
type ActionIconProps = SVGProps<SVGSVGElement>;

/**
 * Formateador compartido de fechas.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short"
});

/**
 * Normaliza texto opcional para mostrarlo o filtrarlo.
 */
function normalizeDisplayText(
  value: string | null | undefined,
  fallback: string
): string {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

/**
 * Formatea una fecha para lectura.
 */
function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return dateTimeFormatter.format(date);
}

/**
 * Obtiene fecha ISO válida para el atributo dateTime.
 */
function getIsoDateTime(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

/**
 * Obtiene texto visible del estado.
 */
function getRoleStatusText(role: RoleDto): string {
  return role.isActive ? "Activo" : "Inactivo";
}

/**
 * Obtiene el nombre visible del rol.
 */
function getRoleName(role: RoleDto): string {
  return normalizeDisplayText(role.roleName, "Rol sin nombre");
}

/**
 * Obtiene la clave visible del rol.
 */
function getRoleKey(role: RoleDto): string {
  return normalizeDisplayText(role.roleKey, "Sin clave");
}

/**
 * Obtiene la descripción visible del rol.
 */
function getRoleDescription(role: RoleDto): string {
  return normalizeDisplayText(role.description, "Sin descripción");
}

/**
 * Determina si un rol es protegido por sistema.
 */
function isProtectedRole(role: RoleDto): boolean {
  return role.roleKey.trim().toUpperCase() === "ADMINISTRADOR";
}

/**
 * Evita que una acción active eventos de la fila.
 */
function stopRowInteraction(
  event: MouseEvent<HTMLElement>
): void {
  event.stopPropagation();
}

/**
 * Icono para editar.
 */
function EditIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

/**
 * Icono para activar.
 */
function ActivateIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/**
 * Icono para inactivar.
 */
function DeactivateIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </svg>
  );
}

/**
 * Icono para eliminar.
 */
function DeleteIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

/**
 * Icono para permisos.
 */
function PermissionsIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3l8 4v5c0 5-3.4 8.5-8 9-4.6-.5-8-4-8-9V7Z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

/**
 * Icono para auditoría.
 */
function AuditIcon(props: ActionIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 5h6" />
      <path d="M9 9h6" />
      <path d="M9 13h3" />
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="m18 18 2 2" />
    </svg>
  );
}

/**
 * Botón compacto de acción.
 */
function RoleActionButton({
  children,
  ariaLabel,
  disabled = false,
  variant = "default",
  onClick
}: RoleActionButtonProps) {
  return (
    <button
      type="button"
      className={[
        "security-action-icon-button",
        `security-action-icon-button--${variant}`
      ].join(" ")}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={(event) => {
        stopRowInteraction(event);
        onClick();
      }}
    >
      {children}
    </button>
  );
}

/**
 * Tabla principal de roles.
 */
export function RolesTable({
  roles,
  isLoading,
  errorMessage,
  onEdit,
  onToggleStatus,
  onDelete,
  onPermissions,
  onAudit
}: RolesTableProps) {
  const columns = useMemo<ColumnDef<RoleDto>[]>(
    () => [
      {
        key: "roleName",
        header: "Rol",
        width: "17rem",
        wrap: true,

        filterValue: getRoleName,

        cell: (role) => (
          <div className="security-main-text">
            <span className="security-main-text__title">
              {getRoleName(role)}
            </span>

            {isProtectedRole(role) ? (
              <span className="security-main-text__meta">
                Rol principal del sistema
              </span>
            ) : null}
          </div>
        )
      },
      {
        key: "roleKey",
        header: "Clave",
        width: "12rem",

        filterValue: getRoleKey,

        cell: (role) => (
          <span className="security-module-key">
            {getRoleKey(role)}
          </span>
        )
      },
      {
        key: "description",
        header: "Descripción",
        width: "24rem",
        wrap: true,

        filterValue: getRoleDescription,

        cell: (role) => (
          <span className="security-description">
            {getRoleDescription(role)}
          </span>
        )
      },
      {
        key: "isActive",
        header: "Estado",
        width: "8rem",
        align: "center",

        filterValue: getRoleStatusText,

        cell: (role) => (
          <span
            className={[
              "security-status",
              role.isActive
                ? "security-status--active"
                : "security-status--inactive"
            ].join(" ")}
          >
            {getRoleStatusText(role)}
          </span>
        )
      },
      {
        key: "updatedAt",
        header: "Actualización",
        width: "13rem",

        filterValue: (role) => formatDateTime(role.updatedAt),

        cell: (role) => {
          const formattedDate = formatDateTime(role.updatedAt);
          const isoDateTime = getIsoDateTime(role.updatedAt);

          if (!isoDateTime) {
            return <span>{formattedDate}</span>;
          }

          return (
            <time dateTime={isoDateTime} title={isoDateTime}>
              {formattedDate}
            </time>
          );
        }
      },
      {
        key: "actions",
        header: "Acciones",
        width: "13rem",
        align: "right",
        disableSort: true,

        cell: (role) => {
          const roleName = getRoleName(role);
          const protectedRole = isProtectedRole(role);

          return (
            <div
              className="security-table-actions"
              onClick={stopRowInteraction}
            >
              <RoleActionButton
                ariaLabel={`Editar rol ${roleName}`}
                disabled={isLoading}
                onClick={() => onEdit(role)}
              >
                <EditIcon />
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={`Configurar permisos del rol ${roleName}`}
                disabled={isLoading}
                onClick={() => onPermissions(role)}
              >
                <PermissionsIcon />
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={
                  role.isActive
                    ? `Inactivar rol ${roleName}`
                    : `Activar rol ${roleName}`
                }
                disabled={isLoading || protectedRole}
                variant={role.isActive ? "danger" : "success"}
                onClick={() => onToggleStatus(role)}
              >
                {role.isActive ? <DeactivateIcon /> : <ActivateIcon />}
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={`Consultar auditoría del rol ${roleName}`}
                disabled={isLoading}
                onClick={() => onAudit(role)}
              >
                <AuditIcon />
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={`Eliminar rol ${roleName}`}
                disabled={isLoading || protectedRole}
                variant="danger"
                onClick={() => onDelete(role)}
              >
                <DeleteIcon />
              </RoleActionButton>
            </div>
          );
        }
      }
    ],
    [
      isLoading,
      onAudit,
      onDelete,
      onEdit,
      onPermissions,
      onToggleStatus
    ]
  );

  return (
    <DataTable
      tableId="security-roles"
      sourceRows={roles}
      columns={columns}
      loading={isLoading}
      error={errorMessage?.trim() || null}
    />
  );
}