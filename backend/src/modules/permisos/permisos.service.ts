// ======================================================
// PATH: backend/src/modules/permisos/permisos.service.ts
// Servicio de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Aplicar reglas de negocio del catálogo de permisos.
 * - Normalizar claves, nombres y módulos.
 * - Validar duplicados antes de crear o modificar.
 * - Usar permission_key como identificador real del permiso.
 *
 * No debe:
 * - Acceder directamente a req/res de Express.
 * - Crear conexiones directas a PostgreSQL.
 * - Definir rutas HTTP.
 * - Validar ids numéricos, porque app_permission no tiene columna id.
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

/**
 * Normaliza texto simple eliminando espacios laterales.
 */
function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Normaliza texto opcional.
 */
function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

/**
 * Normaliza claves de permiso.
 */
function normalizePermissionKey(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "_");
}

/**
 * Normaliza claves de módulo.
 */
function normalizeModuleKey(value: unknown): string | null {
  const normalized = normalizeNullableText(value);

  if (!normalized) return null;

  return normalized.toUpperCase().replace(/\s+/g, "_");
}

/**
 * Valida la clave única del permiso.
 */
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

  if (permissionKey.length > 120) {
    throw new PermissionDomainError(
      "La clave del permiso no puede exceder 120 caracteres.",
      400,
      "PERMISSION_KEY_TOO_LONG"
    );
  }
}

/**
 * Valida el nombre visible del permiso.
 */
function assertPermissionName(permissionName: string): void {
  if (!permissionName) {
    throw new PermissionDomainError(
      "El nombre del permiso es obligatorio.",
      400,
      "PERMISSION_NAME_REQUIRED"
    );
  }

  if (permissionName.length > 160) {
    throw new PermissionDomainError(
      "El nombre del permiso no puede exceder 160 caracteres.",
      400,
      "PERMISSION_NAME_TOO_LONG"
    );
  }
}

/**
 * Valida y estrecha el tipo de module_key.
 *
 * Después de esta función TypeScript sabe que moduleKey ya no es null.
 */
function assertModuleKey(
  moduleKey: string | null
): asserts moduleKey is string {
  if (!moduleKey) {
    throw new PermissionDomainError(
      "El módulo del permiso es obligatorio.",
      400,
      "MODULE_KEY_REQUIRED"
    );
  }

  if (!MODULE_KEY_PATTERN.test(moduleKey)) {
    throw new PermissionDomainError(
      "El módulo solo puede contener letras mayúsculas, números y guion bajo.",
      400,
      "MODULE_KEY_INVALID"
    );
  }

  if (moduleKey.length > 80) {
    throw new PermissionDomainError(
      "El módulo no puede exceder 80 caracteres.",
      400,
      "MODULE_KEY_TOO_LONG"
    );
  }
}

/**
 * Valida el nombre visible del módulo cuando se proporciona.
 */
function assertModuleName(moduleName: string | null): void {
  if (!moduleName) return;

  if (moduleName.length > 120) {
    throw new PermissionDomainError(
      "El nombre del módulo no puede exceder 120 caracteres.",
      400,
      "MODULE_NAME_TOO_LONG"
    );
  }
}

/**
 * Normaliza booleanos recibidos desde formularios o query params.
 */
function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/**
 * Normaliza el identificador público del permiso.
 *
 * Aunque el parámetro se llame id en algunas rutas, realmente representa
 * permission_key porque app_permission no tiene columna id.
 */
function normalizePermissionId(value: unknown): PermissionId {
  const permissionKey = normalizePermissionKey(value);

  if (!permissionKey) {
    throw new PermissionDomainError(
      "La clave del permiso no es válida.",
      400,
      "PERMISSION_KEY_INVALID"
    );
  }

  assertPermissionKey(permissionKey);

  return permissionKey;
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
 * Obtiene un permiso por permission_key.
 */
export async function getPermissionByIdService(
  rawId: unknown
): Promise<PermissionDto> {
  const permissionKey = normalizePermissionId(rawId);
  const permission = await findPermissionById(permissionKey);

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
  const moduleName = normalizeNullableText(input.module_name);
  const description = normalizeNullableText(input.description);
  const isActive = normalizeBoolean(input.is_active, true);

  assertPermissionKey(permissionKey);
  assertPermissionName(permissionName);
  assertModuleKey(moduleKey);
  assertModuleName(moduleName);

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
    module_name: moduleName,
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
  const currentPermissionKey = normalizePermissionId(rawId);

  const current = await findPermissionById(currentPermissionKey);

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

  const moduleName =
    input.module_name !== undefined
      ? normalizeNullableText(input.module_name)
      : current.module_name;

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
  assertModuleName(moduleName);

  if (permissionKey !== current.permission_key) {
    const duplicated = await findPermissionByKey(permissionKey);

    if (
      duplicated &&
      duplicated.permission_key !== current.permission_key
    ) {
      throw new PermissionDomainError(
        "Ya existe otro permiso con esa clave.",
        409,
        "PERMISSION_KEY_DUPLICATED"
      );
    }
  }

  const permission = await updatePermission(currentPermissionKey, {
    permission_key: permissionKey,
    permission_name: permissionName,
    module_key: moduleKey,
    module_name: moduleName,
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
  const permissionKey = normalizePermissionId(rawId);
  const permission = await setPermissionActiveState(permissionKey, true);

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
  const permissionKey = normalizePermissionId(rawId);
  const permission = await setPermissionActiveState(permissionKey, false);

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
 * Elimina un permiso por permission_key.
 */
export async function deletePermissionService(
  rawId: unknown
): Promise<void> {
  const permissionKey = normalizePermissionId(rawId);
  const deleted = await deletePermissionById(permissionKey);

  if (!deleted) {
    throw new PermissionDomainError(
      "No se encontró el permiso solicitado.",
      404,
      "PERMISSION_NOT_FOUND"
    );
  }
}