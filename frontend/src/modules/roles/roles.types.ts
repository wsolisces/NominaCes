// ======================================================
// PATH: src/modules/roles/roles.types.ts
// Tipos del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir los contratos recibidos desde el backend.
 * - Definir los payloads enviados al backend.
 * - Definir estados auxiliares utilizados por la pantalla.
 * - Mantener tipado consistente entre API, página y tabla.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Contener componentes React.
 * - Aplicar reglas visuales.
 * - Modificar información recibida desde el backend.
 */

/**
 * Rol devuelto por el backend.
 */
export type RoleDto = {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  isActive: boolean;
  permissions: string[];
};

/**
 * Payload utilizado para crear un rol.
 */
export type CreateRoleInput = {
  roleKey: string;
  roleName: string;
  description?: string | null;
  permissions?: string[];
};

/**
 * Payload utilizado para modificar un rol.
 *
 * La clave técnica no puede modificarse después
 * de crear el rol.
 */
export type UpdateRoleInput = {
  roleName?: string;
  description?: string | null;
  permissions?: string[];
};

/**
 * Estado editable utilizado dentro del formulario.
 */
export type RoleFormState = {
  roleKey: string;
  roleName: string;
  description: string;
  permissions: string[];
};

/**
 * Resumen utilizado en los indicadores superiores.
 */
export type RolesSummary = {
  total: number;
  active: number;
  inactive: number;
  assignedPermissions: number;
};

/**
 * Respuesta posible del endpoint de listado.
 *
 * Permite compatibilidad con respuestas:
 * - RoleDto[]
 * - { roles: RoleDto[] }
 */
export type RolesListPayload =
  | RoleDto[]
  | {
      roles: RoleDto[];
    };

/**
 * Respuesta posible de endpoints individuales.
 *
 * Permite compatibilidad con respuestas:
 * - RoleDto
 * - { role: RoleDto }
 */
export type RolePayload =
  | RoleDto
  | {
      role: RoleDto;
    };