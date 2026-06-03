// ======================================================
// PATH: src/modules/roles/pages/RolesPage.tsx
// Pantalla de administración de roles
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar la administración de roles del sistema.
 * - Mantener roles al mismo nivel que usuarios y permisos.
 * - Usar estructura visual reutilizable del sistema.
 *
 * No debe:
 * - Definir el layout principal.
 * - Duplicar estilos globales.
 * - Manejar permisos complejos directamente en la vista.
 */

import { useMemo, useState } from "react";

import { Button, InputField, Page } from "../../../shared/ui";

import "../../security/security-pages.css";

type RoleRow = {
  id: string;
  role_key: string;
  role_name: string;
  description: string;
  is_active: boolean;
};

const INITIAL_ROLES: RoleRow[] = [
  {
    id: "1",
    role_key: "ADMINISTRADOR",
    role_name: "Administrador",
    description: "Rol inicial con acceso completo al sistema.",
    is_active: true
  }
];

/**
 * Filtra roles por texto libre.
 */
function filterRoles(roles: RoleRow[], search: string): RoleRow[] {
  const value = search.trim().toLowerCase();

  if (!value) {
    return roles;
  }

  return roles.filter((role) => {
    const searchableText = [
      role.role_key,
      role.role_name,
      role.description,
      role.is_active ? "activo" : "inactivo"
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(value);
  });
}

/**
 * Pantalla principal de roles.
 */
export default function RolesPage() {
  const [search, setSearch] = useState("");
  const [roles] = useState<RoleRow[]>(INITIAL_ROLES);

  const visibleRoles = useMemo(() => {
    return filterRoles(roles, search);
  }, [roles, search]);

  const summary = useMemo(() => {
    return {
      total: roles.length,
      active: roles.filter((role) => role.is_active).length,
      inactive: roles.filter((role) => !role.is_active).length
    };
  }, [roles]);

  return (
    <Page
      eyebrow="Administración / Seguridad"
      title="Roles"
      description="Administra los perfiles de acceso que se asignan a los usuarios."
      actions={
        <Button type="button">
          Nuevo rol
        </Button>
      }
    >
      <section className="security-kpis" aria-label="Resumen de roles">
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
          <span className="security-kpi__label">Módulo</span>
          <strong className="security-kpi__value">Seguridad</strong>
        </article>
      </section>

      <section className="security-panel">
        <div className="security-toolbar">
          <div className="security-toolbar__search">
            <InputField
              label="Buscar"
              value={search}
              placeholder="Buscar por clave, nombre o estado..."
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
                <th>Rol</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="security-table__actions-header">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {visibleRoles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="security-table__empty">
                    No hay roles para mostrar.
                  </td>
                </tr>
              ) : (
                visibleRoles.map((role) => (
                  <tr key={role.id}>
                    <td>
                      <div className="security-main-text">
                        <strong>{role.role_name}</strong>
                        <span>{role.role_key}</span>
                      </div>
                    </td>

                    <td>{role.description || "Sin descripción"}</td>

                    <td>
                      <span
                        className={`security-status ${
                          role.is_active
                            ? "security-status--active"
                            : "security-status--inactive"
                        }`}
                      >
                        {role.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td>
                      <div className="security-table-actions">
                        <Button type="button" size="sm" variant="secondary">
                          Editar
                        </Button>

                        <Button type="button" size="sm" variant="secondary">
                          Permisos
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