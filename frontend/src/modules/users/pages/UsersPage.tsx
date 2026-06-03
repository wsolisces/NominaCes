// ======================================================
// PATH: frontend/src/pages/Users/UsuariosPage.tsx
// Pantalla corporativa de administración de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Cargar usuarios y roles.
 * - Coordinar búsqueda, formularios y acciones administrativas.
 * - Delegar tabla, formularios y modales a componentes específicos.
 * - Usar componentes reutilizables desde shared/ui.
 *
 * No debe:
 * - Definir estilos inline.
 * - Duplicar componentes base del sistema.
 * - Mostrar hashes, tokens, cookies ni información sensible.
 * - Renderizar directamente la tabla genérica del sistema; eso corresponde a UsersTable.
 */

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Button, InputField, type SelectOption } from "../../shared/ui";

import {
  activateUser,
  createUser,
  deactivateUser,
  getRoles,
  getUsers,
  resetUserPassword,
  unlockUser,
  updateUser
} from "./users.api";

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFormMode,
  UserFormState,
  UserRoleOption,
  UserRow,
  UserTemporaryCodeResult,
  UsersPageMessage
} from "./users.types";

import {
  filterUsers,
  getFriendlyError,
  sortUsersForAdmin
} from "./users.utils";

import { TemporaryPasswordModal } from "./components/TemporaryPasswordModal";
import { UserFormModal } from "./components/UserFormModal";
import { UsersTable } from "./components/UsersTable";

import "./UsuariosPage.css";

const EMPTY_FORM: UserFormState = {
  username: "",
  fullName: "",
  roleId: ""
};

/**
 * Normaliza el formulario para evitar guardar espacios innecesarios.
 */
function normalizeUserForm(form: UserFormState): UserFormState {
  return {
    username: form.username.trim(),
    fullName: form.fullName.trim(),
    roleId: form.roleId
  };
}

/**
 * Valida los datos capturados antes de enviarlos al backend.
 */
function validateUserForm(
  mode: UserFormMode,
  form: UserFormState
): string | null {
  const normalized = normalizeUserForm(form);

  if (mode === "create" && !normalized.username) {
    return "El usuario es obligatorio.";
  }

  if (!normalized.fullName) {
    return "El nombre completo es obligatorio.";
  }

  if (!normalized.roleId) {
    return "El rol es obligatorio.";
  }

  return null;
}

/**
 * Pantalla principal de Usuarios.
 */
export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<UserRoleOption[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<UsersPageMessage | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<UserFormMode>("create");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const [temporaryResult, setTemporaryResult] =
    useState<UserTemporaryCodeResult | null>(null);

  const roleOptions = useMemo<SelectOption[]>(() => {
    return roles.map((role) => ({
      value: role.id,
      label: role.role_name
    }));
  }, [roles]);

  const visibleUsers = useMemo(() => {
    return sortUsersForAdmin(filterUsers(users, search));
  }, [users, search]);

  const summary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      inactive: users.filter((user) => !user.is_active).length,
      locked: users.filter((user) => user.is_locked).length,
      pendingPassword: users.filter((user) => user.password_reset_required)
        .length
    };
  }, [users]);

  /**
   * Carga usuarios y roles.
   */
  async function loadInitialData(): Promise<void> {
    setLoading(true);
    setMessage(null);

    try {
      const [usersResult, rolesResult] = await Promise.all([
        getUsers(),
        getRoles()
      ]);

      setUsers(usersResult);
      setRoles(rolesResult);
    } catch (error) {
      setUsers([]);
      setRoles([]);
      setMessage({
        type: "error",
        text: getFriendlyError(error)
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Recarga únicamente usuarios después de una acción administrativa.
   */
  async function reloadUsers(): Promise<void> {
    const usersResult = await getUsers();
    setUsers(usersResult);
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  /**
   * Abre el modal para crear usuario.
   */
  function openCreateModal(): void {
    if (actionLoading) return;

    setFormMode("create");
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setMessage(null);
    setFormOpen(true);
  }

  /**
   * Abre el modal para editar usuario.
   */
  function openEditModal(user: UserRow): void {
    if (actionLoading) return;

    setFormMode("edit");
    setSelectedUser(user);
    setForm({
      username: user.username,
      fullName: user.full_name,
      roleId: user.role_id
    });
    setMessage(null);
    setFormOpen(true);
  }

  /**
   * Cierra el modal de formulario y limpia estado temporal.
   */
  function closeFormModal(): void {
    if (actionLoading) return;

    setFormOpen(false);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
  }

  /**
   * Actualiza campos controlados del formulario.
   */
  function updateFormField(field: keyof UserFormState, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  /**
   * Guarda un usuario nuevo o actualiza uno existente.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationError = validateUserForm(formMode, form);

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError
      });
      return;
    }

    const normalizedForm = normalizeUserForm(form);

    setActionLoading(true);
    setMessage(null);

    try {
      if (formMode === "create") {
        const payload: CreateUserPayload = {
          username: normalizedForm.username,
          fullName: normalizedForm.fullName,
          roleId: normalizedForm.roleId
        };

        const result = await createUser(payload);

        setTemporaryResult(result);
        setMessage({
          type: "success",
          text: "Usuario creado correctamente."
        });
      }

      if (formMode === "edit") {
        if (!selectedUser) {
          throw new Error("No se encontró el usuario seleccionado.");
        }

        const payload: UpdateUserPayload = {
          fullName: normalizedForm.fullName,
          roleId: normalizedForm.roleId
        };

        await updateUser(selectedUser.id, payload);

        setMessage({
          type: "success",
          text: "Usuario actualizado correctamente."
        });
      }

      await reloadUsers();

      setFormOpen(false);
      setSelectedUser(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      setMessage({
        type: "error",
        text: getFriendlyError(error)
      });
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Ejecuta acciones administrativas simples y recarga usuarios.
   */
  async function runUserAction(
    action: () => Promise<unknown>,
    successText: string
  ): Promise<void> {
    if (actionLoading) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await action();
      await reloadUsers();

      setMessage({
        type: "success",
        text: successText
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getFriendlyError(error)
      });
    } finally {
      setActionLoading(false);
    }
  }

  /**
   * Genera código temporal para que el usuario cree o restablezca contraseña.
   */
  async function handleResetPassword(user: UserRow): Promise<void> {
    if (actionLoading) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const result = await resetUserPassword(user.id);

      setTemporaryResult(result);
      await reloadUsers();

      setMessage({
        type: "success",
        text: "Código temporal generado correctamente."
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getFriendlyError(error)
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="users-page">
      <header className="users-header">
        <div className="users-header__content">
          <span className="users-header__eyebrow">
            Administración / Seguridad
          </span>

          <h1 className="users-header__title">Usuarios</h1>

          <p className="users-header__description">
            Administra accesos, roles, estado de cuentas y códigos temporales
            de contraseña.
          </p>
        </div>

        <div className="users-header__actions">
          <Button onClick={openCreateModal} disabled={loading || actionLoading}>
            Nuevo usuario
          </Button>
        </div>
      </header>

      <section className="users-kpis" aria-label="Resumen de usuarios">
        <article className="users-kpi">
          <span className="users-kpi__label">Total</span>
          <strong className="users-kpi__value">{summary.total}</strong>
        </article>

        <article className="users-kpi">
          <span className="users-kpi__label">Activos</span>
          <strong className="users-kpi__value">{summary.active}</strong>
        </article>

        <article className="users-kpi">
          <span className="users-kpi__label">Inactivos</span>
          <strong className="users-kpi__value">{summary.inactive}</strong>
        </article>

        <article className="users-kpi">
          <span className="users-kpi__label">Bloqueados</span>
          <strong className="users-kpi__value">{summary.locked}</strong>
        </article>

        <article className="users-kpi">
          <span className="users-kpi__label">Pendientes clave</span>
          <strong className="users-kpi__value">
            {summary.pendingPassword}
          </strong>
        </article>
      </section>

      <section className="users-panel">
        <div className="users-toolbar">
          <div className="users-toolbar__search">
            <InputField
              label="Buscar"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por usuario, nombre, rol o estado..."
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => void loadInitialData()}
            disabled={loading || actionLoading}
          >
            Actualizar
          </Button>
        </div>

        {message && (
          <div
            className={`users-alert users-alert--${message.type}`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.text}
          </div>
        )}

        <UsersTable
          users={visibleUsers}
          loading={loading}
          actionLoading={actionLoading}
          onEdit={openEditModal}
          onActivate={(user) =>
            void runUserAction(
              () => activateUser(user.id),
              "Usuario activado correctamente."
            )
          }
          onDeactivate={(user) =>
            void runUserAction(
              () => deactivateUser(user.id),
              "Usuario desactivado correctamente."
            )
          }
          onUnlock={(user) =>
            void runUserAction(
              () => unlockUser(user.id),
              "Cuenta desbloqueada correctamente."
            )
          }
          onResetPassword={(user) => void handleResetPassword(user)}
        />
      </section>

      <UserFormModal
        open={formOpen}
        mode={formMode}
        form={form}
        roleOptions={roleOptions}
        loading={actionLoading}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        onChangeField={updateFormField}
      />

      <TemporaryPasswordModal
        result={temporaryResult}
        onClose={() => setTemporaryResult(null)}
      />
    </section>
  );
}