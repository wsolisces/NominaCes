// ======================================================
// PATH: src/modules/roles/pages/RolesPage.tsx
// Pantalla de administración de roles
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el catálogo controlado de roles.
 * - Permitir crear, editar, activar, inactivar y eliminar roles.
 * - Permitir consultar y modificar permisos asignados a un rol.
 * - Mostrar auditoría por rol.
 * - Usar estructura visual reutilizable del sistema.
 *
 * No debe:
 * - Definir layout principal.
 * - Consultar permisos globales fuera del módulo.
 * - Duplicar lógica del DataTable.
 * - Manejar autenticación de sesión.
 */

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  InputField,
  Modal,
  Page
} from "../../shared/ui";

import { RolesTable } from "./RolesTable";

import {
  createRoleRequest,
  deleteRoleRequest,
  getRoleAuditRequest,
  getRolePermissionsRequest,
  getRolesRequest,
  updateRolePermissionsRequest,
  updateRoleRequest
} from "./roles.api";

import type {
  RoleAuditDto,
  RoleDto,
  RoleFormState,
  RolePermissionDto,
  RolesSummary
} from "./roles.types";

import "./roles.css";

/**
 * Estado inicial del formulario.
 */
const EMPTY_FORM_STATE: RoleFormState = {
  roleKey: "",
  roleName: "",
  description: "",
  isActive: true
};

/**
 * Calcula el resumen superior del catálogo de roles.
 */
function getRolesSummary(roles: RoleDto[]): RolesSummary {
  return {
    total: roles.length,
    active: roles.filter((role) => role.isActive).length,
    inactive: roles.filter((role) => !role.isActive).length,
    system: roles.filter(
      (role) => role.roleKey.trim().toUpperCase() === "ADMINISTRADOR"
    ).length
  };
}

/**
 * Convierte un rol en estado editable.
 */
function toFormState(role: RoleDto): RoleFormState {
  return {
    roleKey: role.roleKey,
    roleName: role.roleName,
    description: role.description ?? "",
    isActive: role.isActive
  };
}

/**
 * Normaliza clave técnica de rol.
 */
function normalizeRoleKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
}

/**
 * Determina si un rol es protegido por sistema.
 */
function isProtectedRole(role: RoleDto): boolean {
  return role.roleKey.trim().toUpperCase() === "ADMINISTRADOR";
}

/**
 * Formatea fecha y hora para lectura.
 */
function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

/**
 * Obtiene texto visible de un valor booleano de auditoría.
 */
function formatStatus(value: boolean | null): string {
  if (value === null) {
    return "Sin dato";
  }

  return value ? "Activo" : "Inactivo";
}

/**
 * Obtiene texto visible de auditoría.
 */
function formatAuditText(value: string | null): string {
  const normalizedValue = value?.trim();

  return normalizedValue || "Sin dato";
}

/**
 * Normaliza texto de auditoría antes de compararlo.
 */
function normalizeAuditText(value: string | null): string {
  return value?.trim() ?? "";
}

/**
 * Determina si dos textos de auditoría cambiaron.
 */
function hasAuditTextChanged(
  oldValue: string | null,
  newValue: string | null
): boolean {
  return normalizeAuditText(oldValue) !== normalizeAuditText(newValue);
}

/**
 * Determina si un estado de auditoría cambió.
 */
function hasAuditStatusChanged(
  oldValue: boolean | null,
  newValue: boolean | null
): boolean {
  return oldValue !== newValue;
}

/**
 * Pantalla principal de administración de roles.
 */
export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [pageErrorMessage, setPageErrorMessage] = useState("");
  const [formErrorMessage, setFormErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedRole, setSelectedRole] = useState<RoleDto | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formState, setFormState] =
    useState<RoleFormState>(EMPTY_FORM_STATE);

  const [deleteRole, setDeleteRole] = useState<RoleDto | null>(null);

  const [permissionsRole, setPermissionsRole] =
    useState<RoleDto | null>(null);

  const [rolePermissions, setRolePermissions] = useState<
    RolePermissionDto[]
  >([]);

  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isPermissionsSaving, setIsPermissionsSaving] = useState(false);
  const [permissionsErrorMessage, setPermissionsErrorMessage] =
    useState("");

  const [auditRole, setAuditRole] = useState<RoleDto | null>(null);
  const [auditRows, setAuditRows] = useState<RoleAuditDto[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditErrorMessage, setAuditErrorMessage] = useState("");

  /**
   * Calcula el resumen visible de roles.
   */
  const summary = useMemo(() => getRolesSummary(roles), [roles]);

  /**
   * Agrupa permisos por módulo para el modal de asignación.
   */
  const groupedPermissions = useMemo(() => {
    return rolePermissions.reduce<Record<string, RolePermissionDto[]>>(
      (groups, permission) => {
        const moduleKey = permission.moduleKey.trim() || "SIN_MODULO";

        return {
          ...groups,
          [moduleKey]: [...(groups[moduleKey] ?? []), permission]
        };
      },
      {}
    );
  }, [rolePermissions]);

  /**
   * Indica cuántos permisos están asignados al rol seleccionado.
   */
  const assignedPermissionsCount = useMemo(() => {
    return rolePermissions.filter((permission) => permission.assigned)
      .length;
  }, [rolePermissions]);

  /**
   * Carga los roles desde el backend.
   */
  async function loadRoles(): Promise<void> {
    try {
      setIsLoading(true);
      setPageErrorMessage("");
      setSuccessMessage("");

      const result = await getRolesRequest();

      setRoles(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar roles.";

      setPageErrorMessage(message);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Abre el modal de creación.
   */
  function openCreateModal(): void {
    setIsCreateModalOpen(true);
    setSelectedRole(null);
    setFormState(EMPTY_FORM_STATE);
    setFormErrorMessage("");
    setSuccessMessage("");
  }

  /**
   * Abre el modal de edición.
   */
  function openEditModal(role: RoleDto): void {
    setSelectedRole(role);
    setIsCreateModalOpen(false);
    setFormState(toFormState(role));
    setFormErrorMessage("");
    setSuccessMessage("");
  }

  /**
   * Cierra el modal de creación o edición.
   */
  function closeFormModal(): void {
    if (isSaving) {
      return;
    }

    setIsCreateModalOpen(false);
    setSelectedRole(null);
    setFormState(EMPTY_FORM_STATE);
    setFormErrorMessage("");
  }

  /**
   * Valida información del formulario antes de enviarla.
   */
  function validateForm(): string {
    const roleKey = formState.roleKey.trim();
    const roleName = formState.roleName.trim();

    if (isCreateModalOpen && !roleKey) {
      return "La clave técnica del rol es obligatoria.";
    }

    if (isCreateModalOpen && roleKey.length < 3) {
      return "La clave técnica debe contener al menos 3 caracteres.";
    }

    if (isCreateModalOpen && !/^[A-Z0-9_]+$/.test(roleKey)) {
      return "La clave técnica solo puede contener letras mayúsculas, números y guion bajo.";
    }

    if (!roleName) {
      return "El nombre del rol es obligatorio.";
    }

    if (roleName.length < 3) {
      return "El nombre del rol debe contener al menos 3 caracteres.";
    }

    if (formState.description.trim().length > 500) {
      return "La descripción no puede superar los 500 caracteres.";
    }

    return "";
  }

  /**
   * Crea o actualiza un rol.
   */
  async function handleSubmitForm(): Promise<void> {
    if (isSaving) {
      return;
    }

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setFormErrorMessage("");
      setSuccessMessage("");

      if (isCreateModalOpen) {
        const created = await createRoleRequest({
          roleKey: normalizeRoleKey(formState.roleKey),
          roleName: formState.roleName.trim(),
          description: formState.description.trim() || null,
          isActive: formState.isActive
        });

        setRoles((currentRoles) => [created, ...currentRoles]);
        setSuccessMessage("Rol creado correctamente.");
      } else if (selectedRole) {
        const updated = await updateRoleRequest(selectedRole.id, {
          roleName: formState.roleName.trim(),
          description: formState.description.trim() || null,
          isActive: formState.isActive
        });

        setRoles((currentRoles) =>
          currentRoles.map((role) =>
            role.id === updated.id ? updated : role
          )
        );

        setSuccessMessage("Rol actualizado correctamente.");
      }

      setIsCreateModalOpen(false);
      setSelectedRole(null);
      setFormState(EMPTY_FORM_STATE);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible guardar el rol.";

      setFormErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Activa o inactiva un rol.
   */
  async function handleToggleStatus(role: RoleDto): Promise<void> {
    if (isSaving || isProtectedRole(role)) {
      return;
    }

    try {
      setIsSaving(true);
      setPageErrorMessage("");
      setSuccessMessage("");

      const updated = await updateRoleRequest(role.id, {
        roleName: role.roleName,
        description: role.description,
        isActive: !role.isActive
      });

      setRoles((currentRoles) =>
        currentRoles.map((currentRole) =>
          currentRole.id === updated.id ? updated : currentRole
        )
      );

      setSuccessMessage(
        updated.isActive
          ? "Rol activado correctamente."
          : "Rol inactivado correctamente."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado del rol.";

      setPageErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Abre confirmación de eliminación.
   */
  function openDeleteModal(role: RoleDto): void {
    setDeleteRole(role);
    setPageErrorMessage("");
    setSuccessMessage("");
  }

  /**
   * Cierra confirmación de eliminación.
   */
  function closeDeleteModal(): void {
    if (isSaving) {
      return;
    }

    setDeleteRole(null);
  }

  /**
   * Elimina un rol.
   */
  async function handleDeleteRole(): Promise<void> {
    if (!deleteRole || isSaving || isProtectedRole(deleteRole)) {
      return;
    }

    try {
      setIsSaving(true);
      setPageErrorMessage("");
      setSuccessMessage("");

      await deleteRoleRequest(deleteRole.id);

      setRoles((currentRoles) =>
        currentRoles.filter((role) => role.id !== deleteRole.id)
      );

      setDeleteRole(null);
      setSuccessMessage("Rol eliminado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el rol.";

      setPageErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Abre modal de permisos asignados.
   */
  async function openPermissionsModal(role: RoleDto): Promise<void> {
    try {
      setPermissionsRole(role);
      setRolePermissions([]);
      setPermissionsErrorMessage("");
      setIsPermissionsLoading(true);

      const permissions = await getRolePermissionsRequest(role.id);

      setRolePermissions(permissions);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar permisos del rol.";

      setPermissionsErrorMessage(message);
    } finally {
      setIsPermissionsLoading(false);
    }
  }

  /**
   * Cierra modal de permisos.
   */
  function closePermissionsModal(): void {
    if (isPermissionsSaving) {
      return;
    }

    setPermissionsRole(null);
    setRolePermissions([]);
    setPermissionsErrorMessage("");
  }

  /**
   * Cambia un permiso asignado localmente.
   */
  function togglePermission(permissionKey: string): void {
    setRolePermissions((currentPermissions) =>
      currentPermissions.map((permission) =>
        permission.permissionKey === permissionKey
          ? {
              ...permission,
              assigned: !permission.assigned
            }
          : permission
      )
    );
  }

  /**
   * Guarda permisos asignados al rol.
   */
  async function handleSavePermissions(): Promise<void> {
    if (!permissionsRole || isPermissionsSaving) {
      return;
    }

    try {
      setIsPermissionsSaving(true);
      setPermissionsErrorMessage("");
      setSuccessMessage("");

      const permissionKeys = rolePermissions
        .filter((permission) => permission.assigned)
        .map((permission) => permission.permissionKey);

      const updatedPermissions = await updateRolePermissionsRequest(
        permissionsRole.id,
        {
          permissionKeys
        }
      );

      setRolePermissions(updatedPermissions);
      setPermissionsRole(null);
      setRolePermissions([]);
      setSuccessMessage("Permisos del rol actualizados correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar permisos del rol.";

      setPermissionsErrorMessage(message);
    } finally {
      setIsPermissionsSaving(false);
    }
  }

  /**
   * Abre modal de auditoría.
   */
  async function openAuditModal(role: RoleDto): Promise<void> {
    try {
      setAuditRole(role);
      setAuditRows([]);
      setAuditErrorMessage("");
      setIsAuditLoading(true);

      const audit = await getRoleAuditRequest(role.id);

      setAuditRows(audit);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar la auditoría del rol.";

      setAuditErrorMessage(message);
    } finally {
      setIsAuditLoading(false);
    }
  }

  /**
   * Cierra modal de auditoría.
   */
  function closeAuditModal(): void {
    setAuditRole(null);
    setAuditRows([]);
    setAuditErrorMessage("");
  }

  useEffect(() => {
    void loadRoles();
  }, []);

  const formModalTitle = isCreateModalOpen
    ? "Crear rol"
    : "Editar rol";

  const formModalEyebrow = isCreateModalOpen
    ? "Nuevo perfil de acceso"
    : "Configuración del rol";

  return (
    <Page
      breadcrumb="Administración / Roles"
      title="Roles del sistema"
      description="Consulta, crea y administra los roles que agrupan permisos para controlar el acceso de usuarios dentro de NominaCes."
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadRoles()}
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button
            type="button"
            onClick={openCreateModal}
            disabled={isLoading}
          >
            Nuevo rol
          </Button>
        </>
      }
    >
      <section className="roles-kpis" aria-label="Resumen de roles">
        <article className="roles-kpi">
          <span className="roles-kpi__label">Total de roles</span>
          <strong className="roles-kpi__value">{summary.total}</strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">Roles activos</span>
          <strong className="roles-kpi__value">{summary.active}</strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">Roles inactivos</span>
          <strong className="roles-kpi__value">{summary.inactive}</strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">Roles protegidos</span>
          <strong className="roles-kpi__value">{summary.system}</strong>
        </article>
      </section>

      {successMessage ? (
        <div
          className="roles-alert roles-alert--success"
          role="status"
          aria-live="polite"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            className="roles-alert__close"
            aria-label="Cerrar mensaje"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="roles-panel">
        <RolesTable
          roles={roles}
          isLoading={isLoading}
          errorMessage={pageErrorMessage}
          onEdit={openEditModal}
          onToggleStatus={(role) => void handleToggleStatus(role)}
          onDelete={openDeleteModal}
          onPermissions={(role) => void openPermissionsModal(role)}
          onAudit={(role) => void openAuditModal(role)}
        />
      </section>

      <Modal
        open={isCreateModalOpen || Boolean(selectedRole)}
        title={formModalTitle}
        eyebrow={formModalEyebrow}
        size="md"
        onClose={closeFormModal}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeFormModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void handleSubmitForm()}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </>
        }
      >
        <div className="app-modal-content-grid">
          <div className="roles-edit-summary">
            <div className="roles-edit-summary__content">
              <span className="roles-edit-summary__label">
                Clave técnica
              </span>

              <strong className="roles-edit-summary__key">
                {isCreateModalOpen
                  ? normalizeRoleKey(formState.roleKey) || "NUEVO_ROL"
                  : selectedRole?.roleKey}
              </strong>
            </div>

            <span
              className={
                formState.isActive
                  ? "roles-edit-summary__status roles-edit-summary__status--active"
                  : "roles-edit-summary__status roles-edit-summary__status--inactive"
              }
            >
              {formState.isActive ? "Activo" : "Inactivo"}
            </span>
          </div>

          {formErrorMessage ? (
            <div
              className="roles-alert roles-alert--error"
              role="alert"
            >
              {formErrorMessage}
            </div>
          ) : null}

          {isCreateModalOpen ? (
            <InputField
              label="Clave técnica"
              value={formState.roleKey}
              placeholder="Ejemplo: SUPERVISOR_RH"
              maxLength={80}
              disabled={isSaving}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  roleKey: normalizeRoleKey(event.target.value)
                }))
              }
            />
          ) : null}

          <InputField
            label="Nombre visible"
            value={formState.roleName}
            placeholder="Ejemplo: Supervisor de Recursos Humanos"
            maxLength={120}
            disabled={isSaving}
            onChange={(event) =>
              setFormState((currentState) => ({
                ...currentState,
                roleName: event.target.value
              }))
            }
          />

          <label className="app-modal-switch-control">
            <span className="app-modal-field__label">
              Estado del rol
            </span>

            <span className="app-modal-switch-row">
              <span className="app-modal-switch-text">
                {formState.isActive ? "Rol activo" : "Rol inactivo"}
              </span>

              <input
                className="app-modal-switch-input"
                type="checkbox"
                checked={formState.isActive}
                disabled={
                  isSaving ||
                  Boolean(selectedRole && isProtectedRole(selectedRole))
                }
                aria-label="Cambiar estado del rol"
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    isActive: event.target.checked
                  }))
                }
              />

              <span className="app-modal-switch" aria-hidden="true">
                <span className="app-modal-switch__thumb" />
              </span>
            </span>
          </label>

          <label className="app-modal-field">
            <span className="app-modal-field__label">Descripción</span>

            <textarea
              className="app-modal-textarea"
              value={formState.description}
              rows={3}
              maxLength={500}
              disabled={isSaving}
              placeholder="Describe brevemente qué tipo de acceso concede este rol."
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  description: event.target.value
                }))
              }
            />

            <span className="app-modal-field__helper">
              {formState.description.length} de 500 caracteres
            </span>
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteRole)}
        title="Eliminar rol"
        eyebrow="Confirmación requerida"
        size="sm"
        onClose={closeDeleteModal}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={() => void handleDeleteRole()}
              disabled={isSaving}
            >
              {isSaving ? "Eliminando..." : "Eliminar rol"}
            </Button>
          </>
        }
      >
        {deleteRole ? (
          <div className="roles-delete-confirm">
            <p>
              Se eliminará el rol{" "}
              <strong>{deleteRole.roleName}</strong>.
            </p>

            <p>
              Esta acción solo debe permitirse cuando el rol no tenga
              usuarios dependientes ni reglas críticas asociadas.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(permissionsRole)}
        title="Permisos del rol"
        eyebrow="Asignación de funcionalidades"
        size="lg"
        onClose={closePermissionsModal}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closePermissionsModal}
              disabled={isPermissionsSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void handleSavePermissions()}
              disabled={isPermissionsSaving || isPermissionsLoading}
            >
              {isPermissionsSaving
                ? "Guardando..."
                : "Guardar permisos"}
            </Button>
          </>
        }
      >
        {permissionsRole ? (
          <div className="app-modal-content-grid">
            <div className="roles-permissions-summary">
              <div>
                <span className="roles-permissions-summary__label">
                  Rol seleccionado
                </span>

                <strong className="roles-permissions-summary__name">
                  {permissionsRole.roleName}
                </strong>
              </div>

              <span className="roles-permissions-summary__count">
                {assignedPermissionsCount} permisos asignados
              </span>
            </div>

            {permissionsErrorMessage ? (
              <div
                className="roles-alert roles-alert--error"
                role="alert"
              >
                {permissionsErrorMessage}
              </div>
            ) : null}

            {isPermissionsLoading ? (
              <div className="roles-permissions-empty">
                Cargando permisos...
              </div>
            ) : rolePermissions.length === 0 ? (
              <div className="roles-permissions-empty">
                No hay permisos disponibles para asignar.
              </div>
            ) : (
              <div className="roles-permissions-groups">
                {Object.entries(groupedPermissions).map(
                  ([moduleKey, permissions]) => (
                    <section
                      key={moduleKey}
                      className="roles-permissions-group"
                    >
                      <h3 className="roles-permissions-group__title">
                        {moduleKey}
                      </h3>

                      <div className="roles-permissions-list">
                        {permissions.map((permission) => (
                          <label
                            key={permission.permissionKey}
                            className={
                              permission.assigned
                                ? "roles-permission-option roles-permission-option--checked"
                                : "roles-permission-option"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={permission.assigned}
                              disabled={
                                isPermissionsSaving ||
                                !permission.isActive
                              }
                              onChange={() =>
                                togglePermission(
                                  permission.permissionKey
                                )
                              }
                            />

                            <span className="roles-permission-option__body">
                              <strong>
                                {permission.permissionName}
                              </strong>

                              <span>
                                {permission.description ||
                                  permission.permissionKey}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  )
                )}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(auditRole)}
        title="Auditoría del rol"
        eyebrow="Historial de cambios"
        size="lg"
        onClose={closeAuditModal}
        footer={
          <Button
            type="button"
            variant="secondary"
            onClick={closeAuditModal}
          >
            Cerrar
          </Button>
        }
      >
        {auditRole ? (
          <div className="app-modal-content-grid">
            <div className="roles-audit-info">
              <span className="roles-audit-info__label">
                Rol consultado
              </span>

              <strong className="roles-audit-info__key">
                {auditRole.roleKey}
              </strong>
            </div>

            {auditErrorMessage ? (
              <div
                className="roles-alert roles-alert--error"
                role="alert"
              >
                {auditErrorMessage}
              </div>
            ) : null}

            <div className="roles-table-wrapper">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {isAuditLoading ? (
                    <tr>
                      <td colSpan={5} className="roles-table__empty">
                        Cargando auditoría...
                      </td>
                    </tr>
                  ) : auditErrorMessage ? null : auditRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="roles-table__empty">
                        Este rol aún no tiene auditoría.
                      </td>
                    </tr>
                  ) : (
                    auditRows.map((audit) => {
                      const roleNameChanged = hasAuditTextChanged(
                        audit.oldRoleName,
                        audit.newRoleName
                      );

                      const descriptionChanged = hasAuditTextChanged(
                        audit.oldDescription,
                        audit.newDescription
                      );

                      const statusChanged = hasAuditStatusChanged(
                        audit.oldIsActive,
                        audit.newIsActive
                      );

                      return (
                        <tr key={audit.id}>
                          <td>{formatDateTime(audit.changedAt)}</td>

                          <td>
                            {audit.changedByFullName ||
                              audit.changedByUsername ||
                              "Sistema"}
                          </td>

                          <td>
                            {roleNameChanged ? (
                              <div className="roles-audit-change">
                                <span className="roles-audit-change__old">
                                  {formatAuditText(audit.oldRoleName)}
                                </span>

                                <span
                                  className="roles-audit-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="roles-audit-change__new">
                                  {formatAuditText(audit.newRoleName)}
                                </span>
                              </div>
                            ) : (
                              <span className="roles-audit-change__same">
                                {formatAuditText(
                                  audit.newRoleName ??
                                    audit.oldRoleName
                                )}
                              </span>
                            )}
                          </td>

                          <td>
                            {descriptionChanged ? (
                              <div className="roles-audit-change">
                                <span className="roles-audit-change__old">
                                  {formatAuditText(
                                    audit.oldDescription
                                  )}
                                </span>

                                <span
                                  className="roles-audit-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="roles-audit-change__new">
                                  {formatAuditText(
                                    audit.newDescription
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="roles-audit-change__same">
                                {formatAuditText(
                                  audit.newDescription ??
                                    audit.oldDescription
                                )}
                              </span>
                            )}
                          </td>

                          <td>
                            {statusChanged ? (
                              <div className="roles-audit-status-change">
                                <span className="roles-audit-status">
                                  {formatStatus(audit.oldIsActive)}
                                </span>

                                <span
                                  className="roles-audit-status-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="roles-audit-status roles-audit-status--changed">
                                  {formatStatus(audit.newIsActive)}
                                </span>
                              </div>
                            ) : (
                              <span className="roles-audit-status">
                                {formatStatus(
                                  audit.newIsActive ??
                                    audit.oldIsActive
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </Page>
  );
}