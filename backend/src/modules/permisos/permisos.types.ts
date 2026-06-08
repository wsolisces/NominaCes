// ======================================================
// PATH: backend/src/modules/permisos/permisos.types.ts
// Tipos del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir los contratos internos del módulo de permisos.
 * - Centralizar tipos usados por controller, service y repository.
 * - Mantener nombres compatibles con la tabla app_permission.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Contener lógica HTTP.
 * - Contener reglas de negocio complejas.
 */

export type PermissionId = number;

export type PermissionDto = {
  id: PermissionId;
  permission_key: string;
  permission_name: string;
  module_key: string | null;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type PermissionListFilters = {
  search?: string;
  module_key?: string;
  is_active?: boolean;
};

export type CreatePermissionInput = {
  permission_key: string;
  permission_name: string;
  module_key?: string | null;
  description?: string | null;
  is_active?: boolean;
};

export type UpdatePermissionInput = {
  permission_key?: string;
  permission_name?: string;
  module_key?: string | null;
  description?: string | null;
  is_active?: boolean;
};

export type PermissionMutationResult = {
  permission: PermissionDto;
};

export class PermissionDomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = "PERMISSION_ERROR") {
    super(message);
    this.name = "PermissionDomainError";
    this.statusCode = statusCode;
    this.code = code;
  }
}