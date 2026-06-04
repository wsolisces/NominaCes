// ======================================================
// PATH: backend/src/modules/permisos/permisos.service.ts
// Lógica de negocio del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Aplicar reglas de negocio del catálogo controlado de permisos.
 * - Normalizar claves técnicas.
 * - Validar campos editables.
 * - Convertir filas de BD a DTO.
 *
 * No debe:
 * - Ejecutar SQL directamente.
 * - Manejar req/res de Express.
 * - Aplicar estilos o reglas visuales.
 */

import { AppError } from "../../shared/errors/AppError.js";

import {
  findPermissionByKey,
  listPermissionAuditRows,
  listPermissionRows,
  updatePermissionRowWithAudit
} from "./permisos.repository.js";

import type {
  PermissionAuditDto,
  PermissionAuditRow,
  PermissionDto,
  PermissionRow,
  UpdatePermissionInput
} from "./permisos.types.js";

/**
 * Normaliza clave técnica de permiso.
 *
 * Reglas:
 * - Mayúsculas.
 * - Espacios y guiones convertidos a guion bajo.
 * - Solo letras, números y guion bajo.
 */
function normalizePermissionKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

/**
 * Normaliza módulo técnico.
 */
function normalizeModuleKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

/**
 * Normaliza texto visible.
 */
function normalizeDisplayText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Valida formato de clave técnica.
 */
function assertValidPermissionKey(permissionKey: string): void {
  if (!/^[A-Z0-9_]{3,120}$/.test(permissionKey)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message:
        "La clave del permiso debe usar solo letras mayúsculas, números y guion bajo."
    });
  }
}

/**
 * Valida formato de módulo técnico.
 */
function assertValidModuleKey(moduleKey: string): void {
  if (!/^[A-Z0-9_]{2,80}$/.test(moduleKey)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message:
        "La clave del módulo debe usar solo letras mayúsculas, números y guion bajo."
    });
  }
}

/**
 * Convierte fila de app_permission a DTO.
 */
function toPermissionDto(row: PermissionRow): PermissionDto {
  return {
    permissionKey: row.permission_key,
    permissionName: row.permission_name,
    moduleKey: row.module_key,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    updatedByUserId: row.updated_by_user_id
  };
}

/**
 * Convierte fila de app_permission_audit a DTO.
 */
function toPermissionAuditDto(row: PermissionAuditRow): PermissionAuditDto {
  return {
    id: row.id,
    permissionKey: row.permission_key,
    action: row.action,
    oldPermissionName: row.old_permission_name,
    newPermissionName: row.new_permission_name,
    oldModuleKey: row.old_module_key,
    newModuleKey: row.new_module_key,
    oldDescription: row.old_description,
    newDescription: row.new_description,
    oldIsActive: row.old_is_active,
    newIsActive: row.new_is_active,
    changedByUserId: row.changed_by_user_id,
    changedByUsername: row.changed_by_username,
    changedByFullName: row.changed_by_full_name,
    changedAt: row.changed_at.toISOString()
  };
}

/**
 * Lista permisos disponibles.
 */
export async function listPermissions(): Promise<PermissionDto[]> {
  const rows = await listPermissionRows();
  return rows.map(toPermissionDto);
}

/**
 * Obtiene un permiso por clave técnica.
 */
export async function getPermissionByKey(
  permissionKey: string
): Promise<PermissionDto> {
  const normalizedPermissionKey = normalizePermissionKey(permissionKey);

  assertValidPermissionKey(normalizedPermissionKey);

  const permission = await findPermissionByKey(normalizedPermissionKey);

  if (!permission) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Permiso no encontrado."
    });
  }

  return toPermissionDto(permission);
}

/**
 * Actualiza metadata de un permiso controlado.
 *
 * Reglas:
 * - No permite cambiar permissionKey.
 * - No crea permisos nuevos.
 * - No elimina permisos.
 * - Registra auditoría de cualquier edición.
 */
export async function updatePermission(
  input: UpdatePermissionInput
): Promise<PermissionDto> {
  const permissionKey = normalizePermissionKey(input.permissionKey);

  assertValidPermissionKey(permissionKey);

  const existing = await findPermissionByKey(permissionKey);

  if (!existing) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Permiso no encontrado."
    });
  }

  const nextPermissionName =
    input.permissionName !== undefined
      ? normalizeDisplayText(input.permissionName)
      : existing.permission_name;

  if (!nextPermissionName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El nombre del permiso es obligatorio."
    });
  }

  const nextModuleKey =
    input.moduleKey !== undefined
      ? normalizeModuleKey(input.moduleKey)
      : existing.module_key;

  assertValidModuleKey(nextModuleKey);

  const nextDescription =
    input.description === undefined
      ? existing.description
      : input.description?.trim() || null;

  const nextIsActive =
    input.isActive === undefined ? existing.is_active : input.isActive;

  const updated = await updatePermissionRowWithAudit(existing, {
    permissionKey,
    permissionName: nextPermissionName,
    moduleKey: nextModuleKey,
    description: nextDescription,
    isActive: nextIsActive,
    changedByUserId: input.changedByUserId ?? null
  });

  return toPermissionDto(updated);
}

/**
 * Lista auditoría de un permiso.
 */
export async function listPermissionAudit(
  permissionKey: string
): Promise<PermissionAuditDto[]> {
  const normalizedPermissionKey = normalizePermissionKey(permissionKey);

  assertValidPermissionKey(normalizedPermissionKey);

  const existing = await findPermissionByKey(normalizedPermissionKey);

  if (!existing) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Permiso no encontrado."
    });
  }

  const rows = await listPermissionAuditRows(normalizedPermissionKey);

  return rows.map(toPermissionAuditDto);
}