// ======================================================
// PATH: frontend/src/pages/Users/components/UsersTable.tsx
// Tabla de usuarios usando Table reutilizable
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar usuarios en una tabla corporativa reutilizable.
 * - Definir columnas, estados visuales y acciones administrativas.
 * - Usar el componente shared/ui/Table sin duplicar tablas manuales.
 *
 * No debe:
 * - Cargar usuarios desde API.
 * - Ejecutar lógica de negocio directamente.
 * - Abrir modales de formulario por sí mismo.
 * - Mostrar datos sensibles como hashes, tokens o cookies.
 */

import { Button, Table, type TableColumn } from "../../../shared/ui";
import type { UserRow } from "../users.types";

export type UsersTableProps = {
  users: UserRow[];
  loading: boolean;
  actionLoading: boolean;
  onEdit: (user: UserRow) => void;
  onActivate: (user: UserRow) => void;
  onDeactivate: (user: UserRow) => void;
  onUnlock: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
};

type UserTableRow = UserRow & Record<string, unknown>;

/**
 * Obtiene el estado principal de la cuenta.
 */
function getAccountStatusLabel(user: UserRow): string {
  return user.is_active ? "Activo" : "Inactivo";
}

/**
 * Obtiene el estado de seguridad de la cuenta.
 */
function getSecurityStatusLabel(user: UserRow): string {
  if (user.is_locked) return "Bloqueado";
  if (user.password_reset_required) return "Crear contraseña";
  return "Normal";
}

/**
 * Clase visual para badges de estado.
 */
function getStatusClassName(
  status: "active" | "inactive" | "locked" | "pending" | "normal"
): string {
  return `users-status users-status--${status}`;
}

/**
 * Normaliza usuarios para cumplir el contrato genérico de Table.
 */
function toTableRows(users: UserRow[]): UserTableRow[] {
  return users.map((user) => ({
    ...user,
    security_status: getSecurityStatusLabel(user)
  }));
}

/**
 * Tabla administrativa de usuarios.
 */
export function UsersTable({
  users,
  loading,
  actionLoading,
  onEdit,
  onActivate,
  onDeactivate,
  onUnlock,
  onResetPassword
}: UsersTableProps) {
  const rows = toTableRows(users);

  const columns: TableColumn<UserTableRow>[] = [
    {
      key: "username",
      title: "Usuario",
      width: "190px",
      render: (row) => (
        <div className="users-table-user">
          <strong>{String(row.username ?? "")}</strong>
          <span>ID {String(row.id ?? "")}</span>
        </div>
      )
    },
    {
      key: "full_name",
      title: "Nombre",
      render: (row) => (
        <span className="users-table-name">
          {String(row.full_name ?? "")}
        </span>
      )
    },
    {
      key: "role_name",
      title: "Rol",
      width: "190px",
      render: (row) => (
        <span className="users-role-pill">
          {String(row.role_name ?? "Sin rol")}
        </span>
      )
    },
    {
      key: "is_active",
      title: "Estado",
      width: "140px",
      align: "center",
      render: (row) => {
        const status = row.is_active ? "active" : "inactive";

        return (
          <span className={getStatusClassName(status)}>
            {getAccountStatusLabel(row)}
          </span>
        );
      }
    },
    {
      key: "security_status",
      title: "Seguridad",
      width: "180px",
      align: "center",
      render: (row) => {
        if (row.is_locked) {
          return (
            <span className={getStatusClassName("locked")}>
              Bloqueado
            </span>
          );
        }

        if (row.password_reset_required) {
          return (
            <span className={getStatusClassName("pending")}>
              Crear contraseña
            </span>
          );
        }

        return (
          <span className={getStatusClassName("normal")}>
            Normal
          </span>
        );
      }
    },
    {
      key: "actions",
      title: "Acciones",
      width: "340px",
      align: "right",
      sortable: false,
      searchable: false,
      render: (row) => (
        <div className="users-table-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(row)}
            disabled={actionLoading}
          >
            Editar
          </Button>

          {row.is_active ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDeactivate(row)}
              disabled={actionLoading}
            >
              Desactivar
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onActivate(row)}
              disabled={actionLoading}
            >
              Activar
            </Button>
          )}

          {row.is_locked && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUnlock(row)}
              disabled={actionLoading}
            >
              Desbloquear
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onResetPassword(row)}
            disabled={actionLoading}
          >
            Código
          </Button>
        </div>
      )
    }
  ];

  return (
    <Table
      tableId="users-admin"
      columns={columns}
      rows={rows}
      loading={loading}
      emptyMessage="No hay usuarios para mostrar."
      searchable={false}
      configurableColumns={false}
      exportable={false}
      paginated
      showPageSize={false}
      showCount={false}
      showTotals={false}
      variant="simple"
      density="comfortable"
      minWidth="980px"
      maxHeight="520px"
    />
  );
}