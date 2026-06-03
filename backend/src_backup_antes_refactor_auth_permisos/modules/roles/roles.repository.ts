// ======================================================
// PATH: backend/src/modules/roles/roles.repository.ts
// Módulo: Roles
// Archivo: Repository
// ------------------------------------------------------
// Único archivo del módulo que habla con PostgreSQL.
//
// Responsabilidades:
// - Consultar roles.
// - Crear roles.
// - Actualizar roles.
// - Activar/desactivar roles.
// - Reemplazar permisos del rol.
//
// Tablas usadas:
// - app_role
// - app_permission
// - app_role_permission
//
// Estructura real:
// - app_role.id bigint
// - app_role.is_active boolean
// - app_permission.permission_key PK
// - app_role_permission.permission_key FK
// ======================================================

import { db } from "../../config/db.js";
import type { CreateRoleInput, RoleRow, UpdateRoleInput } from "./roles.types.js";

/**
 * Convierte el array agregado por PostgreSQL a string[] seguro.
 */
function safePermissions(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/**
 * Normaliza una fila cruda de BD.
 *
 * Nota:
 * PostgreSQL puede devolver BIGINT como string.
 * Por eso el id se convierte a number para la respuesta final.
 */
function mapRoleRow(row: RoleRow): RoleRow {
  return {
    ...row,
    id: Number(row.id),
    permissions: safePermissions(row.permissions),
  };
}

/**
 * Consulta base de roles con sus permisos.
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
      ARRAY_REMOVE(ARRAY_AGG(p.permission_key ORDER BY p.permission_key), NULL),
      '{}'
    ) AS permissions
  FROM app_role r
  LEFT JOIN app_role_permission rp
    ON rp.role_id = r.id
  LEFT JOIN app_permission p
    ON p.permission_key = rp.permission_key
`;

/**
 * Lista todos los roles.
 */
export async function findRoles(): Promise<RoleRow[]> {
  const result = await db.query<RoleRow>(
    `
    ${ROLE_SELECT}
    GROUP BY r.id
    ORDER BY r.id ASC
    `
  );

  return result.rows.map(mapRoleRow);
}

/**
 * Busca un rol por ID.
 */
export async function findRoleById(id: number): Promise<RoleRow | null> {
  const result = await db.query<RoleRow>(
    `
    ${ROLE_SELECT}
    WHERE r.id = $1
    GROUP BY r.id
    `,
    [id]
  );

  return result.rows[0] ? mapRoleRow(result.rows[0]) : null;
}

/**
 * Busca un rol por clave interna.
 */
export async function findRoleByKey(roleKey: string): Promise<RoleRow | null> {
  const result = await db.query<RoleRow>(
    `
    ${ROLE_SELECT}
    WHERE UPPER(r.role_key) = UPPER($1)
    GROUP BY r.id
    `,
    [roleKey]
  );

  return result.rows[0] ? mapRoleRow(result.rows[0]) : null;
}

/**
 * Devuelve solo permisos existentes y activos.
 *
 * Esto evita insertar permisos inválidos en app_role_permission.
 */
async function findValidPermissionKeys(permissionKeys: string[]): Promise<string[]> {
  if (permissionKeys.length === 0) {
    return [];
  }

  const result = await db.query<{ permission_key: string }>(
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
 * Reemplaza todos los permisos de un rol.
 */
async function replaceRolePermissions(roleId: number, permissionKeys: string[]): Promise<void> {
  await db.query(
    `
    DELETE FROM app_role_permission
    WHERE role_id = $1
    `,
    [roleId]
  );

  if (permissionKeys.length === 0) {
    return;
  }

  const validPermissionKeys = await findValidPermissionKeys(permissionKeys);

  if (validPermissionKeys.length === 0) {
    return;
  }

  await db.query(
    `
    INSERT INTO app_role_permission (
      role_id,
      permission_key
    )
    SELECT $1, UNNEST($2::varchar[])
    ON CONFLICT (role_id, permission_key) DO NOTHING
    `,
    [roleId, validPermissionKeys]
  );
}

/**
 * Inserta un rol y sus permisos dentro de una transacción.
 */
export async function insertRole(
  input: Required<CreateRoleInput>
): Promise<RoleRow> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const created = await client.query<{ id: string | number }>(
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
      [input.roleKey, input.roleName, input.description ?? null]
    );

    const roleId = Number(created.rows[0].id);

    if (input.permissions.length > 0) {
      const permissionResult = await client.query<{ permission_key: string }>(
        `
        SELECT permission_key
        FROM app_permission
        WHERE permission_key = ANY($1::varchar[])
          AND is_active = true
        ORDER BY permission_key ASC
        `,
        [input.permissions]
      );

      const validPermissionKeys = permissionResult.rows.map((row) => row.permission_key);

      if (validPermissionKeys.length > 0) {
        await client.query(
          `
          INSERT INTO app_role_permission (
            role_id,
            permission_key
          )
          SELECT $1, UNNEST($2::varchar[])
          ON CONFLICT (role_id, permission_key) DO NOTHING
          `,
          [roleId, validPermissionKeys]
        );
      }
    }

    await client.query("COMMIT");

    const role = await findRoleById(roleId);

    if (!role) {
      throw new Error("No se pudo consultar el rol creado.");
    }

    return role;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Actualiza datos editables de un rol.
 */
export async function updateRoleById(
  id: number,
  input: UpdateRoleInput & { permissions?: string[] }
): Promise<RoleRow | null> {
  const current = await findRoleById(id);

  if (!current) {
    return null;
  }

  await db.query(
    `
    UPDATE app_role
    SET
      role_name = $2,
      description = $3
    WHERE id = $1
    `,
    [
      id,
      input.roleName ?? input.role_name ?? current.role_name,
      input.description !== undefined ? input.description : current.description,
    ]
  );

  if (input.permissions !== undefined) {
    await replaceRolePermissions(id, input.permissions);
  }

  return findRoleById(id);
}

/**
 * Activa o desactiva un rol.
 */
export async function setRoleActiveById(
  id: number,
  isActive: boolean
): Promise<RoleRow | null> {
  await db.query(
    `
    UPDATE app_role
    SET is_active = $2
    WHERE id = $1
    `,
    [id, isActive]
  );

  return findRoleById(id);
}