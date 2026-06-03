// ======================================================
// PATH: src/modules/permisos/pages/PermisosPage.tsx
// Pantalla de administración de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el catálogo de permisos del sistema.
 * - Mantener permisos al mismo nivel que usuarios y roles.
 * - Usar estructura visual reutilizable del sistema.
 *
 * No debe:
 * - Asignar permisos a roles directamente.
 * - Definir layout principal.
 * - Duplicar estilos globales.
 */

import { useMemo, useState } from "react";

import { Button, InputField, Page } from "../../../shared/ui";

import "../../security/security-pages.css";

type PermissionRow = {
  permission_key: string;
  permission_name: string;
  module_key: string;
  description: string;
  is_active: boolean;
};

const INITIAL_PERMISSIONS: PermissionRow[] = [
  {
    permission_key: "USERS_READ",
    permission_name: "Consultar usuarios",
    module_key: "USERS",
    description: "Permite visualizar usuarios del sistema.",
    is_active: true
  },
  {
    permission_key: "USERS_CREATE",
    permission_name: "Crear usuarios",
    module_key: "USERS",
    description: "Permite registrar nuevos usuarios.",
    is_active: true
  },
  {
    permission_key: "ROLES_READ",
    permission_name: "Consultar roles",
    module_key: "ROLES",
    description: "Permite visualizar roles del sistema.",
    is_active: true
  },
  {
    permission_key: "PERMISSIONS_READ",
    permission_name: "Consultar permisos",
    module_key: "PERMISOS",
    description: "Permite visualizar permisos del sistema.",
    is_active: true
  }
];

/**
 * Filtra permisos por texto libre.
 */
function filterPermissions(
  permissions: PermissionRow[],
  search: string
): PermissionRow[] {
  const value = search.trim().toLowerCase();

  if (!value) {
    return permissions;
  }

  return permissions.filter((permission) => {
    const searchableText = [
      permission.permission_key,
      permission.permission_name,
      permission.module_key,
      permission.description,
      permission.is_active ? "activo" : "inactivo"
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(value);
  });
}

/**
 * Pantalla principal de permisos.
 */
export default function PermisosPage() {
  const [search, setSearch] = useState("");
  const [permissions] = useState<PermissionRow[]>(INITIAL_PERMISSIONS);

  const visiblePermissions = useMemo(() => {
    return filterPermissions(permissions, search);
  }, [permissions, search]);

  const summary = useMemo(() => {
    const modules = new Set(
      permissions.map((permission) => permission.module_key)
    );

    return {
      total: permissions.length,
      active: permissions.filter((permission) => permission.is_active).length,
      inactive: permissions.filter((permission) => !permission.is_active).length,
      modules: modules.size
    };
  }, [permissions]);

  return (
    <Page
      eyebrow="Administración / Seguridad"
      title="Permisos"
      description="Consulta y administra las acciones disponibles por módulo."
      actions={
        <Button type="button">
          Nuevo permiso
        </Button>
      }
    >
      <section className="security-kpis" aria-label="Resumen de permisos">
        <article className="security-kpi">
          <span className="security-kpi__label">Total</span>
          <strong className="security-kpi__value">{summary.total}</strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Activos</span>
          <strong className="security-kpi__value">{summary.active}</strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Inactivos</span>
          <strong className="security-kpi__value">{summary.inactive}</strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Módulos</span>
          <strong className="security-kpi__value">{summary.modules}</strong>
        </article>
      </section>

      <section className="security-panel">
        <div className="security-toolbar">
          <div className="security-toolbar__search">
            <InputField
              label="Buscar"
              value={search}
              placeholder="Buscar por clave, nombre, módulo o estado..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="security-toolbar__actions">
            <Button type="button" variant="secondary">
              Actualizar
            </Button>
          </div>
        </div>

        <div className="security-table-wrapper">
          <table className="security-table">
            <thead>
              <tr>
                <th>Permiso</th>
                <th>Módulo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="security-table__actions-header">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visiblePermissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="security-table__empty">
                    No hay permisos para mostrar.
                  </td>
                </tr>
              ) : (
                visiblePermissions.map((permission) => (
                  <tr key={permission.permission_key}>
                    <td>
                      <div className="security-main-text">
                        <strong>{permission.permission_name}</strong>
                        <span>{permission.permission_key}</span>
                      </div>
                    </td>

                    <td>{permission.module_key}</td>

                    <td>{permission.description || "Sin descripción"}</td>

                    <td>
                      <span
                        className={`security-status ${
                          permission.is_active
                            ? "security-status--active"
                            : "security-status--inactive"
                        }`}
                      >
                        {permission.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="security-table-actions">
                        <Button type="button" size="sm" variant="secondary">
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}