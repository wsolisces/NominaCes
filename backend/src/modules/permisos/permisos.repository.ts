// ======================================================
// PATH: backend/src/modules/permisos/permisos.repository.ts
// Acceso a datos del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Consultar app_permission.
 * - Actualizar metadata controlada de permisos.
 * - Registrar auditoría en app_permission_audit.
 * - Mantener transaccionalidad entre edición y auditoría.
 *
 * No debe:
 * - Aplicar reglas de autorización.
 * - Validar payloads HTTP.
 * - Transformar DTO final.
 */

import { db } from "../../config/db.js";

import type {
  PermissionAuditRow,
  PermissionRow,
  UpdatePermissionRowInput
} from "./permisos.types.js";

/**
 * Lista todos los permisos registrados.
 */
export async function listPermissionRows(): Promise<PermissionRow[]> {
  const result = await db.query<PermissionRow>(
    `
    SELECT
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at,
      updated_by_user_id
    FROM app_permission
    ORDER BY
      module_key ASC,
      permission_key ASC
    `
  );

  return result.rows;
}

/**
 * Busca un permiso por clave técnica.
 */
export async function findPermissionByKey(
  permissionKey: string
): Promise<PermissionRow | null> {
  const result = await db.query<PermissionRow>(
    `
    SELECT
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at,
      updated_by_user_id
    FROM app_permission
    WHERE permission_key = $1
    LIMIT 1
    `,
    [permissionKey]
  );

  return result.rows[0] ?? null;
}

/**
 * Actualiza un permiso y registra auditoría en una misma transacción.
 */
export async function updatePermissionRowWithAudit(
  currentPermission: PermissionRow,
  input: UpdatePermissionRowInput
): Promise<PermissionRow> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const updatedResult = await client.query<PermissionRow>(
      `
      UPDATE app_permission
      SET
        permission_name = $2,
        module_key = $3,
        description = $4,
        is_active = $5,
        updated_at = now(),
        updated_by_user_id = $6
      WHERE permission_key = $1
      RETURNING
        permission_key,
        permission_name,
        module_key,
        description,
        is_active,
        created_at,
        updated_at,
        updated_by_user_id
      `,
      [
        input.permissionKey,
        input.permissionName,
        input.moduleKey,
        input.description,
        input.isActive,
        input.changedByUserId
      ]
    );

    const updatedPermission = updatedResult.rows[0];

    if (!updatedPermission) {
      throw new Error("No fue posible actualizar el permiso.");
    }

    await client.query(
      `
      INSERT INTO app_permission_audit (
        permission_key,
        action,
        old_permission_name,
        new_permission_name,
        old_module_key,
        new_module_key,
        old_description,
        new_description,
        old_is_active,
        new_is_active,
        changed_by_user_id
      )
      VALUES (
        $1,
        'UPDATE',
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10
      )
      `,
      [
        input.permissionKey,
        currentPermission.permission_name,
        updatedPermission.permission_name,
        currentPermission.module_key,
        updatedPermission.module_key,
        currentPermission.description,
        updatedPermission.description,
        currentPermission.is_active,
        updatedPermission.is_active,
        input.changedByUserId
      ]
    );

    await client.query("COMMIT");

    return updatedPermission;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Lista auditoría de un permiso.
 */
export async function listPermissionAuditRows(
  permissionKey: string
): Promise<PermissionAuditRow[]> {
  const result = await db.query<PermissionAuditRow>(
    `
    SELECT
      a.id,
      a.permission_key,
      a.action,
      a.old_permission_name,
      a.new_permission_name,
      a.old_module_key,
      a.new_module_key,
      a.old_description,
      a.new_description,
      a.old_is_active,
      a.new_is_active,
      a.changed_by_user_id,
      u.username AS changed_by_username,
      u.full_name AS changed_by_full_name,
      a.changed_at
    FROM app_permission_audit a
    LEFT JOIN app_user u
      ON u.id = a.changed_by_user_id
    WHERE a.permission_key = $1
    ORDER BY
      a.changed_at DESC,
      a.id DESC
    `,
    [permissionKey]
  );

  return result.rows;
}