// ======================================================
// PATH: src/modules/permisos/permisos.types.ts
// Tipos del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos TypeScript del módulo Permisos.
 * - Mantener tipado compartido entre API y pantalla.
 * - Reflejar el DTO devuelto por el backend.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Contener lógica visual.
 * - Contener reglas de negocio del backend.
 */

/**
 * Permiso devuelto por el backend.
 */
export type PermissionDto = {
  permissionKey: string;
  permissionName: string;
  moduleKey: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedByUserId: number | null;
};

/**
 * Payload permitido para editar permisos.
 *
 * Reglas:
 * - No incluye permissionKey porque viene por URL.
 * - No permite crear ni eliminar permisos.
 */
export type UpdatePermissionPayload = {
  permissionName?: string;
  moduleKey?: string;
  description?: string | null;
  isActive?: boolean;
};

/**
 * Registro de auditoría devuelto por el backend.
 */
export type PermissionAuditDto = {
  id: number;
  permissionKey: string;
  action: string;
  oldPermissionName: string | null;
  newPermissionName: string | null;
  oldModuleKey: string | null;
  newModuleKey: string | null;
  oldDescription: string | null;
  newDescription: string | null;
  oldIsActive: boolean | null;
  newIsActive: boolean | null;
  changedByUserId: number | null;
  changedByUsername: string | null;
  changedByFullName: string | null;
  changedAt: string;
};

/**
 * Resumen superior de permisos.
 */
export type PermissionsSummary = {
  total: number;
  active: number;
  inactive: number;
  modules: number;
};

/**
 * Estado interno del formulario de edición.
 */
export type PermissionFormState = {
  permissionName: string;
  moduleKey: string;
  description: string;
  isActive: boolean;
};