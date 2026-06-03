// ======================================================
// PATH: src/pages/Users/users.types.ts
// Tipos del módulo de administración de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos usados por la pantalla Usuarios.
 * - Mantener tipos limpios para componentes, API y utilidades.
 * - Evitar que los componentes trabajen con respuestas crudas del backend.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Renderizar componentes.
 * - Contener estilos ni reglas visuales.
 */

export type UserId = string;

export type UserRow = {
  id: UserId;
  username: string;
  full_name: string;
  role_id: string;
  role_key: string;
  role_name: string;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  locked_reason: string | null;
  password_reset_required: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type UserRoleOption = {
  id: string;
  role_key: string;
  role_name: string;
  is_active: boolean;
};

export type CreateUserPayload = {
  username: string;
  fullName: string;
  roleId: string;
};

export type UpdateUserPayload = {
  fullName: string;
  roleId: string;
};

export type UserTemporaryCodeResult = {
  user: {
    id: string;
    username: string;
    full_name: string;
  };
  temporaryCode: string;
  expiresAt: string;
};

export type UserFormMode = "create" | "edit";

export type UserFormState = {
  username: string;
  fullName: string;
  roleId: string;
};

export type UsersPageMessage = {
  type: "success" | "error";
  text: string;
};