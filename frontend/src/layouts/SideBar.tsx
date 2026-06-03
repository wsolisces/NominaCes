// ======================================================
// PATH: src/layouts/SideBar.tsx
// Sidebar fijo de NominaCes
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el menú lateral principal.
 * - Usar negro obligatorio como base visual.
 * - Mostrar hover/focus en gris dentro del sidebar.
 * - Mostrar logo completo o isotipo según estado colapsado.
 * - Mostrar usuario autenticado y cierre de sesión.
 *
 * No debe:
 * - Consultar APIs directamente.
 * - Definir rutas fuera de sidebar.config.ts.
 * - Manejar permisos complejos de negocio.
 */

import type { Dispatch, SetStateAction } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { IconChevronLeft, IconLogout } from "../components/icons/Icons";
import LogoCompleto from "../components/img/Cesantoni_Blanco.png";
import Isotipo from "../components/img/Cesantoni_Blanco_Isotipo.png";
import { sidebarItems } from "./sidebar.config";

type SideBarProps = {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
};

/**
 * Convierte valores desconocidos a texto seguro para UI.
 */
function toDisplayText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
}

/**
 * Obtiene el texto visible del rol.
 */
function getRoleText(
  userRoleId: unknown,
  roleName?: unknown,
  roleKey?: unknown
): string {
  const directRole = toDisplayText(roleName || roleKey, "");

  if (directRole) return directRole;

  const roleMap: Record<string, string> = {
    "1": "Administrador"
  };

  return roleMap[String(userRoleId ?? "")] || "Sin rol";
}

/**
 * Agrupa las opciones del sidebar por sección visual.
 */
function groupSidebarItems() {
  return sidebarItems.reduce<Record<string, typeof sidebarItems>>(
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
export default function SideBar({ collapsed, setCollapsed }: SideBarProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const groupedItems = groupSidebarItems();

  const displayName =
    user?.full_name ||
    user?.fullName ||
    user?.employee_name ||
    user?.name ||
    user?.username ||
    "Usuario";

  const displayRole = getRoleText(
    user?.role_id,
    user?.role_name,
    user?.role_key || user?.role
  );

  /**
   * Cierra sesión y regresa al login.
   */
  async function handleLogout(): Promise<void> {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}
      aria-label="Menú principal"
    >
      <div className="sidebar__brand">
        <img
          src={collapsed ? Isotipo : LogoCompleto}
          alt="Cesantoni"
          className={collapsed ? "sidebar__logo sidebar__logo--iso" : "sidebar__logo"}
        />
      </div>

      <nav className="sidebar__nav">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div className="sidebar__section" key={section}>
            {!collapsed ? (
              <div className="sidebar__section-title">{section}</div>
            ) : null}

            <div className="sidebar__section-items">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      [
                        "sidebar__item",
                        isActive ? "sidebar__item--active" : "",
                        collapsed ? "sidebar__item--collapsed" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <Icon className="sidebar__item-icon" />
                    {!collapsed ? (
                      <span className="sidebar__item-label">{item.label}</span>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar__collapse">
        <button
          type="button"
          className="sidebar__icon-button"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <IconChevronLeft
            className={`sidebar__collapse-icon ${
              collapsed ? "sidebar__collapse-icon--collapsed" : ""
            }`}
          />
        </button>
      </div>

      <div className="sidebar__profile">
        {!collapsed ? (
          <div className="sidebar__profile-card">
            <div className="sidebar__avatar">
              {toDisplayText(displayName, "U").slice(0, 1).toUpperCase()}
            </div>

            <div className="sidebar__profile-text">
              <div className="sidebar__profile-name">
                {toDisplayText(displayName, "Usuario")}
              </div>
              <div className="sidebar__profile-role">
                {toDisplayText(displayRole, "Sin rol")}
              </div>
            </div>

            <button
              type="button"
              className="sidebar__icon-button"
              onClick={handleLogout}
              title="Cerrar sesión"
            >
              <IconLogout className="sidebar__logout-icon" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="sidebar__icon-button sidebar__icon-button--center"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <IconLogout className="sidebar__logout-icon" />
          </button>
        )}
      </div>
    </aside>
  );
}