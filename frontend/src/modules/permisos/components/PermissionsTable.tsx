// ======================================================
// PATH: src/modules/permisos/components/PermissionsTable.tsx
// Tabla reutilizable del catálogo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir las columnas visibles del catálogo de permisos.
 * - Renderizar permisos mediante el DataTable reutilizable.
 * - Mostrar las acciones disponibles para cada permiso.
 * - Presentar estados, fechas y valores de forma consistente.
 * - Definir los textos utilizados por los filtros.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Administrar modales.
 * - Modificar directamente el estado de permisos.
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
} from "../../../shared/ui/DataTable/DataTable";

import type { PermissionDto } from "../permisos.types";

/**
 * Props públicas de la tabla de permisos.
 */
export type PermissionsTableProps = {
  permissions: PermissionDto[];
  isLoading: boolean;
  errorMessage?: string;

  onEdit: (permission: PermissionDto) => void;
  onToggleStatus: (permission: PermissionDto) => void;
  onAudit: (permission: PermissionDto) => void;
};

/**
 * Props internas para una acción disponible dentro de una fila.
 */
type PermissionActionButtonProps = {
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  variant?: "default" | "success" | "danger";
  onClick: () => void;
};

/**
 * Props compartidas por los iconos internos.
 */
type ActionIconProps = SVGProps<SVGSVGElement>;

/**
 * Formateador compartido para fechas del catálogo.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short"
});

/**
 * Normaliza texto opcional antes de mostrarlo o filtrarlo.
 */
function normalizeDisplayText(
  value: string | null | undefined,
  fallback: string
): string {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

/**
 * Formatea una fecha para mostrarla y utilizarla en filtros.
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
 * Convierte una fecha válida a formato ISO para el atributo dateTime.
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
 * Obtiene el texto mostrado y utilizado para filtrar el estado.
 */
function getPermissionStatusText(
  permission: PermissionDto
): string {
  return permission.isActive ? "Activo" : "Inactivo";
}

/**
 * Obtiene el nombre visible de un permiso.
 */
function getPermissionName(
  permission: PermissionDto
): string {
  return normalizeDisplayText(
    permission.permissionName,
    "Permiso sin nombre"
  );
}

/**
 * Obtiene el módulo visible de un permiso.
 */
function getPermissionModule(
  permission: PermissionDto
): string {
  return normalizeDisplayText(
    permission.moduleKey,
    "Sin módulo"
  );
}

/**
 * Obtiene la descripción visible de un permiso.
 */
function getPermissionDescription(
  permission: PermissionDto
): string {
  return normalizeDisplayText(
    permission.description,
    "Sin descripción"
  );
}

/**
 * Evita que las acciones internas activen eventos asociados a la fila.
 */
function stopRowInteraction(
  event: MouseEvent<HTMLElement>
): void {
  event.stopPropagation();
}

/**
 * Icono utilizado para editar un permiso.
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
 * Icono utilizado para activar un permiso.
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
 * Icono utilizado para inactivar un permiso.
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
 * Icono utilizado para consultar la auditoría de un permiso.
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
 * Botón compacto utilizado dentro de las acciones de una fila.
 */
function PermissionActionButton({
  children,
  ariaLabel,
  disabled = false,
  variant = "default",
  onClick
}: PermissionActionButtonProps) {
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
 * Tabla principal del catálogo controlado de permisos.
 */
export function PermissionsTable({
  permissions,
  isLoading,
  errorMessage,
  onEdit,
  onToggleStatus,
  onAudit
}: PermissionsTableProps) {
  /**
   * Las columnas se memorizan para evitar reconstrucciones
   * innecesarias durante el renderizado.
   */
  const columns = useMemo<ColumnDef<PermissionDto>[]>(
    () => [
      {
        key: "permissionName",
        header: "Permiso",
        width: "17rem",
        wrap: true,

        filterValue: getPermissionName,

        cell: (permission) => (
          <div className="security-main-text">
            <span className="security-main-text__title">
              {getPermissionName(permission)}
            </span>
          </div>
        )
      },
      {
        key: "moduleKey",
        header: "Módulo",
        width: "11rem",

        filterValue: getPermissionModule,

        cell: (permission) => (
          <span className="security-module-key">
            {getPermissionModule(permission)}
          </span>
        )
      },
      {
        key: "description",
        header: "Descripción",
        width: "24rem",
        wrap: true,

        filterValue: getPermissionDescription,

        cell: (permission) => (
          <span className="security-description">
            {getPermissionDescription(permission)}
          </span>
        )
      },
      {
        key: "isActive",
        header: "Estado",
        width: "8rem",
        align: "center",

        filterValue: getPermissionStatusText,

        cell: (permission) => (
          <span
            className={[
              "security-status",
              permission.isActive
                ? "security-status--active"
                : "security-status--inactive"
            ].join(" ")}
          >
            {getPermissionStatusText(permission)}
          </span>
        )
      },
      {
        key: "updatedAt",
        header: "Actualización",
        width: "13rem",

        filterValue: (permission) =>
          formatDateTime(permission.updatedAt),

        cell: (permission) => {
          const formattedDate = formatDateTime(
            permission.updatedAt
          );

          const isoDateTime = getIsoDateTime(
            permission.updatedAt
          );

          if (!isoDateTime) {
            return <span>{formattedDate}</span>;
          }

          return (
            <time
              dateTime={isoDateTime}
              title={isoDateTime}
            >
              {formattedDate}
            </time>
          );
        }
      },
      {
        key: "actions",
        header: "Acciones",
        width: "9rem",
        align: "right",
        disableSort: true,

        cell: (permission) => {
          const permissionName = normalizeDisplayText(
            permission.permissionName,
            permission.permissionKey
          );

          return (
            <div
              className="security-table-actions"
              onClick={stopRowInteraction}
            >
              <PermissionActionButton
                ariaLabel={`Editar permiso ${permissionName}`}
                disabled={isLoading}
                onClick={() => onEdit(permission)}
              >
                <EditIcon />
              </PermissionActionButton>

              

              <PermissionActionButton
                ariaLabel={`Consultar auditoría del permiso ${permissionName}`}
                disabled={isLoading}
                onClick={() => onAudit(permission)}
              >
                <AuditIcon />
              </PermissionActionButton>
            </div>
          );
        }
      }
    ],
    [isLoading, onAudit, onEdit, onToggleStatus]
  );

  return (
    <DataTable
      tableId="security-permissions"
      sourceRows={permissions}
      columns={columns}
      loading={isLoading}
      error={errorMessage?.trim() || null}
    />
  );
}