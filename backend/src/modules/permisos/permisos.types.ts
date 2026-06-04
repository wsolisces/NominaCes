// ======================================================
// PATH: backend/src/modules/permisos/permisos.types.ts
// Tipos del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos internos del módulo Permisos.
 * - Mantener tipado compartido entre repository, service y controller.
 * - Representar app_permission y app_permission_audit.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Manejar req/res de Express.
 * - Contener reglas visuales del frontend.
 */

/**
 * Fila base de app_permission.
 */
export type PermissionRow = {
  permission_key: string;
  permission_name: string;
  module_key: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by_user_id: number | null;
};

/**
 * DTO devuelto al frontend.
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
 * Payload para editar permisos.
 *
 * Reglas:
 * - permissionKey viene desde URL.
 * - permissionKey no se modifica.
 * - changedByUserId se usa para auditoría.
 */
export type UpdatePermissionInput = {
  permissionKey: string;
  permissionName?: string;
  moduleKey?: string;
  description?: string | null;
  isActive?: boolean;
  changedByUserId?: number | null;
};

/**
 * Entrada final para actualizar app_permission.
 */
export type UpdatePermissionRowInput = {
  permissionKey: string;
  permissionName: string;
  moduleKey: string;
  description: string | null;
  isActive: boolean;
  changedByUserId: number | null;
};

/**
 * Fila de auditoría devuelta desde app_permission_audit.
 */
export type PermissionAuditRow = {
  id: number;
  permission_key: string;
  action: string;
  old_permission_name: string | null;
  new_permission_name: string | null;
  old_module_key: string | null;
  new_module_key: string | null;
  old_description: string | null;
  new_description: string | null;
  old_is_active: boolean | null;
  new_is_active: boolean | null;
  changed_by_user_id: number | null;
  changed_by_username: string | null;
  changed_by_full_name: string | null;
  changed_at: Date;
};

/**
 * DTO de auditoría para frontend.
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