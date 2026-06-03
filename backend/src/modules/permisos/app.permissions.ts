// ======================================================
// PATH: backend/src/modules/permisos/app.permissions.ts
// Catálogo centralizado de permisos del sistema
// ======================================================

/**
 * Permisos técnicos disponibles en NominaCes.
 *
 * Responsabilidades:
 * - Centralizar las claves técnicas usadas por backend, frontend y BD.
 * - Evitar strings sueltos en rutas, servicios y pantallas.
 * - Servir como base para sembrar o mantener app_permission.
 *
 * Reglas:
 * - Todo permiso nuevo debe agregarse aquí.
 * - Las claves deben coincidir exactamente con app_permission.permission_key.
 * - Las claves deben ser estables; no se renombran sin migración.
 *
 * No debe:
 * - Consultar la base de datos.
 * - Asignar permisos a roles.
 * - Validar permisos del usuario actual.
 */
export const APP_PERMISSIONS = {
  USERS_VIEW: "USERS_VIEW",
  USERS_CREATE: "USERS_CREATE",
  USERS_EDIT: "USERS_EDIT",

  ROLES_VIEW: "ROLES_VIEW",
  ROLES_CREATE: "ROLES_CREATE",
  ROLES_EDIT: "ROLES_EDIT",

  PERMISSIONS_VIEW: "PERMISSIONS_VIEW",
  PERMISSIONS_CREATE: "PERMISSIONS_CREATE",
  PERMISSIONS_EDIT: "PERMISSIONS_EDIT",

  CATALOGS_VIEW: "CATALOGS_VIEW",
  CATALOGS_EDIT: "CATALOGS_EDIT",

  HEADCOUNT_VIEW: "HEADCOUNT_VIEW",
  HEADCOUNT_EXPORT: "HEADCOUNT_EXPORT",
  HEADCOUNT_TEMPLATE_ADMIN: "HEADCOUNT_TEMPLATE_ADMIN",

  PAYROLL_UPLOAD: "PAYROLL_UPLOAD",
  PAYROLL_VIEW: "PAYROLL_VIEW",

  ISN_VIEW: "ISN_VIEW",
  ISN_CONFIG: "ISN_CONFIG",
  ISN_SIMULATE: "ISN_SIMULATE"
} as const;

export type AppPermission =
  (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

export const APP_PERMISSION_LIST: AppPermission[] =
  Object.values(APP_PERMISSIONS);

/**
 * Metadata visual y administrativa de permisos.
 *
 * Sirve para:
 * - Mostrar permisos agrupados por módulo.
 * - Sembrar app_permission.
 * - Armar checklists en frontend.
 */
export const APP_PERMISSION_META: Record<
  AppPermission,
  {
    name: string;
    moduleKey: string;
    description: string;
  }
> = {
  USERS_VIEW: {
    name: "Ver usuarios",
    moduleKey: "USERS",
    description: "Permite consultar usuarios."
  },
  USERS_CREATE: {
    name: "Crear usuarios",
    moduleKey: "USERS",
    description: "Permite crear usuarios."
  },
  USERS_EDIT: {
    name: "Editar usuarios",
    moduleKey: "USERS",
    description: "Permite editar, activar, bloquear o resetear usuarios."
  },

  ROLES_VIEW: {
    name: "Ver roles",
    moduleKey: "ROLES",
    description: "Permite consultar roles."
  },
  ROLES_CREATE: {
    name: "Crear roles",
    moduleKey: "ROLES",
    description: "Permite crear roles."
  },
  ROLES_EDIT: {
    name: "Editar roles",
    moduleKey: "ROLES",
    description: "Permite editar roles y asignar permisos."
  },

  PERMISSIONS_VIEW: {
    name: "Ver permisos",
    moduleKey: "PERMISSIONS",
    description: "Permite consultar permisos disponibles."
  },
  PERMISSIONS_CREATE: {
    name: "Crear permisos",
    moduleKey: "PERMISSIONS",
    description: "Permite crear permisos técnicos nuevos."
  },
  PERMISSIONS_EDIT: {
    name: "Editar permisos",
    moduleKey: "PERMISSIONS",
    description: "Permite editar nombre, módulo, descripción o estatus de permisos."
  },

  CATALOGS_VIEW: {
    name: "Ver catálogos",
    moduleKey: "CATALOGS",
    description: "Permite consultar catálogos."
  },
  CATALOGS_EDIT: {
    name: "Editar catálogos",
    moduleKey: "CATALOGS",
    description: "Permite modificar catálogos."
  },

  HEADCOUNT_VIEW: {
    name: "Ver Head Count",
    moduleKey: "HEADCOUNT",
    description: "Permite consultar Head Count."
  },
  HEADCOUNT_EXPORT: {
    name: "Exportar Head Count",
    moduleKey: "HEADCOUNT",
    description: "Permite exportar información de Head Count."
  },
  HEADCOUNT_TEMPLATE_ADMIN: {
    name: "Administrar plantilla",
    moduleKey: "HEADCOUNT",
    description: "Permite administrar plantilla autorizada."
  },

  PAYROLL_UPLOAD: {
    name: "Subir nómina",
    moduleKey: "PAYROLL",
    description: "Permite cargar información de nómina."
  },
  PAYROLL_VIEW: {
    name: "Ver nómina",
    moduleKey: "PAYROLL",
    description: "Permite consultar información de nómina."
  },

  ISN_VIEW: {
    name: "Ver ISN",
    moduleKey: "ISN",
    description: "Permite consultar ISN."
  },
  ISN_CONFIG: {
    name: "Configurar ISN",
    moduleKey: "ISN",
    description: "Permite configurar reglas, grupos y conceptos ISN."
  },
  ISN_SIMULATE: {
    name: "Simular ISN",
    moduleKey: "ISN",
    description: "Permite ejecutar simulación de ISN."
  }
};