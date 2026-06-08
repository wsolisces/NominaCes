// ======================================================
// PATH: src/modules/permisos/components/PermissionsTable.tsx
// Tabla del catálogo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar permisos en formato tabular.
 * - Renderizar estado, módulo y acciones disponibles.
 * - Mantener la tabla independiente de las llamadas HTTP.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Abrir modales por sí misma.
 * - Mutar el estado global de permisos.
 */

import type { PermissionDto } from "./permisos.types";

export type PermissionsTableProps = {
  permissions: PermissionDto[];
  loading?: boolean;
  onEdit: (permission: PermissionDto) => void;
  onToggleStatus: (permission: PermissionDto) => void;
  onDelete: (permission: PermissionDto) => void;
};

function formatDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export function PermissionsTable({
  permissions,
  loading = false,
  onEdit,
  onToggleStatus,
  onDelete
}: PermissionsTableProps) {
  if (loading) {
    return (
      <div className="permissions-table-empty">
        Cargando permisos...
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <div className="permissions-table-empty">
        No se encontraron permisos.
      </div>
    );
  }

  return (
    <div className="permissions-table-card">
      <div className="permissions-table-scroll">
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permiso</th>
              <th>Módulo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Actualizado</th>
              <th className="permissions-table__actions-heading">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.id}>
                <td>
                  <div className="permissions-table__main-cell">
                    <strong>{permission.permission_name}</strong>
                    <span>{permission.permission_key}</span>
                  </div>
                </td>

                <td>
                  <div className="permissions-table__module-cell">
                    <strong>{permission.module_name}</strong>
                    <span>{permission.module_key}</span>
                  </div>
                </td>

                <td>
                  <span className="permissions-table__description">
                    {permission.description || "—"}
                  </span>
                </td>

                <td>
                  <span
                    className={
                      permission.is_active
                        ? "permission-status permission-status--active"
                        : "permission-status permission-status--inactive"
                    }
                  >
                    {permission.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td>{formatDate(permission.updated_at ?? permission.created_at)}</td>

                <td>
                  <div className="permissions-actions">
                    <button
                      type="button"
                      className="permissions-icon-button"
                      onClick={() => onEdit(permission)}
                      aria-label={`Editar ${permission.permission_name}`}
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
                      className="permissions-icon-button"
                      onClick={() => onToggleStatus(permission)}
                      aria-label={
                        permission.is_active
                          ? `Desactivar ${permission.permission_name}`
                          : `Activar ${permission.permission_name}`
                      }
                      title={permission.is_active ? "Desactivar" : "Activar"}
                    >
                      {permission.is_active ? (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className="permissions-icon-button permissions-icon-button--danger"
                      onClick={() => onDelete(permission)}
                      aria-label={`Eliminar ${permission.permission_name}`}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}