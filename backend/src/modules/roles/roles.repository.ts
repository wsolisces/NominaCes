// ======================================================
// PATH: backend/src/modules/roles/roles.repository.ts
// Repositorio del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Ejecutar consultas SQL relacionadas con roles.
 * - Mantener aislado el acceso a PostgreSQL.
 * - Devolver datos listos para el servicio.
 *
 * No debe:
 * - Conocer objetos Request/Response de Express.
 * - Tomar decisiones visuales.
 * - Saltarse reglas de negocio definidas en el servicio.
 */

import type { PoolClient } from "pg";

import { db } from "../../config/db.js";

import type {
  RoleAuditRow,
  RoleDetail,
  RoleListFilters,
  RolePermissionGroup,
  RolePermissionRow,
  RoleRow,
  RoleUserRow,
} from "./roles.types.js";

/**
 * Ejecuta operaciones dentro de una transacción.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lista roles con conteo de usuarios y permisos activos asignados.
 */
export async function findRoles(filters: RoleListFilters): Promise<RoleRow[]> {
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(`
      (
        r.role_name ILIKE $${values.length}
        OR r.role_key ILIKE $${values.length}
        OR COALESCE(r.description, '') ILIKE $${values.length}
      )
    `);
  }

  if (filters.status === "ACTIVE") {
    conditions.push("r.is_active = true");
  }

  if (filters.status === "INACTIVE") {
    conditions.push("r.is_active = false");
  }

  const whereSql =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await db.query<RoleRow>(
    `
    SELECT
      r.id::text,
      r.role_key,
      r.role_name,
      r.description,
      r.is_active,
      r.is_system,
      r.is_protected,
      r.created_at::text,
      r.updated_at::text,
      COUNT(DISTINCT u.id)::int AS users_count,
      COUNT(DISTINCT CASE WHEN p.is_active = true THEN rp.permission_key END)::int AS permissions_count
    FROM app_role r
    LEFT JOIN app_user u
      ON u.role_id = r.id
    LEFT JOIN app_role_permission rp
      ON rp.role_id = r.id
    LEFT JOIN app_permission p
      ON p.permission_key = rp.permission_key
    ${whereSql}
    GROUP BY r.id
    ORDER BY
      r.is_protected DESC,
      r.role_name ASC
    `,
    values
  );

  return result.rows;
}

/**
 * Busca un rol por ID.
 */
export async function findRoleById(
  roleId: string,
  client?: PoolClient
): Promise<RoleRow | null> {
  const executor = client ?? db;

  const result = await executor.query<RoleRow>(
    `
    SELECT
      r.id::text,
      r.role_key,
      r.role_name,
      r.description,
      r.is_active,
      r.is_system,
      r.is_protected,
      r.created_at::text,
      r.updated_at::text,
      COUNT(DISTINCT u.id)::int AS users_count,
      COUNT(DISTINCT CASE WHEN p.is_active = true THEN rp.permission_key END)::int AS permissions_count
    FROM app_role r
    LEFT JOIN app_user u
      ON u.role_id = r.id
    LEFT JOIN app_role_permission rp
      ON rp.role_id = r.id
    LEFT JOIN app_permission p
      ON p.permission_key = rp.permission_key
    WHERE r.id = $1
    GROUP BY r.id
    `,
    [roleId]
  );

  return result.rows[0] ?? null;
}

/**
 * Valida si ya existe un nombre de rol.
 */
export async function roleNameExists(
  roleName: string,
  excludeRoleId?: string,
  client?: PoolClient
): Promise<boolean> {
  const executor = client ?? db;
  const values: unknown[] = [roleName.trim()];
  let excludeSql = "";

  if (excludeRoleId) {
    values.push(excludeRoleId);
    excludeSql = `AND id <> $${values.length}`;
  }

  const result = await executor.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM app_role
      WHERE LOWER(role_name) = LOWER($1)
      ${excludeSql}
    ) AS exists
    `,
    values
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Valida si ya existe una clave de rol.
 */
export async function roleKeyExists(
  roleKey: string,
  excludeRoleId?: string,
  client?: PoolClient
): Promise<boolean> {
  const executor = client ?? db;
  const values: unknown[] = [roleKey.trim()];
  let excludeSql = "";

  if (excludeRoleId) {
    values.push(excludeRoleId);
    excludeSql = `AND id <> $${values.length}`;
  }

  const result = await executor.query<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1
      FROM app_role
      WHERE role_key = $1
      ${excludeSql}
    ) AS exists
    `,
    values
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Crea un rol normal activo.
 */
export async function createRole(
  input: {
    role_key: string;
    role_name: string;
    description: string | null;
  },
  client: PoolClient
): Promise<RoleRow> {
  const result = await client.query<RoleRow>(
    `
    INSERT INTO app_role (
      role_key,
      role_name,
      description,
      is_active,
      is_system,
      is_protected
    )
    VALUES ($1, $2, $3, true, false, false)
    RETURNING
      id::text,
      role_key,
      role_name,
      description,
      is_active,
      is_system,
      is_protected,
      created_at::text,
      updated_at::text,
      0::int AS users_count,
      0::int AS permissions_count
    `,
    [input.role_key, input.role_name, input.description]
  );

  return result.rows[0];
}

/**
 * Actualiza datos visibles de un rol.
 */
export async function updateRoleData(
  roleId: string,
  input: {
    role_name: string;
    description: string | null;
  },
  client: PoolClient
): Promise<RoleRow> {
  const result = await client.query<RoleRow>(
    `
    UPDATE app_role
    SET
      role_name = $2,
      description = $3,
      updated_at = now()
    WHERE id = $1
    RETURNING
      id::text,
      role_key,
      role_name,
      description,
      is_active,
      is_system,
      is_protected,
      created_at::text,
      updated_at::text,
      0::int AS users_count,
      0::int AS permissions_count
    `,
    [roleId, input.role_name, input.description]
  );

  return result.rows[0];
}

/**
 * Reemplaza permisos activos asignados al rol.
 */
export async function replaceRolePermissions(
  roleId: string,
  permissionKeys: string[],
  actorUserId: string | null,
  client: PoolClient
): Promise<void> {
  await client.query(
    `
    DELETE FROM app_role_permission
    WHERE role_id = $1
    `,
    [roleId]
  );

  if (permissionKeys.length === 0) return;

  await client.query(
    `
    INSERT INTO app_role_permission (
      role_id,
      permission_key,
      granted_at,
      granted_by_user_id
    )
    SELECT
      $1,
      p.permission_key,
      now(),
      $3
    FROM app_permission p
    WHERE p.permission_key = ANY($2::varchar[])
      AND p.is_active = true
    ON CONFLICT (role_id, permission_key)
    DO NOTHING
    `,
    [roleId, permissionKeys, actorUserId]
  );
}

/**
 * Lista permisos activos para edición de rol.
 */
export async function findActivePermissionsForRoleEdit(
  roleId: string
): Promise<RolePermissionRow[]> {
  const result = await db.query<RolePermissionRow>(
    `
    SELECT
      p.permission_key,
      p.permission_name,
      p.module_key,
      p.module_name,
      p.description,
      p.is_active,
      (rp.permission_key IS NOT NULL) AS assigned
    FROM app_permission p
    LEFT JOIN app_role_permission rp
      ON rp.permission_key = p.permission_key
     AND rp.role_id = $1
    WHERE p.is_active = true
    ORDER BY p.module_key, p.permission_name
    `,
    [roleId]
  );

  return result.rows;
}

/**
 * Lista usuarios asignados a un rol.
 */
export async function findUsersByRole(roleId: string): Promise<RoleUserRow[]> {
  const result = await db.query<RoleUserRow>(
    `
    SELECT
      id::text,
      username,
      full_name,
      is_active,
      inactive_reason,
      is_locked
    FROM app_user
    WHERE role_id = $1
    ORDER BY full_name, username
    `,
    [roleId]
  );

  return result.rows;
}

/**
 * Cambia estado activo/inactivo de rol.
 */
export async function setRoleActive(
  roleId: string,
  isActive: boolean,
  client: PoolClient
): Promise<RoleRow> {
  const result = await client.query<RoleRow>(
    `
    UPDATE app_role
    SET
      is_active = $2,
      updated_at = now()
    WHERE id = $1
    RETURNING
      id::text,
      role_key,
      role_name,
      description,
      is_active,
      is_system,
      is_protected,
      created_at::text,
      updated_at::text,
      0::int AS users_count,
      0::int AS permissions_count
    `,
    [roleId, isActive]
  );

  return result.rows[0];
}

/**
 * Inactiva usuarios activos que tienen el rol apagado.
 */
export async function inactivateUsersByRole(
  input: {
    roleId: string;
    reason: string;
    actorUserId: string | null;
  },
  client: PoolClient
): Promise<number> {
  const result = await client.query(
    `
    UPDATE app_user
    SET
      is_active = false,
      inactive_reason = 'ROLE_INACTIVE',
      inactive_reason_detail = $2,
      inactive_role_id = $1,
      inactivated_at = now(),
      inactivated_by_user_id = $3,
      updated_at = now()
    WHERE role_id = $1
      AND is_active = true
    `,
    [input.roleId, input.reason, input.actorUserId]
  );

  return result.rowCount ?? 0;
}

/**
 * Inserta auditoría del rol.
 */
export async function insertRoleAudit(
  input: {
    roleId: string | null;
    action: string;
    oldData: unknown;
    newData: unknown;
    changedByUserId: string | null;
    reason?: string | null;
  },
  client: PoolClient
): Promise<void> {
  await client.query(
    `
    INSERT INTO app_role_audit (
      role_id,
      action,
      old_data,
      new_data,
      changed_by_user_id,
      reason
    )
    VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
    `,
    [
      input.roleId,
      input.action,
      JSON.stringify(input.oldData ?? null),
      JSON.stringify(input.newData ?? null),
      input.changedByUserId,
      input.reason ?? null,
    ]
  );
}

/**
 * Consulta auditoría de un rol.
 */
export async function findRoleAudit(roleId: string): Promise<RoleAuditRow[]> {
  const result = await db.query<RoleAuditRow>(
    `
    SELECT
      a.id::text,
      a.role_id::text,
      a.action,
      a.old_data,
      a.new_data,
      a.reason,
      a.changed_by_user_id::text,
      u.username AS changed_by_username,
      a.changed_at::text
    FROM app_role_audit a
    LEFT JOIN app_user u
      ON u.id = a.changed_by_user_id
    WHERE a.role_id = $1
    ORDER BY a.changed_at DESC, a.id DESC
    `,
    [roleId]
  );

  return result.rows;
}

/**
 * Consulta detalle completo de rol.
 */
export async function findRoleDetail(roleId: string): Promise<RoleDetail | null> {
  const role = await findRoleById(roleId);

  if (!role) return null;

  const [permissions, users] = await Promise.all([
    findActivePermissionsForRoleEdit(roleId),
    findUsersByRole(roleId),
  ]);

  const groupedPermissions = permissions.reduce<RolePermissionGroup[]>(
    (groups, permission) => {
      const moduleName = permission.module_name ?? permission.module_key;

      const existingGroup = groups.find(
        (group) => group.module_key === permission.module_key
      );

      if (existingGroup) {
        existingGroup.permissions.push(permission);
        return groups;
      }

      groups.push({
        module_key: permission.module_key,
        module_name: moduleName,
        permissions: [permission],
      });

      return groups;
    },
    []
  );

  return {
    ...role,
    permissions: groupedPermissions,
    users,
  };
}