// ======================================================
// PATH: backend\src\modules\login\login.permissions.ts
// Catálogo centralizado de permisos del sistema
// ======================================================

/**
 * Permisos técnicos disponibles en NominaCes.
 *
 * Regla:
 * - Todo permiso nuevo debe agregarse aquí.
 * - Backend y frontend deben usar estas claves.
 * - La BD guarda estos mismos permission_key.
 */
export const APP_PERMISSIONS = {
  USERS_VIEW: "USERS_VIEW",
  USERS_CREATE: "USERS_CREATE",
  USERS_EDIT: "USERS_EDIT",

  ROLES_VIEW: "ROLES_VIEW",
  ROLES_CREATE: "ROLES_CREATE",
  ROLES_EDIT: "ROLES_EDIT",

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
 * Metadata opcional para mantenimiento visual.
 * Sirve después para pantalla de permisos por checks.
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