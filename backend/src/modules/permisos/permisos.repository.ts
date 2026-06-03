// ======================================================
// PATH: backend/src/modules/permisos/permisos.repository.ts
// Acceso a datos del módulo Permisos
// ======================================================

import { db } from "../../config/db.js";
import type {
  CreatePermissionInput,
  PermissionRow,
  UpdatePermissionInput
} from "./permisos.types.js";

/**
 * Lista todos los permisos registrados.
 *
 * Responsabilidades:
 * - Consultar app_permission.
 * - Ordenar por módulo y clave técnica.
 *
 * No debe:
 * - Aplicar reglas de autorización.
 * - Transformar a DTO final.
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
      created_at
    FROM app_permission
    ORDER BY module_key, permission_key
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
      created_at
    FROM app_permission
    WHERE permission_key = $1
    LIMIT 1
    `,
    [permissionKey]
  );

  return result.rows[0] ?? null;
}

/**
 * Crea un permiso en app_permission.
 */
export async function createPermissionRow(
  input: CreatePermissionInput
): Promise<PermissionRow> {
  const result = await db.query<PermissionRow>(
    `
    INSERT INTO app_permission (
      permission_key,
      permission_name,
      module_key,
      description,
      is_active
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at
    `,
    [
      input.permissionKey,
      input.permissionName,
      input.moduleKey,
      input.description ?? null,
      input.isActive ?? true
    ]
  );

  return result.rows[0];
}

/**
 * Actualiza metadata de un permiso existente.
 *
 * Reglas:
 * - No cambia permission_key.
 * - La clave técnica es estable porque puede estar usada por roles/frontend.
 */
export async function updatePermissionRow(
  input: UpdatePermissionInput
): Promise<PermissionRow | null> {
  const result = await db.query<PermissionRow>(
    `
    UPDATE app_permission
    SET
      permission_name = COALESCE($2, permission_name),
      module_key = COALESCE($3, module_key),
      description = $4,
      is_active = COALESCE($5, is_active)
    WHERE permission_key = $1
    RETURNING
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at
    `,
    [
      input.permissionKey,
      input.permissionName ?? null,
      input.moduleKey ?? null,
      input.description ?? null,
      input.isActive ?? null
    ]
  );

  return result.rows[0] ?? null;
}