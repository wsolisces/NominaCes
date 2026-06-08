// ======================================================
// PATH: src/modules/permisos/permisos.types.ts
// Tipos del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir los contratos usados por la pantalla de permisos.
 * - Mantener tipado consistente entre API, página, tabla y formularios.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Contener reglas visuales.
 * - Contener lógica de React.
 */

export type PermissionDto = {
  id: number;
  permission_key: string;
  permission_name: string;
  module_key: string;
  module_name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PermissionFormValues = {
  permission_key: string;
  permission_name: string;
  module_key: string;
  module_name: string;
  description: string;
  is_active: boolean;
};

export type CreatePermissionPayload = PermissionFormValues;

export type UpdatePermissionPayload = PermissionFormValues;

export type PermissionsResponse = {
  permissions: PermissionDto[];
};

export type PermissionResponse = {
  permission: PermissionDto;
};