// ======================================================
// PATH: src/layouts/SideBar.tsx
// Sidebar fijo de NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el menú lateral principal.
 * - Mostrar únicamente opciones autorizadas para el usuario.
 * - Ocultar secciones que no contengan opciones visibles.
 * - Mostrar logo completo o isotipo según estado colapsado.
 * - Mostrar usuario autenticado y cierre de sesión.
 *
 * No debe:
 * - Consultar APIs directamente.
 * - Definir rutas fuera de sidebar.config.ts.
 * - Sustituir la autorización obligatoria del backend.
 * - Decidir permisos específicos de cada opción.
 */

import {
  useMemo,
  type Dispatch,
  type SetStateAction
} from "react";

import {
  NavLink,
  useNavigate
} from "react-router-dom";

import { useAuth } from "../auth/useAuth";

import type {
  PermissionKey,
  PermissionRequirement
} from "../auth/auth.types";

import {
  IconChevronLeft,
  IconLogout
} from "../components/icons/Icons";

import LogoCompleto from "../components/img/Cesantoni_Blanco.png";
import Isotipo from "../components/img/Cesantoni_Blanco_Isotipo.png";

import { sidebarItems } from "./sidebar.config";

type SideBarProps = {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
};

type SafeRecord = Record<string, unknown>;

type SidebarItem = (typeof sidebarItems)[number] &
  PermissionRequirement;

/**
 * Convierte valores desconocidos a texto seguro para mostrar en UI.
 */
function toDisplayText(
  value: unknown,
  fallback = "—"
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
}

/**
 * Convierte un objeto desconocido a un diccionario seguro.
 */
function toSafeRecord(value: unknown): SafeRecord {
  if (value && typeof value === "object") {
    return value as SafeRecord;
  }

  return {};
}

/**
 * Obtiene el primer valor existente dentro de una lista de llaves.
 */
function getFirstValue(
  source: SafeRecord,
  keys: string[]
): unknown {
  for (const key of keys) {
    const value = source[key];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {
      return value;
    }
  }

  return undefined;
}

/**
 * Obtiene el nombre visible del usuario autenticado.
 */
function getDisplayName(user: unknown): string {
  const safeUser = toSafeRecord(user);

  return toDisplayText(
    getFirstValue(safeUser, [
      "full_name",
      "fullName",
      "employee_name",
      "employeeName",
      "name",
      "username"
    ]),
    "Usuario"
  );
}

/**
 * Obtiene el texto visible del rol.
 */
function getDisplayRole(user: unknown): string {
  const safeUser = toSafeRecord(user);

  const directRole = toDisplayText(
    getFirstValue(safeUser, [
      "role_name",
      "roleName",
      "role_key",
      "roleKey",
      "role"
    ]),
    ""
  );

  if (directRole) {
    return directRole;
  }

  const roleMap: Record<string, string> = {
    "1": "Administrador"
  };

  const roleId = toDisplayText(
    getFirstValue(safeUser, ["role_id", "roleId"]),
    ""
  );

  return roleMap[roleId] || "Sin rol";
}

/**
 * Agrupa las opciones visibles del sidebar por sección.
 */
function groupSidebarItems(
  items: SidebarItem[]
): Record<string, SidebarItem[]> {
  return items.reduce<Record<string, SidebarItem[]>>(
    (groups, item) => {
      if (!groups[item.section]) {
        groups[item.section] = [];
      }

      groups[item.section].push(item);

      return groups;
    },
    {}
  );
}

/**
 * Sidebar principal.
 */
export default function SideBar({
  collapsed,
  setCollapsed
}: SideBarProps) {
  const navigate = useNavigate();

  const {
    signOut,
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  } = useAuth();

  /**
   * Determina si una opción del menú puede mostrarse.
   *
   * Reglas:
   * - Sin requisitos declarados, la opción es visible.
   * - requiredPermission exige un permiso específico.
   * - anyPermissions exige al menos uno.
   * - allPermissions exige todos.
   */
  function canViewSidebarItem(item: SidebarItem): boolean {
    if (
      item.requiredPermission &&
      !hasPermission(item.requiredPermission)
    ) {
      return false;
    }

    if (
      item.anyPermissions &&
      item.anyPermissions.length > 0 &&
      !hasAnyPermission(item.anyPermissions)
    ) {
      return false;
    }

    if (
      item.allPermissions &&
      item.allPermissions.length > 0 &&
      !hasAllPermissions(item.allPermissions)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Opciones autorizadas para el usuario autenticado.
   */
  const visibleSidebarItems = useMemo(
    () =>
      (sidebarItems as SidebarItem[]).filter(
        canViewSidebarItem
      ),
    [
      hasPermission,
      hasAnyPermission,
      hasAllPermissions
    ]
  );

  /**
   * Secciones visibles sin grupos vacíos.
   */
  const groupedItems = useMemo(
    () => groupSidebarItems(visibleSidebarItems),
    [visibleSidebarItems]
  );

  const displayName = getDisplayName(user);
  const displayRole = getDisplayRole(user);

  /**
   * Cierra sesión y regresa al login.
   */
  async function handleLogout(): Promise<void> {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={[
        "sidebar",
        collapsed ? "sidebar--collapsed" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Menú principal"
    >
      <div className="sidebar__brand">
        <img
          src={collapsed ? Isotipo : LogoCompleto}
          alt="Cesantoni"
          className={
            collapsed
              ? "sidebar__logo sidebar__logo--iso"
              : "sidebar__logo sidebar__logo--full"
          }
        />
      </div>

      <nav
        className="sidebar__nav"
        aria-label="Navegación principal"
      >
        {Object.entries(groupedItems).map(
          ([section, items]) => (
            <div
              className="sidebar__section"
              key={section}
            >
              {!collapsed ? (
                <div className="sidebar__section-title">
                  {section}
                </div>
              ) : null}

              <div className="sidebar__section-items">
                {items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      title={
                        collapsed
                          ? item.label
                          : undefined
                      }
                      className={({ isActive }) =>
                        [
                          "sidebar__item",
                          isActive
                            ? "sidebar__item--active"
                            : "",
                          collapsed
                            ? "sidebar__item--collapsed"
                            : ""
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                    >
                      <Icon className="sidebar__item-icon" />

                      {!collapsed ? (
                        <span className="sidebar__item-label">
                          {item.label}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )
        )}
      </nav>

      <div className="sidebar__collapse">
        <button
          type="button"
          className="sidebar__icon-button"
          onClick={() =>
            setCollapsed((previous) => !previous)
          }
          title={
            collapsed
              ? "Expandir menú"
              : "Contraer menú"
          }
          aria-label={
            collapsed
              ? "Expandir menú"
              : "Contraer menú"
          }
        >
          <IconChevronLeft
            className={[
              "sidebar__collapse-icon",
              collapsed
                ? "sidebar__collapse-icon--collapsed"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </button>
      </div>

      {!collapsed ? (
        <div className="sidebar__profile">
          <div className="sidebar__profile-card">
            <div
              className="sidebar__avatar"
              aria-hidden="true"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>

            <div className="sidebar__profile-text">
              <div className="sidebar__profile-name">
                {displayName}
              </div>

              <div className="sidebar__profile-role">
                {displayRole}
              </div>
            </div>

            <button
              type="button"
              className="sidebar__icon-button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <IconLogout className="sidebar__logout-icon" />
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}