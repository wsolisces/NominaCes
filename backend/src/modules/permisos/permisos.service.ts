// ======================================================
// PATH: backend/src/modules/permisos/permisos.service.ts
// Servicio de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Aplicar reglas de negocio del catálogo de permisos.
 * - Normalizar claves, nombres y módulos.
 * - Validar duplicados antes de crear o modificar.
 *
 * No debe:
 * - Acceder directamente a req/res de Express.
 * - Crear conexiones directas a PostgreSQL.
 * - Definir rutas HTTP.
 */

import {
  createPermission,
  deletePermissionById,
  findPermissionById,
  findPermissionByKey,
  findPermissions,
  setPermissionActiveState,
  updatePermission
} from "./permisos.repository.js";

import {
  PermissionDomainError,
  type CreatePermissionInput,
  type PermissionDto,
  type PermissionId,
  type PermissionListFilters,
  type PermissionMutationResult,
  type UpdatePermissionInput
} from "./permisos.types.js";

const PERMISSION_KEY_PATTERN = /^[A-Z0-9_]+$/;
const MODULE_KEY_PATTERN = /^[A-Z0-9_]+$/;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizePermissionKey(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "_");
}

function normalizeModuleKey(value: unknown): string | null {
  const normalized = normalizeNullableText(value);

  if (!normalized) return null;

  return normalized.toUpperCase().replace(/\s+/g, "_");
}

function assertPermissionKey(permissionKey: string): void {
  if (!permissionKey) {
    throw new PermissionDomainError(
      "La clave del permiso es obligatoria.",
      400,
      "PERMISSION_KEY_REQUIRED"
    );
  }

  if (!PERMISSION_KEY_PATTERN.test(permissionKey)) {
    throw new PermissionDomainError(
      "La clave del permiso solo puede contener letras mayúsculas, números y guion bajo.",
      400,
      "PERMISSION_KEY_INVALID"
    );
  }

  if (permissionKey.length > 100) {
    throw new PermissionDomainError(
      "La clave del permiso no puede exceder 100 caracteres.",
      400,
      "PERMISSION_KEY_TOO_LONG"
    );
  }
}

function assertPermissionName(permissionName: string): void {
  if (!permissionName) {
    throw new PermissionDomainError(
      "El nombre del permiso es obligatorio.",
      400,
      "PERMISSION_NAME_REQUIRED"
    );
  }

  if (permissionName.length > 150) {
    throw new PermissionDomainError(
      "El nombre del permiso no puede exceder 150 caracteres.",
      400,
      "PERMISSION_NAME_TOO_LONG"
    );
  }
}

function assertModuleKey(moduleKey: string | null): void {
  if (!moduleKey) return;

  if (!MODULE_KEY_PATTERN.test(moduleKey)) {
    throw new PermissionDomainError(
      "El módulo solo puede contener letras mayúsculas, números y guion bajo.",
      400,
      "MODULE_KEY_INVALID"
    );
  }

  if (moduleKey.length > 100) {
    throw new PermissionDomainError(
      "El módulo no puede exceder 100 caracteres.",
      400,
      "MODULE_KEY_TOO_LONG"
    );
  }
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeId(value: unknown): PermissionId {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new PermissionDomainError(
      "El id del permiso no es válido.",
      400,
      "PERMISSION_ID_INVALID"
    );
  }

  return id;
}

/**
 * Obtiene permisos con filtros normalizados.
 */
export async function listPermissionsService(
  filters: PermissionListFilters
): Promise<PermissionDto[]> {
  return findPermissions({
    search: normalizeNullableText(filters.search) ?? undefined,
    module_key: normalizeModuleKey(filters.module_key) ?? undefined,
    is_active: filters.is_active
  });
}

/**
 * Obtiene un permiso por id.
 */
export async function getPermissionByIdService(
  rawId: unknown
): Promise<PermissionDto> {
  const id = normalizeId(rawId);
  const permission = await findPermissionById(id);

  if (!permission) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }

  return permission;
}

/**
 * Crea un permiso validando duplicados.
 */
export async function createPermissionService(
  input: CreatePermissionInput
): Promise<PermissionMutationResult> {
  const permissionKey = normalizePermissionKey(input.permission_key);
  const permissionName = normalizeText(input.permission_name);
  const moduleKey = normalizeModuleKey(input.module_key);
  const description = normalizeNullableText(input.description);
  const isActive = normalizeBoolean(input.is_active, true);

  assertPermissionKey(permissionKey);
  assertPermissionName(permissionName);
  assertModuleKey(moduleKey);

  const existing = await findPermissionByKey(permissionKey);

  if (existing) {
    throw new PermissionDomainError(
      "Ya existe un permiso con esa clave.",
      409,
      "PERMISSION_KEY_DUPLICATED"
    );
  }

  const permission = await createPermission({
    permission_key: permissionKey,
    permission_name: permissionName,
    module_key: moduleKey,
    description,
    is_active: isActive
  });

  return { permission };
}

/**
 * Actualiza un permiso existente validando duplicados.
 */
export async function updatePermissionService(
  rawId: unknown,
  input: UpdatePermissionInput
): Promise<PermissionMutationResult> {
  const id = normalizeId(rawId);

  const current = await findPermissionById(id);

  if (!current) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }

  const permissionKey =
    input.permission_key !== undefined
      ? normalizePermissionKey(input.permission_key)
      : current.permission_key;

  const permissionName =
    input.permission_name !== undefined
      ? normalizeText(input.permission_name)
      : current.permission_name;

  const moduleKey =
    input.module_key !== undefined
      ? normalizeModuleKey(input.module_key)
      : current.module_key;

  const description =
    input.description !== undefined
      ? normalizeNullableText(input.description)
      : current.description;

  const isActive =
    input.is_active !== undefined
      ? normalizeBoolean(input.is_active, current.is_active)
      : current.is_active;

  assertPermissionKey(permissionKey);
  assertPermissionName(permissionName);
  assertModuleKey(moduleKey);

  if (permissionKey !== current.permission_key) {
    const duplicated = await findPermissionByKey(permissionKey);

    if (duplicated && duplicated.id !== id) {
      throw new PermissionDomainError(
        "Ya existe otro permiso con esa clave.",
        409,
        "PERMISSION_KEY_DUPLICATED"
      );
    }
  }

  const permission = await updatePermission(id, {
    permission_key: permissionKey,
    permission_name: permissionName,
    module_key: moduleKey,
    description,
    is_active: isActive
  });

  if (!permission) {
    throw new PermissionDomainError(
      "No fue posible actualizar el permiso.",
      500,
      "PERMISSION_UPDATE_FAILED"
    );
  }

  return { permission };
}

/**
 * Activa un permiso.
 */
export async function activatePermissionService(
  rawId: unknown
): Promise<PermissionMutationResult> {
  const id = normalizeId(rawId);
  const permission = await setPermissionActiveState(id, true);

  if (!permission) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }

  return { permission };
}

/**
 * Desactiva un permiso.
 */
export async function deactivatePermissionService(
  rawId: unknown
): Promise<PermissionMutationResult> {
  const id = normalizeId(rawId);
  const permission = await setPermissionActiveState(id, false);

  if (!permission) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }

  return { permission };
}

/**
 * Elimina un permiso por id.
 */
export async function deletePermissionService(
  rawId: unknown
): Promise<void> {
  const id = normalizeId(rawId);
  const deleted = await deletePermissionById(id);

  if (!deleted) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }
}