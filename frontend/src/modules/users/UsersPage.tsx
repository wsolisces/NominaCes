// ======================================================
// PATH: frontend/src/modules/users/UsersPage.tsx
// Pantalla de administración de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar, filtrar y administrar usuarios del sistema.
 * - Conectar tabla, modal y API del módulo.
 * - Mantener usuarios al mismo nivel visual que roles y permisos.
 *
 * No debe:
 * - Definir layout principal.
 * - Duplicar estilos globales.
 * - Manejar autenticación directamente.
 */

import { useEffect, useMemo, useState } from "react";

import {
  activateUserRequest,
  createUserRequest,
  deactivateUserRequest,
  deleteUserRequest,
  getUserRolesRequest,
  getUsersRequest,
  unlockUserRequest,
  updateUserRequest
} from "./users.api";

import { UserFormModal } from "./UserFormModal";
import { UsersTable } from "./UsersTable";

import type {
  RoleOptionDto,
  UserDto,
  UserFormMode,
  UserFormValues,
  UserStatusFilter
} from "./users.types";

import "./users-page.css";

/**
 * Normaliza textos para búsquedas sin distinguir mayúsculas,
 * espacios sobrantes ni acentos.
 */
function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Valida si un usuario cumple con el filtro de estado seleccionado.
 */
function matchesStatusFilter(user: UserDto, filter: UserStatusFilter): boolean {
  if (filter === "ACTIVE") return user.is_active && !user.is_locked;
  if (filter === "INACTIVE") return !user.is_active;
  if (filter === "LOCKED") return user.is_locked;

  return true;
}

/**
 * Convierte el valor seleccionado del rol a número válido.
 * Devuelve null cuando el valor no representa un rol existente.
 */
function getRoleId(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

/**
 * Pantalla principal del módulo de usuarios.
 */
export function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleOptionDto[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<UserFormMode>("create");
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return users.filter((user) => {
      const searchableText = normalizeSearch(
        [
          user.username,
          user.username_normalized,
          user.full_name,
          user.role_key,
          user.role_name
        ]
          .filter(Boolean)
          .join(" ")
      );

      const matchesText =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesText && matchesStatusFilter(user, statusFilter);
    });
  }, [search, statusFilter, users]);

  const counters = useMemo(() => {
    const active = users.filter(
      (user) => user.is_active && !user.is_locked
    ).length;

    const inactive = users.filter((user) => !user.is_active).length;
    const locked = users.filter((user) => user.is_locked).length;

    return {
      total: users.length,
      active,
      inactive,
      locked
    };
  }, [users]);

  /**
   * Carga usuarios y roles disponibles desde el backend.
   */
  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setPageError(null);

      const [usersResponse, rolesResponse] = await Promise.all([
        getUsersRequest(),
        getUserRolesRequest()
      ]);

      setUsers(usersResponse);
      setRoles(rolesResponse);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar la información de usuarios."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  /**
   * Abre el modal en modo creación.
   */
  function openCreateModal(): void {
    setSelectedUser(null);
    setModalMode("create");
    setModalError(null);
    setModalOpen(true);
  }

  /**
   * Abre el modal en modo edición.
   */
  function openEditModal(user: UserDto): void {
    setSelectedUser(user);
    setModalMode("edit");
    setModalError(null);
    setModalOpen(true);
  }

  /**
   * Cierra el modal cuando no existe una operación de guardado activa.
   */
  function closeModal(): void {
    if (saving) return;

    setModalOpen(false);
    setSelectedUser(null);
    setModalError(null);
  }

  /**
   * Crea o actualiza un usuario según el modo actual del modal.
   */
  async function handleSubmit(values: UserFormValues): Promise<void> {
    try {
      setSaving(true);
      setModalError(null);

      const roleId = getRoleId(values.role_id);

      if (modalMode === "create") {
        await createUserRequest({
          username: values.username,
          full_name: values.full_name,
          role_id: roleId,
          password: values.password,
          is_active: values.is_active
        });
      } else if (selectedUser) {
        await updateUserRequest(selectedUser.id, {
          username: values.username,
          full_name: values.full_name,
          role_id: roleId,
          is_active: values.is_active
        });
      }

      setModalOpen(false);
      setSelectedUser(null);

      await loadData();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el usuario."
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Activa un usuario inactivo.
   */
  async function handleActivate(user: UserDto): Promise<void> {
    try {
      setPageError(null);

      await activateUserRequest(user.id);
      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible activar el usuario."
      );
    }
  }

  /**
   * Inactiva un usuario después de confirmar la acción.
   */
  async function handleDeactivate(user: UserDto): Promise<void> {
    const confirmed = window.confirm(
      `¿Seguro que deseas inactivar el usuario "${user.username}" ?`
    );

    if (!confirmed) return;

    try {
      setPageError(null);

      await deactivateUserRequest(user.id);
      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible inactivar el usuario."
      );
    }
  }

  /**
   * Desbloquea un usuario bloqueado por intentos fallidos.
   */
  async function handleUnlock(user: UserDto): Promise<void> {
    try {
      setPageError(null);

      await unlockUserRequest(user.id);
      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible desbloquear el usuario."
      );
    }
  }

  /**
   * Elimina un usuario después de confirmar la acción.
   */
  async function handleDelete(user: UserDto): Promise<void> {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el usuario "${user.username}" ?`
    );

    if (!confirmed) return;

    try {
      setPageError(null);

      await deleteUserRequest(user.id);
      await loadData();
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el usuario."
      );
    }
  }

  return (
    <main className="users-page">
      <section className="users-hero">
        <div>
          <p className="users-kicker">Administración</p>
          <h1>Usuarios</h1>
          <span>
            Administra accesos, roles, estados y desbloqueos de usuarios del
            sistema.
          </span>
        </div>

        <button
          type="button"
          className="users-button users-button--primary"
          onClick={openCreateModal}
        >
          Nuevo usuario
        </button>
      </section>

      {pageError && (
        <div className="users-alert users-alert--error">{pageError}</div>
      )}

      <section className="users-summary-grid">
        <article className="users-summary-card">
          <span>Total</span>
          <strong>{counters.total}</strong>
        </article>

        <article className="users-summary-card">
          <span>Activos</span>
          <strong>{counters.active}</strong>
        </article>

        <article className="users-summary-card">
          <span>Inactivos</span>
          <strong>{counters.inactive}</strong>
        </article>

        <article className="users-summary-card">
          <span>Bloqueados</span>
          <strong>{counters.locked}</strong>
        </article>
      </section>

      <section className="users-toolbar">
        <label className="users-search">
          <span>Buscar</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por usuario, nombre o rol..."
          />
        </label>

        <label className="users-filter">
          <span>Estado</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as UserStatusFilter)
            }
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="LOCKED">Bloqueados</option>
          </select>
        </label>
      </section>

      <UsersTable
        users={filteredUsers}
        loading={loading}
        onEdit={openEditModal}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onUnlock={handleUnlock}
        onDelete={handleDelete}
      />

      <UserFormModal
        open={modalOpen}
        mode={modalMode}
        user={selectedUser}
        roles={roles}
        saving={saving}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </main>
  );
}

export default UsersPage;