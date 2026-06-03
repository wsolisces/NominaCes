// ======================================================
// PATH: backend/src/modules/permisos/permisos.service.ts
// Lógica de negocio del módulo Permisos
// ======================================================

import { AppError } from "../../shared/errors/AppError.js";
import type {
  CreatePermissionInput,
  PermissionDto,
  PermissionRow,
  UpdatePermissionInput
} from "./permisos.types.js";
import {
  createPermissionRow,
  findPermissionByKey,
  listPermissionRows,
  updatePermissionRow
} from "./permisos.repository.js";

/**
 * Normaliza clave técnica de permiso.
 *
 * Reglas:
 * - Mayúsculas.
 * - Espacios y guiones convertidos a guion bajo.
 * - Solo letras, números y guion bajo.
 *
 * No debe:
 * - Consultar BD.
 * - Traducir nombres visibles.
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
 * Convierte fila de BD a DTO.
 */
function toPermissionDto(row: PermissionRow): PermissionDto {
  return {
    permissionKey: row.permission_key,
    permissionName: row.permission_name,
    moduleKey: row.module_key,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString()
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
 * Crea un permiso nuevo.
 *
 * Reglas:
 * - permissionKey es único.
 * - permissionKey y moduleKey se normalizan.
 * - No se asigna automáticamente a ningún rol.
 */
export async function createPermission(
  input: CreatePermissionInput
): Promise<PermissionDto> {
  const permissionKey = normalizePermissionKey(input.permissionKey);
  const moduleKey = normalizeModuleKey(input.moduleKey);
  const permissionName = input.permissionName.trim();

  assertValidPermissionKey(permissionKey);
  assertValidModuleKey(moduleKey);

  if (!permissionName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El nombre del permiso es obligatorio."
    });
  }

  const existing = await findPermissionByKey(permissionKey);

  if (existing) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Ya existe un permiso con esa clave."
    });
  }

  const created = await createPermissionRow({
    permissionKey,
    permissionName,
    moduleKey,
    description: input.description?.trim() || null,
    isActive: input.isActive ?? true
  });

  return toPermissionDto(created);
}

/**
 * Actualiza metadata de un permiso.
 *
 * Reglas:
 * - No permite cambiar permissionKey.
 * - Permite activar/desactivar el permiso.
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

  const moduleKey =
    input.moduleKey !== undefined
      ? normalizeModuleKey(input.moduleKey)
      : undefined;

  if (moduleKey !== undefined) {
    assertValidModuleKey(moduleKey);
  }

  const updated = await updatePermissionRow({
    permissionKey,
    permissionName: input.permissionName?.trim(),
    moduleKey,
    description:
      input.description === undefined ? existing.description : input.description,
    isActive: input.isActive
  });

  if (!updated) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Permiso no encontrado."
    });
  }

  return toPermissionDto(updated);
}