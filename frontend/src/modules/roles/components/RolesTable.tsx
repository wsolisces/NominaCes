// ======================================================
// PATH: src/modules/roles/components/RolesTable.tsx
// Tabla reutilizable del catálogo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir las columnas visibles del catálogo de roles.
 * - Renderizar roles mediante DataTable.
 * - Mostrar las acciones disponibles para cada rol.
 * - Presentar estado, permisos y descripción.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Administrar modales.
 * - Modificar directamente el estado de los roles.
 * - Contener reglas de negocio.
 */

import {
  useMemo,
  type MouseEvent,
  type ReactNode,
  type SVGProps
} from "react";

import DataTable, {
  type ColumnDef
} from "../../../shared/ui/DataTable/DataTable";

import type { RoleDto } from "../roles.types";

/**
 * Props públicas de la tabla.
 */
export type RolesTableProps = {
  roles: RoleDto[];
  isLoading: boolean;
  errorMessage?: string;

  changingStatusId?: number | null;
  deletingRoleId?: number | null;

  onEdit: (role: RoleDto) => void;
  onToggleStatus: (role: RoleDto) => void;
  onDelete: (role: RoleDto) => void;
};

/**
 * Props de botones de acción.
 */
type RoleActionButtonProps = {
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  variant?: "default" | "success" | "danger";
  onClick: () => void;
};

/**
 * Props compartidas por iconos.
 */
type ActionIconProps = SVGProps<SVGSVGElement>;

/**
 * Normaliza textos opcionales.
 */
function normalizeDisplayText(
  value: string | null | undefined,
  fallback: string
): string {
  return value?.trim() || fallback;
}

/**
 * Detiene eventos de la fila.
 */
function stopRowInteraction(
  event: MouseEvent<HTMLElement>
): void {
  event.stopPropagation();
}

/**
 * Icono de edición.
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
 * Icono de activación.
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
 * Icono de inactivación.
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
 * Icono de eliminación.
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
        "roles-action-icon-button",
        `roles-action-icon-button--${variant}`
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
 * Renderiza permisos asignados.
 */
function RolePermissionsCell({
  role
}: {
  role: RoleDto;
}) {
  const visiblePermissions = role.permissions.slice(0, 3);

  const remainingPermissions =
    role.permissions.length - visiblePermissions.length;

  if (role.permissions.length === 0) {
    return (
      <span className="roles-description">
        Sin permisos
      </span>
    );
  }

  return (
    <div className="roles-permission-list">
      {visiblePermissions.map((permissionKey) => (
        <span
          key={permissionKey}
          className="roles-permission-chip"
          title={permissionKey}
        >
          {permissionKey}
        </span>
      ))}

      {remainingPermissions > 0 ? (
        <span className="roles-permission-chip">
          +{remainingPermissions}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Tabla principal del catálogo de roles.
 */
export function RolesTable({
  roles,
  isLoading,
  errorMessage,
  changingStatusId = null,
  deletingRoleId = null,
  onEdit,
  onToggleStatus,
  onDelete
}: RolesTableProps) {
  const columns = useMemo<ColumnDef<RoleDto>[]>(
    () => [
      {
        key: "roleName",
        header: "Rol",
        width: "16rem",
        wrap: true,

        filterValue: (role) => role.roleName,

        cell: (role) => (
          <div className="roles-main-text">
            <strong className="roles-main-text__title">
              {normalizeDisplayText(
                role.roleName,
                "Rol sin nombre"
              )}
            </strong>
          </div>
        )
      },
      {
        key: "roleKey",
        header: "Clave técnica",
        width: "14rem",

        filterValue: (role) => role.roleKey,

        cell: (role) => (
          <span className="roles-module-key">
            {normalizeDisplayText(
              role.roleKey,
              "Sin clave"
            )}
          </span>
        )
      },
      {
        key: "description",
        header: "Descripción",
        width: "22rem",
        wrap: true,

        filterValue: (role) =>
          role.description ?? "Sin descripción",

        cell: (role) => (
          <span className="roles-description">
            {normalizeDisplayText(
              role.description,
              "Sin descripción"
            )}
          </span>
        )
      },
      {
        key: "permissions",
        header: "Permisos",
        width: "21rem",
        wrap: true,

        filterValue: (role) =>
          role.permissions.join(" "),

        cell: (role) => (
          <RolePermissionsCell role={role} />
        )
      },
      {
        key: "isActive",
        header: "Estado",
        width: "8rem",
        align: "center",

        filterValue: (role) =>
          role.isActive ? "Activo" : "Inactivo",

        cell: (role) => (
          <span
            className={[
              "roles-status",
              role.isActive
                ? "roles-status--active"
                : "roles-status--inactive"
            ].join(" ")}
          >
            {role.isActive ? "Activo" : "Inactivo"}
          </span>
        )
      },
      {
        key: "actions",
        header: "Acciones",
        width: "9rem",
        align: "right",
        disableSort: true,

        cell: (role) => {
          const roleName = normalizeDisplayText(
            role.roleName,
            "Rol sin nombre"
          );

          const hasPendingAction =
            isLoading ||
            changingStatusId !== null ||
            deletingRoleId !== null;

          return (
            <div
              className="roles-table-actions"
              onClick={stopRowInteraction}
            >
              <RoleActionButton
                ariaLabel={`Editar rol ${roleName}`}
                disabled={hasPendingAction}
                onClick={() => onEdit(role)}
              >
                <EditIcon />
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={
                  role.isActive
                    ? `Inactivar rol ${roleName}`
                    : `Activar rol ${roleName}`
                }
                disabled={hasPendingAction}
                variant={
                  role.isActive
                    ? "danger"
                    : "success"
                }
                onClick={() => onToggleStatus(role)}
              >
                {role.isActive ? (
                  <DeactivateIcon />
                ) : (
                  <ActivateIcon />
                )}
              </RoleActionButton>

              <RoleActionButton
                ariaLabel={`Eliminar rol ${roleName}`}
                disabled={hasPendingAction}
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
      changingStatusId,
      deletingRoleId,
      isLoading,
      onDelete,
      onEdit,
      onToggleStatus
    ]
  );

  return (
    <DataTable
      tableId="roles-table"
      sourceRows={roles}
      columns={columns}
      loading={isLoading}
      error={errorMessage?.trim() || null}
    />
  );
}