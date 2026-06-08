// ======================================================
// PATH: src/modules/usuarios/usuarios.types.ts
// Tipos del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos usados por la pantalla de usuarios.
 * - Mantener separados los DTO del backend y los payloads del frontend.
 * - Centralizar tipos reutilizables para tabla, formularios y API.
 *
 * No debe:
 * - Consultar servicios.
 * - Renderizar componentes.
 * - Contener reglas visuales.
 */

export type UserDto = {
  id: number;
  username: string;
  username_normalized?: string | null;
  full_name: string;
  role_id: number | null;
  role_key?: string | null;
  role_name?: string | null;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts?: number;
  password_reset_required?: boolean;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RoleOptionDto = {
  id: number;
  role_key: string;
  role_name: string;
  is_active: boolean;
};

export type CreateUserPayload = {
  username: string;
  full_name: string;
  role_id: number | null;
  password?: string;
  is_active: boolean;
};

export type UpdateUserPayload = {
  username: string;
  full_name: string;
  role_id: number | null;
  is_active: boolean;
};

export type UserFormMode = "create" | "edit";

export type UserFormValues = {
  username: string;
  full_name: string;
  role_id: string;
  password: string;
  is_active: boolean;
};

export type UserStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "LOCKED";

export type UserTemporaryCodeResult = {
  user_id?: number;
  userId?: number;
  username?: string;
  userName?: string;
  user_name?: string;
  temporaryCode?: string;
  temporary_code?: string;
  resetCode?: string;
  reset_code?: string;
  code?: string;
  password?: string;
  expiresAt?: string;
  expires_at?: string;
  expiration?: string;
  expires?: string;
};