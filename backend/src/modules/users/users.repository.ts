// ======================================================
// PATH: backend/src/modules/users/users.repository.ts
// Repositorio de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Ejecutar consultas SQL sobre app_user y app_role.
 * - Encapsular el acceso a PostgreSQL.
 * - Devolver datos tipados al servicio.
 *
 * No debe:
 * - Contener lógica HTTP.
 * - Crear conexiones directas a PostgreSQL.
 * - Definir reglas de negocio de autenticación.
 */

import { db } from "../../config/db.js";

import type {
  CreateUserInput,
  RoleId,
  RoleLookupDto,
  UpdateUserInput,
  UserDto,
  UserId,
  UserListFilters
} from "./users.types.js";

type UserRow = {
  id: number;
  username: string;
  username_normalized: string;
  full_name: string;
  role_id: number | null;
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

type RoleLookupRow = {
  id: number;
  role_key: string;
  role_name: string;
  is_active: boolean;
};

function mapUserRow(row: UserRow): UserDto {
  return {
    id: row.id,
    username: row.username,
    username_normalized: row.username_normalized,
    full_name: row.full_name,
    role_id: row.role_id,
    role_key: row.role_key,
    role_name: row.role_name,
    is_active: row.is_active,
    is_locked: row.is_locked,
    failed_login_attempts: row.failed_login_attempts,
    last_failed_login_at: row.last_failed_login_at,
    locked_at: row.locked_at,
    locked_reason: row.locked_reason,
    password_reset_required: row.password_reset_required,
    password_reset_expires_at: row.password_reset_expires_at,
    password_changed_at: row.password_changed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapRoleLookupRow(row: RoleLookupRow): RoleLookupDto {
  return {
    id: row.id,
    role_key: row.role_key,
    role_name: row.role_name,
    is_active: row.is_active
  };
}

/**
 * Obtiene usuarios con filtros opcionales.
 */
export async function findUsers(
  filters: UserListFilters
): Promise<UserDto[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(`
      (
        u.username ILIKE $${values.length}
        OR u.username_normalized ILIKE $${values.length}
        OR u.full_name ILIKE $${values.length}
        OR COALESCE(r.role_name, '') ILIKE $${values.length}
        OR COALESCE(r.role_key, '') ILIKE $${values.length}
      )
    `);
  }

  if (typeof filters.role_id === "number") {
    values.push(filters.role_id);
    where.push(`u.role_id = $${values.length}`);
  }

  if (typeof filters.is_active === "boolean") {
    values.push(filters.is_active);
    where.push(`u.is_active = $${values.length}`);
  }

  if (typeof filters.is_locked === "boolean") {
    values.push(filters.is_locked);
    where.push(`u.is_locked = $${values.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await db.query<UserRow>(
    `
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
      u.last_failed_login_at,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM app_user u
    LEFT JOIN app_role r
      ON r.id = u.role_id
    ${whereClause}
    ORDER BY
      u.full_name ASC,
      u.username ASC
    `,
    values
  );

  return result.rows.map(mapUserRow);
}

/**
 * Busca un usuario por id.
 */
export async function findUserById(id: UserId): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
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
      u.last_failed_login_at,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM app_user u
    LEFT JOIN app_role r
      ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
    `,
    [id]
  );

  const row = result.rows[0];

  return row ? mapUserRow(row) : null;
}

/**
 * Busca un usuario por username normalizado.
 */
export async function findUserByUsernameNormalized(
  usernameNormalized: string
): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
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
      u.last_failed_login_at,
      u.locked_at,
      u.locked_reason,
      u.password_reset_required,
      u.password_reset_expires_at,
      u.password_changed_at,
      u.created_at,
      u.updated_at
    FROM app_user u
    LEFT JOIN app_role r
      ON r.id = u.role_id
    WHERE u.username_normalized = $1
    LIMIT 1
    `,
    [usernameNormalized]
  );

  const row = result.rows[0];

  return row ? mapUserRow(row) : null;
}

/**
 * Busca un rol activo por id.
 */
export async function findActiveRoleById(
  roleId: RoleId
): Promise<RoleLookupDto | null> {
  const result = await db.query<RoleLookupRow>(
    `
    SELECT
      id,
      role_key,
      role_name,
      is_active
    FROM app_role
    WHERE id = $1
      AND is_active = true
    LIMIT 1
    `,
    [roleId]
  );

  const row = result.rows[0];

  return row ? mapRoleLookupRow(row) : null;
}

/**
 * Crea un usuario.
 */
export async function createUser(
  input: CreateUserInput & {
    username_normalized: string;
    password_hash: string;
    password_reset_required: boolean;
  }
): Promise<UserDto> {
  const result = await db.query<UserRow>(
    `
    INSERT INTO app_user (
      username,
      username_normalized,
      password_hash,
      full_name,
      role_id,
      is_active,
      is_locked,
      failed_login_attempts,
      password_reset_required
    )
    VALUES ($1, $2, $3, $4, $5, $6, false, 0, $7)
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [
      input.username,
      input.username_normalized,
      input.password_hash,
      input.full_name,
      input.role_id ?? null,
      input.is_active ?? true,
      input.password_reset_required
    ]
  );

  return findUserById(result.rows[0].id) as Promise<UserDto>;
}

/**
 * Actualiza los datos principales de un usuario.
 */
export async function updateUser(
  id: UserId,
  input: Required<UpdateUserInput> & {
    username_normalized: string;
  }
): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
    UPDATE app_user
    SET
      username = $2,
      username_normalized = $3,
      full_name = $4,
      role_id = $5,
      is_active = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [
      id,
      input.username,
      input.username_normalized,
      input.full_name,
      input.role_id,
      input.is_active
    ]
  );

  const row = result.rows[0];

  if (!row) return null;

  return findUserById(row.id);
}

/**
 * Cambia estado activo/inactivo.
 */
export async function setUserActiveState(
  id: UserId,
  isActive: boolean
): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
    UPDATE app_user
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [id, isActive]
  );

  const row = result.rows[0];

  if (!row) return null;

  return findUserById(row.id);
}

/**
 * Bloquea manualmente un usuario.
 */
export async function lockUserById(
  id: UserId,
  reason: string
): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
    UPDATE app_user
    SET
      is_locked = true,
      locked_at = NOW(),
      locked_reason = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [id, reason]
  );

  const row = result.rows[0];

  if (!row) return null;

  return findUserById(row.id);
}

/**
 * Desbloquea un usuario y limpia intentos fallidos.
 */
export async function unlockUserById(id: UserId): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
    UPDATE app_user
    SET
      is_locked = false,
      failed_login_attempts = 0,
      last_failed_login_at = NULL,
      locked_at = NULL,
      locked_reason = NULL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [id]
  );

  const row = result.rows[0];

  if (!row) return null;

  return findUserById(row.id);
}

/**
 * Restablece contraseña con un valor temporal.
 */
export async function resetUserPasswordById(
  id: UserId,
  passwordHash: string
): Promise<UserDto | null> {
  const result = await db.query<UserRow>(
    `
    UPDATE app_user
    SET
      password_hash = $2,
      password_reset_required = true,
      password_reset_code_hash = NULL,
      password_reset_expires_at = NULL,
      is_locked = false,
      failed_login_attempts = 0,
      last_failed_login_at = NULL,
      locked_at = NULL,
      locked_reason = NULL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      username,
      username_normalized,
      full_name,
      role_id,
      NULL::text AS role_key,
      NULL::text AS role_name,
      is_active,
      is_locked,
      failed_login_attempts,
      last_failed_login_at,
      locked_at,
      locked_reason,
      password_reset_required,
      password_reset_expires_at,
      password_changed_at,
      created_at,
      updated_at
    `,
    [id, passwordHash]
  );

  const row = result.rows[0];

  if (!row) return null;

  return findUserById(row.id);
}

/**
 * Elimina físicamente un usuario.
 */
export async function deleteUserById(id: UserId): Promise<boolean> {
  const result = await db.query(
    `
    DELETE FROM app_user
    WHERE id = $1
    `,
    [id]
  );

  return Number(result.rowCount) > 0;
}