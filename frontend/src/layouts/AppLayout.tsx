// ======================================================
// PATH: src/layouts/AppLayout.tsx
// Layout principal autenticado
// ======================================================

import { useState } from "react";
import { Outlet } from "react-router-dom";

import SideBar from "./SideBar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-zinc-950">
      <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />

      <main
        className={`
          min-h-screen
          transition-all duration-300
          ${collapsed ? "ml-24" : "ml-64"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}