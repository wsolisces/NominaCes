// ======================================================
// PATH: backend/src/modules/login/login.repository.ts
// Acceso a datos del módulo Login
// ======================================================

import { db } from "../../config/db.js";
import type { AppPermission } from "../permisos/app.permissions.js";
import type {
  LoginUserRecord,
  PasswordResetUserRecord,
  SessionRecord,
  SessionRevokedReason
} from "./login.types.js";

/**
 * Busca un usuario para login usando username_normalized.
 */
export async function findLoginUserByUsernameNormalized(
  usernameNormalized: string
): Promise<LoginUserRecord | null> {
  const result = await db.query<LoginUserRecord>(
    `
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.password_hash,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      r.is_active AS role_is_active,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.password_reset_required
    FROM app_user u
    JOIN app_role r ON r.id = u.role_id
    WHERE u.username_normalized = $1
    LIMIT 1
    `,
    [usernameNormalized]
  );

  return result.rows[0] ?? null;
}

/**
 * Busca un usuario por ID para validar sesiones activas.
 */
export async function findLoginUserById(
  userId: string
): Promise<LoginUserRecord | null> {
  const result = await db.query<LoginUserRecord>(
    `
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.password_hash,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      r.is_active AS role_is_active,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.password_reset_required
    FROM app_user u
    JOIN app_role r ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

/**
 * Obtiene los permisos activos asignados a un rol activo.
 *
 * Reglas:
 * - Solo devuelve permisos registrados y activos.
 * - Solo devuelve permisos de roles activos.
 * - Evita permisos duplicados.
 * - Devuelve un arreglo vacío cuando el rol no tiene asignaciones.
 */
export async function getPermissionsByRoleId(
  roleId: string
): Promise<AppPermission[]> {
  const result = await db.query<{ permission_key: AppPermission }>(
    `
    SELECT DISTINCT
      p.permission_key
    FROM app_role r
    INNER JOIN app_role_permission rp
      ON rp.role_id = r.id
    INNER JOIN app_permission p
      ON p.permission_key = rp.permission_key
    WHERE r.id = $1
      AND r.is_active = TRUE
      AND p.is_active = TRUE
    ORDER BY p.permission_key ASC
    `,
    [roleId]
  );

  return result.rows.map((row) => row.permission_key);
}



/**
 * Reinicia contador de intentos fallidos.
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await db.query(
    `
    UPDATE app_user
    SET
      failed_login_attempts = 0,
      last_failed_login_at = NULL
    WHERE id = $1
    `,
    [userId]
  );
}

/**
 * Registra intento fallido y bloquea al llegar a 3 intentos.
 */
export async function registerFailedLoginAttempt(userId: string): Promise<{
  failedLoginAttempts: number;
  isLocked: boolean;
}> {
  const result = await db.query<{
    failed_login_attempts: number;
    is_locked: boolean;
  }>(
    `
    UPDATE app_user
    SET
      failed_login_attempts = failed_login_attempts + 1,
      last_failed_login_at = NOW(),
      is_locked = CASE
        WHEN failed_login_attempts + 1 >= 3 THEN TRUE
        ELSE is_locked
      END,
      locked_at = CASE
        WHEN failed_login_attempts + 1 >= 3 THEN NOW()
        ELSE locked_at
      END,
      locked_reason = CASE
        WHEN failed_login_attempts + 1 >= 3 THEN 'FAILED_LOGIN_ATTEMPTS'
        ELSE locked_reason
      END
    WHERE id = $1
    RETURNING failed_login_attempts, is_locked
    `,
    [userId]
  );

  const row = result.rows[0];

  return {
    failedLoginAttempts: row?.failed_login_attempts ?? 0,
    isLocked: row?.is_locked ?? false
  };
}

/**
 * Revoca todas las sesiones activas de un usuario.
 */
export async function revokeActiveSessionsByUserId(
  userId: string,
  reason: SessionRevokedReason
): Promise<number> {
  const result = await db.query<{ id: string }>(
    `
    UPDATE app_session
    SET
      revoked_at = NOW(),
      revoked_reason = $2,
      fortia_token_encrypted = ''
    WHERE user_id = $1
      AND revoked_at IS NULL
      AND expires_at > NOW()
    RETURNING id
    `,
    [userId, reason]
  );

  return result.rowCount ?? 0;
}

/**
 * Crea una nueva sesión de usuario.
 */
export async function createSession(input: {
  userId: string;
  sessionTokenHash: string;
  fortiaTokenEncrypted: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<SessionRecord> {
  const result = await db.query<SessionRecord>(
    `
    INSERT INTO app_session (
      user_id,
      session_token_hash,
      fortia_token_encrypted,
      expires_at,
      ip_address,
      user_agent
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )
    RETURNING
      id,
      user_id,
      session_token_hash,
      fortia_token_encrypted,
      expires_at,
      revoked_at
    `,
    [
      input.userId,
      input.sessionTokenHash,
      input.fortiaTokenEncrypted,
      input.expiresAt,
      input.ipAddress ?? null,
      input.userAgent ?? null
    ]
  );

  return result.rows[0];
}

/**
 * Busca una sesión activa por hash del token.
 */
export async function findActiveSessionByTokenHash(
  sessionTokenHash: string
): Promise<SessionRecord | null> {
  const result = await db.query<SessionRecord>(
    `
    SELECT
      id,
      user_id,
      session_token_hash,
      fortia_token_encrypted,
      expires_at,
      revoked_at
    FROM app_session
    WHERE session_token_hash = $1
      AND revoked_at IS NULL
    LIMIT 1
    `,
    [sessionTokenHash]
  );

  return result.rows[0] ?? null;
}

/**
 * Revoca una sesión específica.
 */
export async function revokeSessionById(
  sessionId: string,
  reason: SessionRevokedReason
): Promise<void> {
  await db.query(
    `
    UPDATE app_session
    SET
      revoked_at = NOW(),
      revoked_reason = $2,
      fortia_token_encrypted = ''
    WHERE id = $1
      AND revoked_at IS NULL
    `,
    [sessionId, reason]
  );
}

/**
 * Actualiza last_seen_at de una sesión activa.
 */
export async function touchSession(sessionId: string): Promise<void> {
  await db.query(
    `
    UPDATE app_session
    SET last_seen_at = NOW()
    WHERE id = $1
      AND revoked_at IS NULL
    `,
    [sessionId]
  );
}

/**
 * Busca usuario para creación/restablecimiento de contraseña.
 */
export async function findUserForPasswordReset(
  usernameNormalized: string
): Promise<PasswordResetUserRecord | null> {
  const result = await db.query<PasswordResetUserRecord>(
    `
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      r.is_active AS role_is_active,
      u.is_active,
      u.is_locked,
      u.password_reset_required,
      u.password_reset_code_hash,
      u.password_reset_expires_at
    FROM app_user u
    JOIN app_role r ON r.id = u.role_id
    WHERE u.username_normalized = $1
    LIMIT 1
    `,
    [usernameNormalized]
  );

  return result.rows[0] ?? null;
}

/**
 * Completa el cambio de contraseña con código temporal.
 */
export async function completePasswordReset(input: {
  userId: string;
  passwordHash: string;
}): Promise<void> {
  await db.query(
    `
    UPDATE app_user
    SET
      password_hash = $2,
      password_reset_required = FALSE,
      password_reset_code_hash = NULL,
      password_reset_expires_at = NULL,
      password_changed_at = NOW(),
      failed_login_attempts = 0,
      last_failed_login_at = NULL,
      is_locked = FALSE,
      locked_at = NULL,
      locked_reason = NULL
    WHERE id = $1
    `,
    [input.userId, input.passwordHash]
  );
}

/**
 * Registra auditoría administrativa del cambio de contraseña.
 */
export async function createPasswordResetAudit(input: {
  userId: string;
  username: string;
}): Promise<void> {
  await db.query(
    `
    INSERT INTO app_user_audit (
      user_id,
      action,
      old_data,
      new_data,
      changed_by_user_id
    )
    VALUES (
      $1,
      'CREATE_PASSWORD_WITH_TEMP_CODE',
      NULL,
      jsonb_build_object(
        'username', $2::text,
        'password_reset_required', false,
        'password_changed_at', NOW()
      ),
      NULL
    )
    `,
    [input.userId, input.username]
  );
}