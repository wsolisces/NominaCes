// ======================================================
// PATH: backend/src/modules/permisos/permisos.repository.ts
// Repositorio de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Ejecutar consultas SQL sobre app_permission.
 * - Encapsular el acceso a PostgreSQL.
 * - Devolver datos tipados al servicio.
 * - Usar permission_key como llave primaria real de la tabla.
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
  permission_key: string;
  permission_name: string;
  module_key: string;
  module_name: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by_user_id: number | null;
};

/**
 * Columnas públicas del catálogo de permisos.
 */
const PERMISSION_SELECT = `
  permission_key,
  permission_name,
  module_key,
  module_name,
  description,
  is_active,
  created_at,
  updated_at,
  updated_by_user_id
`;

/**
 * Convierte una fila SQL a DTO del módulo.
 */
function mapPermissionRow(row: PermissionRow): PermissionDto {
  return {
    permission_key: row.permission_key,
    permission_name: row.permission_name,
    module_key: row.module_key,
    module_name: row.module_name,
    description: row.description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by_user_id: row.updated_by_user_id
  };
}

/**
 * Normaliza claves de permisos para evitar espacios accidentales.
 */
function normalizePermissionKey(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Normaliza claves de módulo para mantener consistencia en filtros y escritura.
 */
function normalizeModuleKey(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Obtiene permisos con filtros opcionales.
 */
export async function findPermissions(
  filters: PermissionListFilters
): Promise<PermissionDto[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);

    where.push(`
      (
        permission_key ILIKE $${values.length}
        OR permission_name ILIKE $${values.length}
        OR module_key ILIKE $${values.length}
        OR COALESCE(module_name, '') ILIKE $${values.length}
        OR COALESCE(description, '') ILIKE $${values.length}
      )
    `);
  }

  if (filters.module_key?.trim()) {
    values.push(normalizeModuleKey(filters.module_key));
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
      ${PERMISSION_SELECT}
    FROM app_permission
    ${whereClause}
    ORDER BY
      module_key ASC,
      permission_key ASC
    `,
    values
  );

  return result.rows.map(mapPermissionRow);
}

/**
 * Busca un permiso por llave primaria.
 *
 * Nota:
 * PermissionId debe representar permission_key porque app_permission
 * no tiene columna id.
 */
export async function findPermissionById(
  id: PermissionId
): Promise<PermissionDto | null> {
  return findPermissionByKey(String(id));
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
      ${PERMISSION_SELECT}
    FROM app_permission
    WHERE permission_key = $1
    LIMIT 1
    `,
    [normalizePermissionKey(permissionKey)]
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
      module_name,
      description,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      ${PERMISSION_SELECT}
    `,
    [
      normalizePermissionKey(input.permission_key),
      input.permission_name.trim(),
      normalizeModuleKey(input.module_key),
      input.module_name?.trim() || null,
      input.description?.trim() || null,
      input.is_active ?? true
    ]
  );

  return mapPermissionRow(result.rows[0]);
}

/**
 * Actualiza un permiso existente.
 *
 * La búsqueda se hace por permission_key actual.
 * Si se modifica permission_key, PostgreSQL validará relaciones y duplicados.
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
      module_name = $5,
      description = $6,
      is_active = $7,
      updated_at = NOW()
    WHERE permission_key = $1
    RETURNING
      ${PERMISSION_SELECT}
    `,
    [
      normalizePermissionKey(String(id)),
      normalizePermissionKey(input.permission_key),
      input.permission_name.trim(),
      normalizeModuleKey(input.module_key),
      input.module_name?.trim() || null,
      input.description?.trim() || null,
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
    WHERE permission_key = $1
    RETURNING
      ${PERMISSION_SELECT}
    `,
    [normalizePermissionKey(String(id)), isActive]
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
    WHERE permission_key = $1
    `,
    [normalizePermissionKey(String(id))]
  );

  return Number(result.rowCount) > 0;
}