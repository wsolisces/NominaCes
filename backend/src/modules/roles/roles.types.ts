// ======================================================
// PATH: backend/src/modules/roles/roles.types.ts
// Tipos internos y públicos del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Definir filas obtenidas desde PostgreSQL.
 * - Definir respuestas públicas del módulo.
 * - Definir los datos aceptados para crear y modificar roles.
 *
 * Reglas:
 * - app_role usa is_active.
 * - app_permission usa permission_key como llave primaria.
 * - app_role_permission relaciona roles mediante permission_key.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Aplicar reglas de negocio.
 * - Leer Request o Response de Express.
 */

/**
 * Fila interna obtenida desde PostgreSQL.
 *
 * PostgreSQL puede devolver columnas BIGINT como string.
 */
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

/**
 * Respuesta pública enviada al frontend.
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
 * Datos permitidos al crear un rol.
 *
 * Se aceptan temporalmente propiedades camelCase y snake_case
 * para mantener compatibilidad con clientes existentes.
 */
export type CreateRoleInput = {
  roleKey?: string;
  role_key?: string;

  roleName?: string;
  role_name?: string;

  description?: string | null;
  permissions?: string[];
};

/**
 * Datos permitidos al modificar un rol.
 *
 * La clave técnica roleKey no puede modificarse.
 */
export type UpdateRoleInput = {
  roleName?: string;
  role_name?: string;

  description?: string | null;
  permissions?: string[];
};

/**
 * Datos internos completamente normalizados para crear un rol.
 */
export type NormalizedCreateRoleInput = {
  roleKey: string;
  roleName: string;
  description: string | null;
  permissions: string[];
};

/**
 * Datos internos normalizados para modificar un rol.
 */
export type NormalizedUpdateRoleInput = {
  roleName?: string;
  description?: string | null;
  permissions?: string[];
};