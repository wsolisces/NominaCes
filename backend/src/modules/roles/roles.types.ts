// ======================================================
// PATH: backend/src/modules/roles/roles.types.ts
// Tipos del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir contratos TypeScript del módulo de roles.
 * - Centralizar DTOs usados por controlador, servicio y repositorio.
 * - Mantener reglas de datos separadas de Express.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Contener lógica HTTP.
 * - Contener lógica visual del frontend.
 */

export type RoleRow = {
  id: string;
  role_key: string;
  role_name: string;
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
  users_count: number;
  permissions_count: number;
};

export type RoleUserRow = {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
  inactive_reason: string | null;
  is_locked: boolean;
};

export type RolePermissionRow = {
  permission_key: string;
  permission_name: string;
  module_key: string;
  module_name: string | null;
  description: string | null;
  is_active: boolean;
  assigned: boolean;
};

export type RolePermissionGroup = {
  module_key: string;
  module_name: string;
  permissions: RolePermissionRow[];
};

export type RoleDetail = RoleRow & {
  permissions: RolePermissionGroup[];
  users: RoleUserRow[];
};

export type RoleAuditRow = {
  id: string;
  role_id: string | null;
  action: string;
  old_data: unknown;
  new_data: unknown;
  reason: string | null;
  changed_by_user_id: string | null;
  changed_by_username: string | null;
  changed_at: string;
};

export type CreateRoleInput = {
  role_name: string;
  description?: string | null;
  permission_keys?: string[];
};

export type UpdateRoleInput = {
  role_name: string;
  description?: string | null;
  permission_keys?: string[];
};

export type ChangeRoleStatusInput = {
  is_active: boolean;
  reason?: string | null;
};

export type RoleListFilters = {
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE";
};