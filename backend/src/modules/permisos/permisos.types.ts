// ======================================================
// PATH: backend/src/modules/permisos/permisos.types.ts
// Tipos del módulo Permisos
// ======================================================

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
};

/**
 * Payload para crear permisos.
 */
export type CreatePermissionInput = {
  permissionKey: string;
  permissionName: string;
  moduleKey: string;
  description?: string | null;
  isActive?: boolean;
};

/**
 * Payload para editar permisos.
 */
export type UpdatePermissionInput = {
  permissionKey: string;
  permissionName?: string;
  moduleKey?: string;
  description?: string | null;
  isActive?: boolean;
};