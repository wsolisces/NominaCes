// ======================================================
// PATH: backend\src\modules\users\users.repository.ts
// Acceso a datos del módulo Users
// ======================================================

import { db } from "../../config/db.js";
import type {
  UserAuditAction,
  UserListRow
} from "./users.types.js";

/**
 * Columnas públicas del usuario para mantenimiento.
 *
 * Importante:
 * No se expone password_hash.
 */
const USER_SELECT = `
  SELECT
    u.id,
    u.username,
    u.username_normalized,
    u.full_name,
    u.role_id,
    r.role_key,
    r.role_name,
    u.is_active,
    u.is_locked,
    u.failed_login_attempts,
    u.locked_at,
    u.locked_reason,
    u.password_reset_required,
    u.password_reset_expires_at,
    u.password_changed_at,
    u.created_at,
    u.updated_at
  FROM app_user u
  JOIN app_role r ON r.id = u.role_id
`;

/**
 * Lista usuarios para mantenimiento.
 */
export async function listUsers(): Promise<UserListRow[]> {
  const result = await db.query<UserListRow>(
    `
    ${USER_SELECT}
    ORDER BY u.created_at DESC, u.username ASC
    `
  );

  return result.rows;
}

/**
 * Busca usuario por id.
 */
export async function findUserById(userId: string): Promise<UserListRow | null> {
  const result = await db.query<UserListRow>(
    `
    ${USER_SELECT}
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

/**
 * Busca usuario por username normalizado.
 */
export async function findUserByUsernameNormalized(
  usernameNormalized: string
): Promise<UserListRow | null> {
  const result = await db.query<UserListRow>(
    `
    ${USER_SELECT}
    WHERE u.username_normalized = $1
    LIMIT 1
    `,
    [usernameNormalized]
  );

  return result.rows[0] ?? null;
}

/**
 * Valida que exista un rol activo.
 */
export async function roleExistsActive(roleId: string): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM app_role
      WHERE id = $1
        AND is_active = TRUE
    ) AS exists
    `,
    [roleId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Crea usuario nuevo.
 *
 * El usuario nace:
 * - activo
 * - desbloqueado
 * - con reset pendiente
 * - con código temporal hasheado
 */
export async function createUser(input: {
  username: string;
  usernameNormalized: string;
  fullName: string;
  roleId: string;
  temporaryCodeHash: string;
  temporaryCodeExpiresAt: Date;
}): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH inserted AS (
      INSERT INTO app_user (
        username,
        username_normalized,
        password_hash,
        full_name,
        role_id,
        is_active,
        is_locked,
        failed_login_attempts,
        password_reset_required,
        password_reset_code_hash,
        password_reset_expires_at,
        password_changed_at
      )
      VALUES (
        $1,
        $2,
        '',
        $3,
        $4,
        TRUE,
        FALSE,
        0,
        TRUE,
        $5,
        $6,
        NULL
      )
      RETURNING *
    )
    SELECT
      i.id,
      i.username,
      i.username_normalized,
      i.full_name,
      i.role_id,
      r.role_key,
      r.role_name,
      i.is_active,
      i.is_locked,
      i.failed_login_attempts,
      i.locked_at,
      i.locked_reason,
      i.password_reset_required,
      i.password_reset_expires_at,
      i.password_changed_at,
      i.created_at,
      i.updated_at
    FROM inserted i
    JOIN app_role r ON r.id = i.role_id
    `,
    [
      input.username,
      input.usernameNormalized,
      input.fullName,
      input.roleId,
      input.temporaryCodeHash,
      input.temporaryCodeExpiresAt
    ]
  );

  return result.rows[0];
}

/**
 * Actualiza nombre y rol del usuario.
 */
export async function updateUser(input: {
  userId: string;
  fullName: string;
  roleId: string;
}): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH updated AS (
      UPDATE app_user
      SET
        full_name = $2,
        role_id = $3
      WHERE id = $1
      RETURNING *
    )
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM updated u
    JOIN app_role r ON r.id = u.role_id
    `,
    [input.userId, input.fullName, input.roleId]
  );

  return result.rows[0];
}

/**
 * Activa usuario.
 */
export async function activateUser(userId: string): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH updated AS (
      UPDATE app_user
      SET is_active = TRUE
      WHERE id = $1
      RETURNING *
    )
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM updated u
    JOIN app_role r ON r.id = u.role_id
    `,
    [userId]
  );

  return result.rows[0];
}

/**
 * Desactiva usuario.
 */
export async function deactivateUser(userId: string): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH updated AS (
      UPDATE app_user
      SET is_active = FALSE
      WHERE id = $1
      RETURNING *
    )
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM updated u
    JOIN app_role r ON r.id = u.role_id
    `,
    [userId]
  );

  return result.rows[0];
}

/**
 * Desbloquea usuario.
 *
 * Regla:
 * - limpia bloqueo
 * - reinicia intentos fallidos
 */
export async function unlockUser(userId: string): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH updated AS (
      UPDATE app_user
      SET
        is_locked = FALSE,
        failed_login_attempts = 0,
        last_failed_login_at = NULL,
        locked_at = NULL,
        locked_reason = NULL
      WHERE id = $1
      RETURNING *
    )
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM updated u
    JOIN app_role r ON r.id = u.role_id
    `,
    [userId]
  );

  return result.rows[0];
}

/**
 * Genera nuevo código temporal de reset.
 *
 * El código real no se guarda en BD, solo su hash.
 */
export async function setPasswordResetCode(input: {
  userId: string;
  temporaryCodeHash: string;
  temporaryCodeExpiresAt: Date;
}): Promise<UserListRow> {
  const result = await db.query<UserListRow>(
    `
    WITH updated AS (
      UPDATE app_user
      SET
        password_reset_required = TRUE,
        password_reset_code_hash = $2,
        password_reset_expires_at = $3
      WHERE id = $1
      RETURNING *
    )
    SELECT
      u.id,
      u.username,
      u.username_normalized,
      u.full_name,
      u.role_id,
      r.role_key,
      r.role_name,
      u.is_active,
      u.is_locked,
      u.failed_login_attempts,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM updated u
    JOIN app_role r ON r.id = u.role_id
    `,
    [input.userId, input.temporaryCodeHash, input.temporaryCodeExpiresAt]
  );

  return result.rows[0];
}

/**
 * Inserta bitácora de usuario.
 */
export async function createUserAudit(input: {
  userId: string | null;
  action: UserAuditAction;
  oldData?: unknown;
  newData?: unknown;
  changedByUserId: string;
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
      $2,
      $3::jsonb,
      $4::jsonb,
      $5
    )
    `,
    [
      input.userId,
      input.action,
      input.oldData ? JSON.stringify(input.oldData) : null,
      input.newData ? JSON.stringify(input.newData) : null,
      input.changedByUserId
    ]
  );
}