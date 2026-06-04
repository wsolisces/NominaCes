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
  type ReactNode
} from "react";

import { Button } from "../../../shared/ui";

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
  onClick: () => void;
};

/**
 * Formateador compartido para fechas del catálogo.
 */
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short"
});

/**
 * Normaliza texto opcional antes de mostrarlo en la tabla.
 */
function normalizeDisplayText(
  value: string | null | undefined,
  fallback: string
): string {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

/**
 * Formatea una fecha para mostrarla dentro de la tabla.
 */
function formatDateTime(value: string | null | undefined): string {
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
function getIsoDateTime(value: string | null | undefined): string | undefined {
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
 * Evita que las acciones internas activen eventos asociados a la fila.
 */
function stopRowInteraction(event: MouseEvent<HTMLElement>): void {
  event.stopPropagation();
}

/**
 * Botón estándar utilizado dentro de las acciones de una fila.
 */
function PermissionActionButton({
  children,
  ariaLabel,
  disabled = false,
  onClick
}: PermissionActionButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={(event) => {
        stopRowInteraction(event);
        onClick();
      }}
    >
      {children}
    </Button>
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
   * Las columnas se memorizan para evitar reconstrucciones innecesarias
   * durante el renderizado de la tabla.
   */
  const columns = useMemo<ColumnDef<PermissionDto>[]>(
    () => [
      {
        key: "permissionName",
        header: "Permiso",
        width: "17rem",
        wrap: true,
        cell: (permission) => (
          <div className="security-main-text">
            <span className="security-main-text__title">
              {normalizeDisplayText(
                permission.permissionName,
                "Permiso sin nombre"
              )}
            </span>

            <code className="security-main-text__key">
              {normalizeDisplayText(
                permission.permissionKey,
                "Sin clave"
              )}
            </code>
          </div>
        )
      },
      {
        key: "moduleKey",
        header: "Módulo",
        width: "11rem",
        cell: (permission) => (
          <span className="security-module-key">
            {normalizeDisplayText(permission.moduleKey, "Sin módulo")}
          </span>
        )
      },
      {
        key: "description",
        header: "Descripción",
        width: "24rem",
        wrap: true,
        cell: (permission) => (
          <span className="security-description">
            {normalizeDisplayText(
              permission.description,
              "Sin descripción"
            )}
          </span>
        )
      },
      {
        key: "isActive",
        header: "Estado",
        width: "8rem",
        align: "center",
        cell: (permission) => (
          <span
            className={[
              "security-status",
              permission.isActive
                ? "security-status--active"
                : "security-status--inactive"
            ].join(" ")}
          >
            {permission.isActive ? "Activo" : "Inactivo"}
          </span>
        )
      },
      {
        key: "updatedAt",
        header: "Actualización",
        width: "13rem",
        cell: (permission) => {
          const formattedDate = formatDateTime(permission.updatedAt);
          const isoDateTime = getIsoDateTime(permission.updatedAt);

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
        width: "19rem",
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
                Editar
              </PermissionActionButton>

              <PermissionActionButton
                ariaLabel={
                  permission.isActive
                    ? `Inactivar permiso ${permissionName}`
                    : `Activar permiso ${permissionName}`
                }
                disabled={isLoading}
                onClick={() => onToggleStatus(permission)}
              >
                {permission.isActive ? "Inactivar" : "Activar"}
              </PermissionActionButton>

              <PermissionActionButton
                ariaLabel={`Consultar auditoría del permiso ${permissionName}`}
                disabled={isLoading}
                onClick={() => onAudit(permission)}
              >
                Auditoría
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