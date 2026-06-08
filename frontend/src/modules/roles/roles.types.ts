// ======================================================
// PATH: src/modules/roles/roles.types.ts
// Tipos del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir los contratos TypeScript del módulo de roles.
 * - Mantener tipados los DTOs recibidos desde el backend.
 * - Definir los estados utilizados por formularios y asignación de permisos.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Renderizar componentes.
 * - Definir estilos visuales.
 */

/**
 * Rol recibido desde el backend.
 */
export type RoleDto = {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Permiso disponible para asignarse a roles.
 */
export type RolePermissionDto = {
  permissionKey: string;
  permissionName: string;
  moduleKey: string;
  description: string | null;
  isActive: boolean;
  assigned: boolean;
};

/**
 * Registro de auditoría del rol.
 */
export type RoleAuditDto = {
  id: number;
  oldRoleName: string | null;
  newRoleName: string | null;
  oldDescription: string | null;
  newDescription: string | null;
  oldIsActive: boolean | null;
  newIsActive: boolean | null;
  changedByUsername: string | null;
  changedByFullName: string | null;
  changedAt: string;
};

/**
 * Estado editable del formulario de creación y edición.
 */
export type RoleFormState = {
  roleKey: string;
  roleName: string;
  description: string;
  isActive: boolean;
};

/**
 * Resumen superior de roles.
 */
export type RolesSummary = {
  total: number;
  active: number;
  inactive: number;
  system: number;
};

/**
 * Payload para crear un rol.
 */
export type CreateRoleRequest = {
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
};

/**
 * Payload para actualizar un rol.
 */
export type UpdateRoleRequest = {
  roleName: string;
  description: string | null;
  isActive: boolean;
};

/**
 * Payload para actualizar permisos asignados a un rol.
 */
export type UpdateRolePermissionsRequest = {
  permissionKeys: string[];
};