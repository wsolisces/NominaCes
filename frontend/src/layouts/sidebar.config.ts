// ======================================================
// PATH: src/layouts/sidebar.config.ts
// Configuración del menú lateral de NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar las opciones disponibles del sidebar.
 * - Definir sección, ruta, etiqueta e icono.
 * - Mantener roles y permisos al mismo nivel que usuarios.
 *
 * No debe:
 * - Consultar permisos al backend.
 * - Renderizar directamente JSX del layout.
 * - Manejar sesión o navegación programática.
 * - Sustituir la autorización obligatoria de las rutas y del backend.
 */

import type { ComponentType } from "react";

import type { PermissionRequirement } from "../auth/auth.types";

import {
  IconCatalogos,
  IconPanel,
  IconShield,
  IconUserCog
} from "../components/icons/Icons";

import type { IconProps } from "../components/icons/Icons";

export type SidebarSection =
  | "INICIO"
  | "ADMINISTRACIÓN"
  | "OPERACIÓN"
  | "CONFIGURACIÓN";

export type SidebarItem = PermissionRequirement & {
  label: string;
  path: string;
  section: SidebarSection;
  icon: ComponentType<IconProps>;
  end?: boolean;
};

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
    icon: IconUserCog,
    end: true
  },
  {
    label: "Roles",
    path: "/roles",
    section: "ADMINISTRACIÓN",
    icon: IconShield,
    end: true
  },
  {
    label: "Permisos",
    path: "/permisos",
    section: "ADMINISTRACIÓN",
    icon: IconShield,
    end: true
  },
  {
    label: "Catálogos",
    path: "/catalogos",
    section: "OPERACIÓN",
    icon: IconCatalogos,
    end: true
  }
]; 