// ======================================================
// PATH: src/pages/Users/UsersPage.tsx
// Página de administración de usuarios
// ======================================================

import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../shared/ui/Modal/Modal";
import "./users-page.css";

/**
 * Usuario mostrado en la tabla administrativa.
 *
 * Este tipo está preparado para el contrato actual del backend
 * y mantiene nombres claros para el frontend.
 */
type UserRow = {
  id: number;
  username: string;
  fullName: string;
  roleName: string;
  roleKey: string;
  isActive: boolean;
  isLocked: boolean;
  passwordResetRequired: boolean;
  failedLoginAttempts: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Rol disponible para asignar a un usuario.
 */
type RoleOption = {
  id: number;
  roleKey: string;
  roleName: string;
  isActive: boolean;
};

/**
 * Estado interno del formulario.
 */
type UserFormState = {
  username: string;
  fullName: string;
  roleId: string;
  isActive: boolean;
};

/**
 * Estado del modal.
 */
type ModalMode = "create" | "edit" | null;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4002";

const EMPTY_FORM: UserFormState = {
  username: "",
  fullName: "",
  roleId: "",
  isActive: true
};

/**
 * Página principal de usuarios.
 *
 * Responsabilidades:
 * - Mostrar usuarios del sistema.
 * - Permitir búsqueda local.
 * - Crear y editar usuarios.
 * - Activar, desactivar, bloquear, desbloquear y solicitar cambio de contraseña.
 *
 * No debe:
 * - Definir estilos globales.
 * - Contener lógica de permisos compleja.
 * - Duplicar componentes reutilizables como modales o botones base.
 */
export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(value) ||
        user.fullName.toLowerCase().includes(value) ||
        user.roleName.toLowerCase().includes(value) ||
        user.roleKey.toLowerCase().includes(value)
      );
    });
  }, [search, users]);

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.isActive).length;
  const lockedUsers = users.filter((user) => user.isLocked).length;
  const resetUsers = users.filter((user) => user.passwordResetRequired).length;

  useEffect(() => {
    void loadInitialData();
  }, []);

  /**
   * Carga usuarios y roles en paralelo.
   */
  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        apiRequest<unknown[]>("/users"),
        apiRequest<unknown[]>("/roles")
      ]);

      setUsers(usersResponse.map(normalizeUser));
      setRoles(rolesResponse.map(normalizeRole).filter((role) => role.isActive));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Abre modal para crear usuario.
   */
  function openCreateModal() {
    setError("");
    setNotice("");
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setModalMode("create");
  }

  /**
   * Abre modal para editar usuario.
   */
  function openEditModal(user: UserRow) {
    const matchingRole = roles.find((role) => role.roleKey === user.roleKey);

    setError("");
    setNotice("");
    setSelectedUser(user);
    setForm({
      username: user.username,
      fullName: user.fullName,
      roleId: matchingRole ? String(matchingRole.id) : "",
      isActive: user.isActive
    });
    setModalMode("edit");
  }

  /**
   * Cierra modal y limpia selección.
   */
  function closeModal() {
    if (saving) {
      return;
    }

    setModalMode(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
  }

  /**
   * Actualiza campos del formulario.
   */
  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  /**
   * Guarda creación o edición de usuario.
   */
  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = form.username.trim();
    const fullName = form.fullName.trim();
    const roleId = Number(form.roleId);

    if (!username || !fullName || !roleId) {
      setError("Captura usuario, nombre completo y rol.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modalMode === "create") {
        await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify({
            username,
            fullName,
            roleId,
            isActive: form.isActive
          })
        });

        setNotice("Usuario creado correctamente.");
      }

      if (modalMode === "edit" && selectedUser) {
        await apiRequest(`/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            username,
            fullName,
            roleId,
            isActive: form.isActive
          })
        });

        setNotice("Usuario actualizado correctamente.");
      }

      closeModal();
      await loadInitialData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  /**
   * Cambia el estado activo/inactivo.
   */
  async function toggleActive(user: UserRow) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: !user.isActive
        })
      });

      setNotice(user.isActive ? "Usuario inhabilitado correctamente." : "Usuario habilitado correctamente.");
      await loadInitialData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  /**
   * Desbloquea un usuario bloqueado por intentos fallidos.
   */
  async function unlockUser(user: UserRow) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/users/${user.id}/unlock`, {
        method: "PATCH"
      });

      setNotice("Usuario desbloqueado correctamente.");
      await loadInitialData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  /**
   * Solicita que el usuario cree o cambie contraseña.
   */
  async function requirePasswordReset(user: UserRow) {
    setError("");
    setNotice("");

    try {
      await apiRequest(`/users/${user.id}/require-password-reset`, {
        method: "PATCH"
      });

      setNotice("Se solicitó cambio de contraseña para el usuario.");
      await loadInitialData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <main className="users-page">
      <section className="users-hero">
        <div>
          <span className="users-eyebrow">Administración</span>
          <h1>Usuarios</h1>
          <p>
            Control de acceso, estado de cuenta, bloqueo y solicitud de cambio de contraseña.
          </p>
        </div>

        <button className="users-primary-button" type="button" onClick={openCreateModal}>
          Nuevo usuario
        </button>
      </section>

      <section className="users-metrics" aria-label="Resumen de usuarios">
        <MetricCard label="Usuarios" value={totalUsers} />
        <MetricCard label="Activos" value={activeUsers} />
        <MetricCard label="Bloqueados" value={lockedUsers} />
        <MetricCard label="Cambio contraseña" value={resetUsers} />
      </section>

      <section className="users-panel">
        <div className="users-toolbar">
          <div>
            <h2>Listado de usuarios</h2>
            <p>Busca por usuario, nombre o rol.</p>
          </div>

          <div className="users-search">
            <input
              type="search"
              value={search}
              placeholder="Buscar usuario..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {error ? <div className="users-alert users-alert-error">{error}</div> : null}
        {notice ? <div className="users-alert users-alert-success">{notice}</div> : null}

        {loading ? (
          <div className="users-empty">Cargando usuarios...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty">No se encontraron usuarios.</div>
        ) : (
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Seguridad</th>
                  <th>Intentos</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.username}</strong>
                    </td>

                    <td>{user.fullName}</td>

                    <td>
                      <span className="users-role">{user.roleName}</span>
                    </td>

                    <td>
                      <StatusBadge active={user.isActive} />
                    </td>

                    <td>
                      <SecurityBadges user={user} />
                    </td>

                    <td>{user.failedLoginAttempts}</td>

                    <td>
                      <div className="users-actions">
                        <button type="button" onClick={() => openEditModal(user)}>
                          Editar
                        </button>

                        <button type="button" onClick={() => toggleActive(user)}>
                          {user.isActive ? "Inhabilitar" : "Habilitar"}
                        </button>

                        {user.isLocked ? (
                          <button type="button" onClick={() => unlockUser(user)}>
                            Desbloquear
                          </button>
                        ) : null}

                        <button type="button" onClick={() => requirePasswordReset(user)}>
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalMode !== null}
        title={modalMode === "create" ? "Nuevo usuario" : "Editar usuario"}
        eyebrow="Usuarios"
        size="md"
        onClose={closeModal}
        footer={
          <>
            <button className="users-secondary-button" type="button" onClick={closeModal} disabled={saving}>
              Cancelar
            </button>

            <button className="users-primary-button" type="submit" form="users-form" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </>
        }
      >
        <form id="users-form" className="users-form" onSubmit={submitForm}>
          <label>
            <span>Usuario</span>
            <input
              value={form.username}
              placeholder="Ej. wsolis"
              autoComplete="off"
              onChange={(event) => updateForm("username", event.target.value)}
            />
          </label>

          <label>
            <span>Nombre completo</span>
            <input
              value={form.fullName}
              placeholder="Nombre del colaborador"
              autoComplete="off"
              onChange={(event) => updateForm("fullName", event.target.value)}
            />
          </label>

          <label>
            <span>Rol</span>
            <select value={form.roleId} onChange={(event) => updateForm("roleId", event.target.value)}>
              <option value="">Selecciona un rol</option>

              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </label>

          <label className="users-check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            <span>Usuario activo</span>
          </label>
        </form>
      </Modal>
    </main>
  );
}

/**
 * Tarjeta simple para métricas superiores.
 */
function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="users-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

/**
 * Badge visual para activo/inactivo.
 */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={active ? "users-badge users-badge-active" : "users-badge users-badge-muted"}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

/**
 * Badges de seguridad del usuario.
 */
function SecurityBadges({ user }: { user: UserRow }) {
  return (
    <div className="users-badge-group">
      {user.isLocked ? (
        <span className="users-badge users-badge-danger">Bloqueado</span>
      ) : (
        <span className="users-badge users-badge-ok">Normal</span>
      )}

      {user.passwordResetRequired ? (
        <span className="users-badge users-badge-warning">Crear contraseña</span>
      ) : null}
    </div>
  );
}

/**
 * Cliente HTTP mínimo para esta página.
 *
 * Usa credentials: include porque el backend trabaja con cookie httpOnly.
 */
async function apiRequest<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(extractApiError(payload) || "No se pudo completar la operación.");
  }

  return payload as T;
}

/**
 * Convierte respuesta JSON sin romper si viene vacía.
 */
async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Normaliza usuarios aunque el backend use snake_case.
 */
function normalizeUser(raw: unknown): UserRow {
  const item = asRecord(raw);

  return {
    id: toNumber(item.id),
    username: toStringValue(item.username),
    fullName: toStringValue(item.fullName ?? item.full_name),
    roleName: toStringValue(item.roleName ?? item.role_name),
    roleKey: toStringValue(item.roleKey ?? item.role_key),
    isActive: toBoolean(item.isActive ?? item.is_active),
    isLocked: toBoolean(item.isLocked ?? item.is_locked),
    passwordResetRequired: toBoolean(item.passwordResetRequired ?? item.password_reset_required),
    failedLoginAttempts: toNumber(item.failedLoginAttempts ?? item.failed_login_attempts),
    createdAt: toOptionalString(item.createdAt ?? item.created_at),
    updatedAt: toOptionalString(item.updatedAt ?? item.updated_at)
  };
}

/**
 * Normaliza roles aunque el backend use snake_case.
 */
function normalizeRole(raw: unknown): RoleOption {
  const item = asRecord(raw);

  return {
    id: toNumber(item.id),
    roleKey: toStringValue(item.roleKey ?? item.role_key),
    roleName: toStringValue(item.roleName ?? item.role_name),
    isActive: toBoolean(item.isActive ?? item.is_active ?? true)
  };
}

/**
 * Extrae mensaje de error del backend.
 */
function extractApiError(payload: unknown): string {
  const item = asRecord(payload);

  return toStringValue(
    item.message ??
      item.error ??
      item.detail ??
      item.reason
  );
}

/**
 * Obtiene mensaje seguro desde errores desconocidos.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

/**
 * Valida objetos planos.
 */
function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

/**
 * Convierte valor desconocido a string.
 */
function toStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "";
}

/**
 * Convierte valor desconocido a string opcional.
 */
function toOptionalString(value: unknown): string | undefined {
  const parsed = toStringValue(value);
  return parsed || undefined;
}

/**
 * Convierte valor desconocido a número.
 */
function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

/**
 * Convierte valor desconocido a boolean.
 */
function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
}