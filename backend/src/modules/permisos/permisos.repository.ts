// ======================================================
// PATH: backend/src/modules/permisos/permisos.repository.ts
// Repositorio de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Ejecutar consultas SQL sobre app_permission.
 * - Encapsular el acceso a PostgreSQL.
 * - Devolver datos tipados al servicio.
 *
 * No debe:
 * - Contener lógica HTTP.
 * - Validar permisos de usuario autenticado.
 * - Formatear respuestas para Express.
 */

import { db } from "../../config/db.js";

import type {
  CreatePermissionInput,
  PermissionDto,
  PermissionId,
  PermissionListFilters,
  UpdatePermissionInput
} from "./permisos.types.js";

type PermissionRow = {
  id: number;
  permission_key: string;
  permission_name: string;
  module_key: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapPermissionRow(row: PermissionRow): PermissionDto {
  return {
    id: row.id,
    permission_key: row.permission_key,
    permission_name: row.permission_name,
    module_key: row.module_key,
    description: row.description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Obtiene permisos con filtros opcionales.
 */
export async function findPermissions(
  filters: PermissionListFilters
): Promise<PermissionDto[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    where.push(`
      (
        permission_key ILIKE $${values.length}
        OR permission_name ILIKE $${values.length}
        OR COALESCE(description, '') ILIKE $${values.length}
      )
    `);
  }

  if (filters.module_key) {
    values.push(filters.module_key);
    where.push(`module_key = $${values.length}`);
  }

  if (typeof filters.is_active === "boolean") {
    values.push(filters.is_active);
    where.push(`is_active = $${values.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await db.query<PermissionRow>(
    `
    SELECT
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    FROM app_permission
    ${whereClause}
    ORDER BY
      module_key ASC NULLS LAST,
      permission_key ASC
    `,
    values
  );

  return result.rows.map(mapPermissionRow);
}

/**
 * Busca un permiso por id.
 */
export async function findPermissionById(
  id: PermissionId
): Promise<PermissionDto | null> {
  const result = await db.query<PermissionRow>(
    `
    SELECT
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    FROM app_permission
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  const row = result.rows[0];

  return row ? mapPermissionRow(row) : null;
}

/**
 * Busca un permiso por clave normalizada.
 */
export async function findPermissionByKey(
  permissionKey: string
): Promise<PermissionDto | null> {
  const result = await db.query<PermissionRow>(
    `
    SELECT
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    FROM app_permission
    WHERE permission_key = $1
    LIMIT 1
    `,
    [permissionKey]
  );

  const row = result.rows[0];

  return row ? mapPermissionRow(row) : null;
}

/**
 * Crea un permiso.
 */
export async function createPermission(
  input: CreatePermissionInput
): Promise<PermissionDto> {
  const result = await db.query<PermissionRow>(
    `
    INSERT INTO app_permission (
      permission_key,
      permission_name,
      module_key,
      description,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [
      input.permission_key,
      input.permission_name,
      input.module_key ?? null,
      input.description ?? null,
      input.is_active ?? true
    ]
  );

  return mapPermissionRow(result.rows[0]);
}

/**
 * Actualiza un permiso existente.
 */
export async function updatePermission(
  id: PermissionId,
  input: Required<UpdatePermissionInput>
): Promise<PermissionDto | null> {
  const result = await db.query<PermissionRow>(
    `
    UPDATE app_permission
    SET
      permission_key = $2,
      permission_name = $3,
      module_key = $4,
      description = $5,
      is_active = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [
      id,
      input.permission_key,
      input.permission_name,
      input.module_key,
      input.description,
      input.is_active
    ]
  );

  const row = result.rows[0];

  return row ? mapPermissionRow(row) : null;
}

/**
 * Cambia el estado activo/inactivo de un permiso.
 */
export async function setPermissionActiveState(
  id: PermissionId,
  isActive: boolean
): Promise<PermissionDto | null> {
  const result = await db.query<PermissionRow>(
    `
    UPDATE app_permission
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      permission_key,
      permission_name,
      module_key,
      description,
      is_active,
      created_at,
      updated_at
    `,
    [id, isActive]
  );

  const row = result.rows[0];

  return row ? mapPermissionRow(row) : null;
}

/**
 * Elimina físicamente un permiso.
 *
 * Nota:
 * Si el permiso está relacionado con roles o usuarios,
 * PostgreSQL puede impedir el borrado por llaves foráneas.
 */
export async function deletePermissionById(
  id: PermissionId
): Promise<boolean> {
  const result = await db.query(
    `
    DELETE FROM app_permission
    WHERE id = $1
    `,
    [id]
  );

  return Number(result.rowCount) > 0;
}