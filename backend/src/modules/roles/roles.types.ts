// ======================================================
// PATH: backend/src/modules/roles/roles.types.ts
// Módulo: Roles
// Archivo: Tipos del módulo
// ------------------------------------------------------
// Define las estructuras internas del módulo Roles.
//
// La BD actual usa:
// - app_role.is_active boolean
// - app_permission.permission_key como PK
// - app_role_permission.permission_key
//
// No usa:
// - status
// - permission_id
// ======================================================

export type RoleRow = {
  id: number | string;
  role_key: string;
  role_name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  permissions: string[];
};

export type RoleDto = {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  permissions: string[];
};

export type CreateRoleInput = {
  roleKey?: string;
  role_key?: string;
  roleName?: string;
  role_name?: string;
  description?: string | null;
  permissions?: string[];
};

export type UpdateRoleInput = {
  roleName?: string;
  role_name?: string;
  description?: string | null;
  permissions?: string[];
};