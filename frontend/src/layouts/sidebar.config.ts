// ======================================================
// PATH: src/layouts/sidebar.config.ts
// Configuración del menú lateral de NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar las opciones disponibles del sidebar.
 * - Definir sección, ruta, etiqueta, icono y permisos requeridos.
 * - Mantener roles y permisos al mismo nivel que usuarios.
 * - Permitir que el sidebar oculte opciones no autorizadas.
 *
 * No debe:
 * - Consultar permisos al backend.
 * - Renderizar directamente JSX del layout.
 * - Manejar sesión o navegación programática.
 * - Sustituir la autorización obligatoria de las rutas y del backend.
 */

import type { ComponentType } from "react";

import type {
  PermissionKey,
  PermissionRequirement
} from "../auth/auth.types";

import {
  IconCatalogos,
  IconEmpleados,
  IconPanel,
  IconShield,
  IconUserCog
} from "../components/icons/Icons";

import type { IconProps } from "../components/icons/Icons";

/**
 * Secciones visuales permitidas dentro del menú lateral.
 */
export type SidebarSection =
  | "INICIO"
  | "ADMINISTRACIÓN"
  | "OPERACIÓN"
  | "CONFIGURACIÓN";

/**
 * Configuración de una opción del sidebar.
 *
 * Reglas de permisos:
 * - requiredPermission: exige un permiso específico.
 * - anyPermissions: exige al menos uno de los permisos.
 * - allPermissions: exige todos los permisos indicados.
 * - Sin requisitos: la opción es visible para cualquier usuario autenticado.
 */
export type SidebarItem = PermissionRequirement & {
  label: string;
  path: string;
  section: SidebarSection;
  icon: ComponentType<IconProps>;
  end?: boolean;
};

/**
 * Permisos utilizados por el menú lateral.
 *
 * Se centralizan aquí para evitar claves técnicas repetidas
 * dentro de cada configuración.
 */
const SIDEBAR_PERMISSIONS = {
  USERS_VIEW: "USERS_VIEW",
  ROLES_VIEW: "ROLES_VIEW",
  PERMISSIONS_VIEW: "PERMISSIONS_VIEW",
  CATALOGS_VIEW: "CATALOGS_VIEW"
} as const satisfies Record<string, PermissionKey>;

/**
 * Opciones disponibles del sidebar.
 *
 * El componente SideBar filtra esta lista según los permisos
 * activos del usuario autenticado.
 */
export const sidebarItems: SidebarItem[] = [
  {
    label: "Panel",
    path: "/panel",
    section: "INICIO",
    icon: IconPanel,
    end: true
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    section: "ADMINISTRACIÓN",
    icon: IconEmpleados,
    end: true,
    requiredPermission: SIDEBAR_PERMISSIONS.USERS_VIEW
  },
  {
    label: "Roles",
    path: "/roles",
    section: "ADMINISTRACIÓN",
    icon: IconUserCog,
    end: true,
    requiredPermission: SIDEBAR_PERMISSIONS.ROLES_VIEW
  },
  {
    label: "Permisos",
    path: "/permisos",
    section: "ADMINISTRACIÓN",
    icon: IconShield,
    end: true,
    requiredPermission: SIDEBAR_PERMISSIONS.PERMISSIONS_VIEW
  },
  {
    label: "Catálogos",
    path: "/catalogos",
    section: "OPERACIÓN",
    icon: IconCatalogos,
    end: true,
    requiredPermission: SIDEBAR_PERMISSIONS.CATALOGS_VIEW
  }
];