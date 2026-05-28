// ======================================================
// PATH: src/layouts/sidebar.config.ts
// Configuración del menú lateral
// ======================================================

import type { ReactNode } from "react";

export type SidebarItem = {
  label: string;
  path: string;
  section: string;
  icon: ReactNode;
};

export const sidebarItems: SidebarItem[] = [
  {
    label: "Panel",
    path: "/panel",
    section: "INICIO",
    icon: "▦",
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    section: "ADMINISTRACIÓN",
    icon: "◉",
  },
];