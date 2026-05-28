// ======================================================
// PATH: src/layouts/SideBar.tsx
// Sidebar fijo – Negro sólido – Tamaño cómodo + colapsable
// ======================================================

import { NavLink, useNavigate } from "react-router-dom";
import {
  IconPanel,
  IconEmpleados,
  IconLogout,
  IconChevronLeft,
} from "../components/icons/Icons";
import { useAuth } from "../auth/useAuth";
import LogoCompleto from "../components/img/Cesantoni_Blanco.png";
import Isotipo from "../components/img/Cesantoni_Blanco_Isotipo.png";

/* ===================== PROPS ===================== */

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
};

function toDisplayText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;

  const text = String(value).trim();
  return text || fallback;
}

function getRoleText(userRoleId: unknown, roleName?: unknown, roleKey?: unknown) {
  const directRole = toDisplayText(roleName || roleKey, "");

  if (directRole) return directRole;

  const roleMap: Record<string, string> = {
    "1": "Administrador",
    "2": "Viewer",
    "3": "Analyst",
  };

  return roleMap[String(userRoleId ?? "")] || "Sin rol";
}

export default function SideBar({ collapsed, setCollapsed }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

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

  const rowClass = (active: boolean) =>
    `
      group
      flex items-center
      ${collapsed ? "justify-center px-0" : "gap-4 px-4"}
      h-12
      rounded-lg
      text-[15px]
      font-medium
      transition-colors duration-150
      ${
        active
          ? "bg-[#1f2937] text-white"
          : "text-[#b4bbc6] hover:bg-[#161b22] hover:text-white"
      }
    `;

  const iconClass =
    "h-[21px] w-[21px] text-[21px] text-current leading-none shrink-0";

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40
        h-screen
        ${collapsed ? "w-24" : "w-64"}
        bg-[#0d1115]
        border-r border-[#161b22]
        shadow-[4px_0_24px_rgba(0,0,0,0.55)]
        flex flex-col
        transition-all duration-300
      `}
    >
      {/* ================= HEADER ================= */}
      <div
        className={`
          flex items-center justify-center
          ${collapsed ? "h-36 px-2" : "h-36 px-4"}
        `}
      >
        {collapsed ? (
          <img
            src={Isotipo}
            alt="Cesantoni"
            className="
              h-24
              w-auto
              object-contain
              transition-all
              duration-300
            "
          />
        ) : (
          <img
            src={LogoCompleto}
            alt="Cesantoni"
            className="
              h-28
              w-auto
              object-contain
              transition-all
              duration-300
            "
          />
        )}
      </div>

      {/* ================= NAV ================= */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2 sidebar-scroll">
        {!collapsed && (
          <div className="px-4 pb-2 text-[10px] font-semibold tracking-[0.28em] text-[#6b7280]">
            INICIO
          </div>
        )}

        <NavLink
          to="/panel"
          end
          className={({ isActive }) => rowClass(isActive)}
        >
          <IconPanel className={iconClass} />
          {!collapsed && <span className="truncate">Panel</span>}
        </NavLink>

        {!collapsed && (
          <div className="px-4 pt-6 pb-2 text-[10px] font-semibold tracking-[0.28em] text-[#6b7280]">
            ADMINISTRACIÓN
          </div>
        )}

        <NavLink
          to="/usuarios"
          end
          className={({ isActive }) => rowClass(isActive)}
        >
          <IconEmpleados className={iconClass} />
          {!collapsed && <span className="truncate">Usuarios</span>}
        </NavLink>
      </nav>

      {/* ================= BOTÓN COLAPSAR ================= */}
      <div className="py-5 flex justify-center">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className="
            inline-flex
            h-11
            w-11
            items-center
            justify-center
            rounded-lg
            text-[#b4bbc6]
            hover:text-white
            hover:bg-[#1f2937]
            transition-all
            duration-200
          "
        >
          <IconChevronLeft
            className={`
              h-6 w-6
              transition-transform duration-300
              ${collapsed ? "rotate-180" : ""}
            `}
          />
        </button>
      </div>

      {/* ================= PROFILE ================= */}
      <div className="p-4">
        {collapsed ? (
          <div className="flex justify-center">
            
          </div>
        ) : (
          <div className="rounded-xl bg-[#121820] border border-[#1d2632] p-4">
            <div className="flex items-center gap-4">
              

              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-white">
                  {toDisplayText(displayName, "Usuario")}
                </div>

                <div className="truncate text-[13px] text-[#9ca3af]">
                  {toDisplayText(displayRole, "Sin rol")}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="
                  inline-flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-[#b4bbc6]
                  hover:text-white
                  hover:bg-[#1f2937]
                  transition-colors
                  shrink-0
                "
              >
                <IconLogout className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}