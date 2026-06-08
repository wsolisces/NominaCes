// ======================================================
// PATH: src/modules/usuarios/components/UsersTable.tsx
// Tabla del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el listado de usuarios.
 * - Mostrar estado, rol, bloqueo y acciones disponibles.
 * - Mantener la tabla sin llamadas directas al backend.
 *
 * No debe:
 * - Administrar modales.
 * - Consultar API.
 * - Contener reglas de carga de datos.
 */

import type { UserDto } from "./users.types";

export type UsersTableProps = {
  users: UserDto[];
  loading: boolean;
  onEdit: (user: UserDto) => void;
  onActivate: (user: UserDto) => void;
  onDeactivate: (user: UserDto) => void;
  onUnlock: (user: UserDto) => void;
  onDelete: (user: UserDto) => void;
};

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getUserStatusLabel(user: UserDto): string {
  if (user.is_locked) return "Bloqueado";
  if (!user.is_active) return "Inactivo";
  return "Activo";
}

function getUserStatusClass(user: UserDto): string {
  if (user.is_locked) return "users-status users-status--locked";
  if (!user.is_active) return "users-status users-status--inactive";
  return "users-status users-status--active";
}

export function UsersTable({
  users,
  loading,
  onEdit,
  onActivate,
  onDeactivate,
  onUnlock,
  onDelete
}: UsersTableProps) {
  if (loading) {
    return (
      <section className="users-table-card">
        <div className="users-table-empty">Cargando usuarios...</div>
      </section>
    );
  }

  if (!users.length) {
    return (
      <section className="users-table-card">
        <div className="users-table-empty">No hay usuarios para mostrar.</div>
      </section>
    );
  }

  return (
    <section className="users-table-card">
      <div className="users-table-scroll">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Intentos</th>
              <th>Creado</th>
              <th className="users-table-actions-header">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="users-main-cell">
                    <span className="users-avatar">
                      {user.full_name?.charAt(0)?.toUpperCase() ||
                        user.username.charAt(0).toUpperCase()}
                    </span>

                    <div className="users-main-text">
                      <strong>{user.username}</strong>
                      <small>{user.username_normalized || user.username}</small>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="users-clamp">{user.full_name}</span>
                </td>

                <td>
                  <span className="users-role-pill">
                    {user.role_name || user.role_key || "Sin rol"}
                  </span>
                </td>

                <td>
                  <span className={getUserStatusClass(user)}>
                    {getUserStatusLabel(user)}
                  </span>
                </td>

                <td>{user.failed_login_attempts ?? 0}</td>

                <td>{formatDate(user.created_at)}</td>

                <td>
                  <div className="users-actions">
                    <button
                      type="button"
                      className="users-icon-button"
                      onClick={() => onEdit(user)}
                      aria-label={`Editar usuario ${user.username}`}
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
                      </svg>
                    </button>

                    {user.is_locked && (
                      <button
                        type="button"
                        className="users-icon-button users-icon-button--warning"
                        onClick={() => onUnlock(user)}
                        aria-label={`Desbloquear usuario ${user.username}`}
                        title="Desbloquear"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 7.4-2.1" />
                        </svg>
                      </button>
                    )}

                    {user.is_active ? (
                      <button
                        type="button"
                        className="users-icon-button users-icon-button--muted"
                        onClick={() => onDeactivate(user)}
                        aria-label={`Inactivar usuario ${user.username}`}
                        title="Inactivar"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 18 18 6" />
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="users-icon-button users-icon-button--success"
                        onClick={() => onActivate(user)}
                        aria-label={`Activar usuario ${user.username}`}
                        title="Activar"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      className="users-icon-button users-icon-button--danger"
                      onClick={() => onDelete(user)}
                      aria-label={`Eliminar usuario ${user.username}`}
                      title="Eliminar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}