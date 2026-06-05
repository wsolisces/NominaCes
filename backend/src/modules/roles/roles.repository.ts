// ======================================================
// PATH: backend/src/modules/roles/roles.repository.ts
// Acceso a datos del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Consultar roles.
 * - Crear roles.
 * - Actualizar roles.
 * - Activar y desactivar roles.
 * - Eliminar roles sin usuarios asignados.
 * - Reemplazar permisos asignados a un rol.
 *
 * Tablas utilizadas:
 * - app_role
 * - app_user
 * - app_permission
 * - app_role_permission
 *
 * No debe:
 * - Validar datos HTTP.
 * - Aplicar reglas de negocio.
 * - Construir respuestas para Express.
 */

import type { PoolClient } from "pg";

import { db } from "../../config/db.js";

import type {
  NormalizedCreateRoleInput,
  NormalizedUpdateRoleInput,
  RoleRow
} from "./roles.types.js";

/**
 * Consulta base utilizada para obtener roles con sus permisos.
 */
const ROLE_SELECT = `
  SELECT
    r.id,
    r.role_key,
    r.role_name,
    r.description,
    r.is_active,
    r.created_at,
    r.updated_at,
    COALESCE(
      ARRAY_REMOVE(
        ARRAY_AGG(
          p.permission_key
          ORDER BY p.permission_key
        ),
        NULL
      ),
      '{}'
    ) AS permissions
  FROM app_role r
  LEFT JOIN app_role_permission rp
    ON rp.role_id = r.id
  LEFT JOIN app_permission p
    ON p.permission_key = rp.permission_key
`;

/**
 * Convierte los permisos agregados por PostgreSQL a un arreglo seguro.
 */
function safePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(String);
}

/**
 * Normaliza una fila obtenida desde PostgreSQL.
 */
function mapRoleRow(row: RoleRow): RoleRow {
  return {
    ...row,
    id: Number(row.id),
    permissions: safePermissions(row.permissions)
  };
}

/**
 * Devuelve el cliente recibido o el pool general.
 */
function getExecutor(client?: PoolClient): PoolClient | typeof db {
  return client ?? db;
}

/**
 * Lista todos los roles registrados.
 */
export async function findRoles(): Promise<RoleRow[]> {
  const result = await db.query<RoleRow>(
    `
    ${ROLE_SELECT}
    GROUP BY r.id
    ORDER BY r.role_name ASC, r.id ASC
    `
  );

  return result.rows.map(mapRoleRow);
}

/**
 * Busca un rol mediante su ID.
 */
export async function findRoleById(
  id: number,
  client?: PoolClient
): Promise<RoleRow | null> {
  const result = await getExecutor(client).query<RoleRow>(
    `
    ${ROLE_SELECT}
    WHERE r.id = $1
    GROUP BY r.id
    LIMIT 1
    `,
    [id]
  );

  const role = result.rows[0];

  return role ? mapRoleRow(role) : null;
}

/**
 * Busca un rol mediante su clave técnica.
 */
export async function findRoleByKey(
  roleKey: string
): Promise<RoleRow | null> {
  const result = await db.query<RoleRow>(
    `
    ${ROLE_SELECT}
    WHERE UPPER(r.role_key) = UPPER($1)
    GROUP BY r.id
    LIMIT 1
    `,
    [roleKey]
  );

  const role = result.rows[0];

  return role ? mapRoleRow(role) : null;
}

/**
 * Obtiene solamente las claves de permisos existentes y activos.
 */
async function findValidPermissionKeys(
  permissionKeys: string[],
  client?: PoolClient
): Promise<string[]> {
  if (permissionKeys.length === 0) {
    return [];
  }

  const result = await getExecutor(client).query<{
    permission_key: string;
  }>(
    `
    SELECT permission_key
    FROM app_permission
    WHERE permission_key = ANY($1::varchar[])
      AND is_active = true
    ORDER BY permission_key ASC
    `,
    [permissionKeys]
  );

  return result.rows.map((row) => row.permission_key);
}

/**
 * Reemplaza todos los permisos asignados a un rol.
 */
async function replaceRolePermissions(
  roleId: number,
  permissionKeys: string[],
  client: PoolClient
): Promise<void> {
  await client.query(
    `
    DELETE FROM app_role_permission
    WHERE role_id = $1
    `,
    [roleId]
  );

  if (permissionKeys.length === 0) {
    return;
  }

  const validPermissionKeys = await findValidPermissionKeys(
    permissionKeys,
    client
  );

  if (validPermissionKeys.length === 0) {
    return;
  }

  await client.query(
    `
    INSERT INTO app_role_permission (
      role_id,
      permission_key
    )
    SELECT
      $1,
      UNNEST($2::varchar[])
    ON CONFLICT (role_id, permission_key) DO NOTHING
    `,
    [roleId, validPermissionKeys]
  );
}

/**
 * Inserta un rol y sus permisos dentro de una transacción.
 */
export async function insertRole(
  input: NormalizedCreateRoleInput
): Promise<RoleRow> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const createdResult = await client.query<{
      id: string | number;
    }>(
      `
      INSERT INTO app_role (
        role_key,
        role_name,
        description,
        is_active
      )
      VALUES ($1, $2, $3, true)
      RETURNING id
      `,
      [
        input.roleKey,
        input.roleName,
        input.description
      ]
    );

    const roleId = Number(createdResult.rows[0]?.id);

    if (!roleId) {
      throw new Error("No se pudo obtener el id del rol creado.");
    }

    await replaceRolePermissions(
      roleId,
      input.permissions,
      client
    );

    const role = await findRoleById(roleId, client);

    if (!role) {
      throw new Error("No se pudo consultar el rol creado.");
    }

    await client.query("COMMIT");

    return role;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Actualiza los datos editables y permisos de un rol.
 */
export async function updateRoleById(
  id: number,
  input: NormalizedUpdateRoleInput
): Promise<RoleRow | null> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const current = await findRoleById(id, client);

    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      UPDATE app_role
      SET
        role_name = $2,
        description = $3,
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        id,
        input.roleName ?? current.role_name,
        input.description !== undefined
          ? input.description
          : current.description
      ]
    );

    if (input.permissions !== undefined) {
      await replaceRolePermissions(
        id,
        input.permissions,
        client
      );
    }

    const updated = await findRoleById(id, client);

    await client.query("COMMIT");

    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Activa o desactiva un rol.
 */
export async function setRoleActiveById(
  id: number,
  isActive: boolean
): Promise<RoleRow | null> {
  const result = await db.query<{ id: string | number }>(
    `
    UPDATE app_role
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id
    `,
    [id, isActive]
  );

  if (!result.rows[0]) {
    return null;
  }

  return findRoleById(id);
}

/**
 * Cuenta los usuarios que tienen asignado un rol.
 */
export async function countUsersByRoleId(
  id: number
): Promise<number> {
  const result = await db.query<{
    total: string | number;
  }>(
    `
    SELECT COUNT(*) AS total
    FROM app_user
    WHERE role_id = $1
    `,
    [id]
  );

  return Number(result.rows[0]?.total ?? 0);
}

/**
 * Elimina permanentemente un rol y sus permisos.
 *
 * Antes de llamar esta función, el service debe confirmar
 * que el rol no tiene usuarios asignados.
 */
export async function deleteRoleById(
  id: number
): Promise<RoleRow | null> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const current = await findRoleById(id, client);

    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(
      `
      DELETE FROM app_role_permission
      WHERE role_id = $1
      `,
      [id]
    );

    await client.query(
      `
      DELETE FROM app_role
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    return current;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}