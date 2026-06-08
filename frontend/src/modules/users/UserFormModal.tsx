// ======================================================
// PATH: src/modules/usuarios/components/UserFormModal.tsx
// Modal de creación y edición de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar formulario para crear o editar usuarios.
 * - Validar campos mínimos antes de guardar.
 * - Mantener una estructura visual consistente con roles y permisos.
 *
 * No debe:
 * - Consultar directamente el backend.
 * - Actualizar listas globales.
 * - Definir reglas de permisos del sistema.
 */

import { useEffect, useMemo, useState } from "react";

import type {
  RoleOptionDto,
  UserDto,
  UserFormMode,
  UserFormValues
} from "./users.types";

export type UserFormModalProps = {
  open: boolean;
  mode: UserFormMode;
  user: UserDto | null;
  roles: RoleOptionDto[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
};

function getInitialValues(user: UserDto | null): UserFormValues {
  return {
    username: user?.username ?? "",
    full_name: user?.full_name ?? "",
    role_id: user?.role_id ? String(user.role_id) : "",
    password: "",
    is_active: user?.is_active ?? true
  };
}

export function UserFormModal({
  open,
  mode,
  user,
  roles,
  saving,
  error,
  onClose,
  onSubmit
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(() => getInitialValues(user));
  const [localError, setLocalError] = useState<string | null>(null);

  const title = mode === "create" ? "Nuevo usuario" : "Editar usuario";
  const submitLabel = mode === "create" ? "Crear usuario" : "Guardar cambios";

  const canSubmit = useMemo(() => {
    const hasUsername = values.username.trim().length >= 3;
    const hasName = values.full_name.trim().length >= 3;
    const hasRole = values.role_id.trim().length > 0;
    const hasPassword =
      mode === "edit" || values.password.trim().length >= 6;

    return hasUsername && hasName && hasRole && hasPassword && !saving;
  }, [mode, saving, values.full_name, values.password, values.role_id, values.username]);

  useEffect(() => {
    if (open) {
      setValues(getInitialValues(user));
      setLocalError(null);
    }
  }, [open, user]);

  if (!open) return null;

  function updateValue<K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K]
  ): void {
    setValues((current) => ({
      ...current,
      [key]: value
    }));
  }

  function handleSubmit(): void {
    const username = values.username.trim();
    const fullName = values.full_name.trim();

    if (username.length < 3) {
      setLocalError("El usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (fullName.length < 3) {
      setLocalError("El nombre completo debe tener al menos 3 caracteres.");
      return;
    }

    if (!values.role_id) {
      setLocalError("Selecciona un rol para el usuario.");
      return;
    }

    if (mode === "create" && values.password.trim().length < 6) {
      setLocalError("La contraseña temporal debe tener al menos 6 caracteres.");
      return;
    }

    setLocalError(null);
    onSubmit({
      ...values,
      username,
      full_name: fullName,
      password: values.password.trim()
    });
  }

  return (
    <div className="users-modal-backdrop" role="presentation">
      <section
        className="users-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="users-modal-title"
      >
        <header className="users-modal-header">
          <div>
            <p>Administración de usuarios</p>
            <h2 id="users-modal-title">{title}</h2>
          </div>

          <button
            type="button"
            className="users-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="users-modal-body">
          {(error || localError) && (
            <div className="users-alert users-alert--error">
              {localError || error}
            </div>
          )}

          <div className="users-form-grid">
            <label className="users-field">
              <span>Usuario</span>
              <input
                type="text"
                value={values.username}
                onChange={(event) => updateValue("username", event.target.value)}
                placeholder="Ej. wsolis"
                autoComplete="off"
              />
            </label>

            <label className="users-field">
              <span>Nombre completo</span>
              <input
                type="text"
                value={values.full_name}
                onChange={(event) => updateValue("full_name", event.target.value)}
                placeholder="Ej. Wendy Solis"
                autoComplete="off"
              />
            </label>

            <label className="users-field">
              <span>Rol</span>
              <select
                value={values.role_id}
                onChange={(event) => updateValue("role_id", event.target.value)}
              >
                <option value="">Selecciona un rol</option>

                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </label>

            {mode === "create" && (
              <label className="users-field">
                <span>Contraseña temporal</span>
                <input
                  type="password"
                  value={values.password}
                  onChange={(event) => updateValue("password", event.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </label>
            )}

            <div className="users-field users-field--switch">
              <div>
                <span>Usuario activo</span>
                <small>Permite iniciar sesión y operar en el sistema.</small>
              </div>

              <button
                type="button"
                className={
                  values.is_active
                    ? "users-switch users-switch--on"
                    : "users-switch"
                }
                onClick={() => updateValue("is_active", !values.is_active)}
                aria-pressed={values.is_active}
              >
                <span />
              </button>
            </div>
          </div>
        </div>

        <footer className="users-modal-footer">
          <button
            type="button"
            className="users-button users-button--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="users-button users-button--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {saving ? "Guardando..." : submitLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}