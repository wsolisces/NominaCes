// ======================================================
// PATH: backend/src/modules/users/users.types.ts
// Tipos del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos internos del módulo de usuarios.
 * - Centralizar tipos usados por controller, service y repository.
 * - Mantener compatibilidad con app_user y app_role.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Contener lógica HTTP.
 * - Contener reglas de negocio complejas.
 */

export type UserId = number;
export type RoleId = number;

export type UserDto = {
  id: UserId;
  username: string;
  username_normalized: string;
  full_name: string;
  role_id: RoleId | null;
  role_key: string | null;
  role_name: string | null;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_failed_login_at: Date | null;
  locked_at: Date | null;
  locked_reason: string | null;
  password_reset_required: boolean;
  password_reset_expires_at: Date | null;
  password_changed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type UserListFilters = {
  search?: string;
  role_id?: number;
  is_active?: boolean;
  is_locked?: boolean;
};

export type CreateUserInput = {
  username: string;
  full_name: string;
  role_id?: number | null;
  password?: string;
  is_active?: boolean;
};

export type UpdateUserInput = {
  username?: string;
  full_name?: string;
  role_id?: number | null;
  is_active?: boolean;
};

export type UserMutationResult = {
  user: UserDto;
};

export type ResetUserPasswordResult = {
  user: UserDto;
  temporaryPassword: string;
};

export type RoleLookupDto = {
  id: RoleId;
  role_key: string;
  role_name: string;
  is_active: boolean;
};

export class UserDomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "USER_ERROR") {
    super(message);
    this.name = "UserDomainError";
    this.statusCode = statusCode;
    this.code = code;
  }
}