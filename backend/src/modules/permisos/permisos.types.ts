// ======================================================
// PATH: backend/src/modules/permisos/permisos.types.ts
// Tipos del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir los contratos internos del módulo de permisos.
 * - Centralizar tipos usados por controller, service y repository.
 * - Mantener nombres compatibles con la tabla app_permission.
 * - Usar permission_key como identificador principal del permiso.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Contener lógica HTTP.
 * - Contener reglas de negocio complejas.
 */

/**
 * Identificador real del permiso.
 *
 * Nota:
 * La tabla app_permission no tiene columna id.
 * Su llave primaria es permission_key.
 */
export type PermissionId = string;

/**
 * Estado activo/inactivo normalizado para filtros.
 */
export type PermissionActiveFilter = boolean | undefined;

/**
 * DTO público del permiso.
 *
 * Refleja las columnas reales de app_permission:
 * - permission_key es la llave primaria.
 * - module_name existe en la tabla y puede ser null.
 * - updated_by_user_id existe en la tabla y puede ser null.
 */
export type PermissionDto = {
  permission_key: PermissionId;
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
 * Filtros aceptados para consultar el catálogo de permisos.
 */
export type PermissionListFilters = {
  search?: string;
  module_key?: string;
  is_active?: PermissionActiveFilter;
};

/**
 * Datos necesarios para crear un permiso.
 *
 * module_key es obligatorio porque app_permission.module_key es NOT NULL.
 */
export type CreatePermissionInput = {
  permission_key: string;
  permission_name: string;
  module_key: string;
  module_name?: string | null;
  description?: string | null;
  is_active?: boolean;
};

/**
 * Datos normalizados que el service envía al repository para crear.
 */
export type CreatePermissionRepositoryInput = {
  permission_key: PermissionId;
  permission_name: string;
  module_key: string;
  module_name: string | null;
  description: string | null;
  is_active: boolean;
};

/**
 * Datos permitidos para actualizar un permiso.
 */
export type UpdatePermissionInput = {
  permission_key?: string;
  permission_name?: string;
  module_key?: string;
  module_name?: string | null;
  description?: string | null;
  is_active?: boolean;
};

/**
 * Datos normalizados que el service envía al repository para actualizar.
 */
export type UpdatePermissionRepositoryInput = {
  permission_key: PermissionId;
  permission_name: string;
  module_key: string;
  module_name: string | null;
  description: string | null;
  is_active: boolean;
};

/**
 * Resultado estándar para mutaciones de un permiso.
 */
export type PermissionMutationResult = {
  permission: PermissionDto;
};

/**
 * Parámetros usados por rutas que reciben un permiso.
 *
 * Se conserva id como alias para compatibilidad con rutas antiguas,
 * pero su valor debe representar permission_key.
 */
export type PermissionRouteParams = {
  permissionKey?: string;
  id?: string;
};

/**
 * Códigos controlados de error del módulo.
 */
export type PermissionErrorCode =
  | "PERMISSION_ERROR"
  | "PERMISSION_KEY_REQUIRED"
  | "PERMISSION_KEY_INVALID"
  | "PERMISSION_KEY_TOO_LONG"
  | "PERMISSION_NAME_REQUIRED"
  | "PERMISSION_NAME_TOO_LONG"
  | "MODULE_KEY_REQUIRED"
  | "MODULE_KEY_INVALID"
  | "MODULE_KEY_TOO_LONG"
  | "MODULE_NAME_TOO_LONG"
  | "PERMISSION_NOT_FOUND"
  | "PERMISSION_KEY_DUPLICATED"
  | "PERMISSION_UPDATE_FAILED"
  | "PERMISSION_DELETE_FAILED";

/**
 * Error de dominio controlado del módulo de permisos.
 */
export class PermissionDomainError extends Error {
  public readonly statusCode: number;
  public readonly code: PermissionErrorCode;

  constructor(
    message: string,
    statusCode = 400,
    code: PermissionErrorCode = "PERMISSION_ERROR"
  ) {
    super(message);
    this.name = "PermissionDomainError";
    this.statusCode = statusCode;
    this.code = code;
  }
}