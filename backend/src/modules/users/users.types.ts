// ======================================================
// PATH: backend\src\modules\users\users.types.ts
// Tipos centrales del módulo Users
// ======================================================

/**
 * Fila principal de usuario para mantenimiento.
 *
 * No incluye password_hash.
 */
export type UserListRow = {
  id: string;
  username: string;
  username_normalized: string;
  full_name: string;
  role_id: string;
  role_key: string;
  role_name: string;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  locked_at: Date | null;
  locked_reason: string | null;
  password_reset_required: boolean;
  password_reset_expires_at: Date | null;
  password_changed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * Datos para crear usuario.
 *
 * El admin NO captura contraseña.
 * El sistema genera código temporal.
 */
export type CreateUserInput = {
  username: string;
  fullName: string;
  roleId: string;
  changedByUserId: string;
};

/**
 * Datos para editar usuario.
 */
export type UpdateUserInput = {
  userId: string;
  fullName: string;
  roleId: string;
  changedByUserId: string;
};

/**
 * Resultado al crear/resetear usuario.
 *
 * El temporaryCode se muestra una sola vez al administrador.
 * No se guarda en texto claro en BD.
 */
export type UserTemporaryCodeResult = {
  user: UserListRow;
  temporaryCode: string;
  expiresAt: string;
};

/**
 * Resultado común para acciones administrativas.
 */
export type UserActionResult = {
  user: UserListRow;
};

/**
 * Acciones de auditoría del módulo Users.
 */
export type UserAuditAction =
  | "CREATE"
  | "UPDATE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "LOCK"
  | "UNLOCK"
  | "RESET_PASSWORD";