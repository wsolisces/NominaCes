// ======================================================
// PATH: src/modules/roles/pages/RolesPage.tsx
// Pantalla de administración de roles
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar los roles registrados en el sistema.
 * - Permitir crear y editar roles.
 * - Permitir asignar permisos a los roles.
 * - Permitir activar, inactivar y eliminar roles.
 * - Coordinar los modales y mensajes de la pantalla.
 *
 * No debe:
 * - Consultar directamente mediante fetch.
 * - Definir las columnas de la tabla.
 * - Crear o eliminar permisos técnicos.
 * - Definir el layout principal.
 */

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  InputField,
  Modal,
  Page
} from "../../../shared/ui";

import { getPermissionsRequest } from "../../permisos/permisos.api";

import type { PermissionDto } from "../../permisos/permisos.types";

import { RolesTable } from "../components/RolesTable";

import {
  activateRoleRequest,
  createRoleRequest,
  deactivateRoleRequest,
  deleteRoleRequest,
  getRolesRequest,
  updateRoleRequest
} from "../roles.api";

import type {
  RoleDto,
  RoleFormState,
  RolesSummary
} from "../roles.types";

import "../roles.css";

/**
 * Modos disponibles para el formulario.
 */
type RoleFormMode = "create" | "edit";

/**
 * Estado inicial del formulario.
 */
const EMPTY_FORM_STATE: RoleFormState = {
  roleKey: "",
  roleName: "",
  description: "",
  permissions: []
};

/**
 * Normaliza una clave técnica.
 */
function normalizeRoleKey(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Convierte un rol existente en estado editable.
 */
function toFormState(role: RoleDto): RoleFormState {
  return {
    roleKey: role.roleKey,
    roleName: role.roleName,
    description: role.description ?? "",
    permissions: [...role.permissions]
  };
}

/**
 * Calcula los indicadores superiores.
 */
function getRolesSummary(roles: RoleDto[]): RolesSummary {
  return {
    total: roles.length,

    active: roles.filter((role) => role.isActive).length,

    inactive: roles.filter((role) => !role.isActive).length,

    assignedPermissions: roles.reduce(
      (total, role) => total + role.permissions.length,
      0
    )
  };
}

/**
 * Agrupa permisos activos mediante su módulo.
 */
function groupPermissionsByModule(
  permissions: PermissionDto[]
): Array<{
  moduleKey: string;
  permissions: PermissionDto[];
}> {
  const groups = new Map<string, PermissionDto[]>();

  permissions
    .filter((permission) => permission.isActive)
    .forEach((permission) => {
      const moduleKey =
        permission.moduleKey?.trim() || "GENERAL";

      const currentPermissions =
        groups.get(moduleKey) ?? [];

      currentPermissions.push(permission);

      groups.set(moduleKey, currentPermissions);
    });

  return Array.from(groups.entries())
    .map(([moduleKey, modulePermissions]) => ({
      moduleKey,

      permissions: [...modulePermissions].sort(
        (firstPermission, secondPermission) =>
          firstPermission.permissionName.localeCompare(
            secondPermission.permissionName,
            "es"
          )
      )
    }))
    .sort((firstGroup, secondGroup) =>
      firstGroup.moduleKey.localeCompare(
        secondGroup.moduleKey,
        "es"
      )
    );
}

/**
 * Pantalla principal de roles.
 */
export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [changingStatusId, setChangingStatusId] =
    useState<number | null>(null);

  const [deletingRoleId, setDeletingRoleId] =
    useState<number | null>(null);

  const [pageErrorMessage, setPageErrorMessage] =
    useState("");

  const [formErrorMessage, setFormErrorMessage] =
    useState("");

  const [deleteErrorMessage, setDeleteErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formMode, setFormMode] =
    useState<RoleFormMode>("create");

  const [selectedRole, setSelectedRole] =
    useState<RoleDto | null>(null);

  const [rolePendingDelete, setRolePendingDelete] =
    useState<RoleDto | null>(null);

  const [formState, setFormState] =
    useState<RoleFormState>(EMPTY_FORM_STATE);

  /**
   * Indicadores superiores.
   */
  const summary = useMemo(
    () => getRolesSummary(roles),
    [roles]
  );

  /**
   * Permisos agrupados por módulo.
   */
  const permissionGroups = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  /**
   * Claves de permisos activos.
   */
  const activePermissionKeys = useMemo(
    () =>
      permissions
        .filter((permission) => permission.isActive)
        .map((permission) => permission.permissionKey),
    [permissions]
  );

  /**
   * Indica si todos los permisos activos están seleccionados.
   */
  const allPermissionsSelected = useMemo(
    () =>
      activePermissionKeys.length > 0 &&
      activePermissionKeys.every((permissionKey) =>
        formState.permissions.includes(permissionKey)
      ),
    [activePermissionKeys, formState.permissions]
  );

  /**
   * Carga roles y permisos desde el backend.
   */
  async function loadPageData(): Promise<void> {
    try {
      setIsLoading(true);
      setPageErrorMessage("");

      const [rolesResult, permissionsResult] =
        await Promise.all([
          getRolesRequest(),
          getPermissionsRequest()
        ]);

      setRoles(rolesResult);
      setPermissions(permissionsResult);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar los roles.";

      setPageErrorMessage(message);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Abre el formulario para crear un rol.
   */
  function openCreateModal(): void {
    setFormMode("create");
    setSelectedRole(null);
    setFormState({ ...EMPTY_FORM_STATE });
    setFormErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
  }

  /**
   * Abre el formulario para editar un rol.
   */
  function openEditModal(role: RoleDto): void {
    setFormMode("edit");
    setSelectedRole(role);
    setFormState(toFormState(role));
    setFormErrorMessage("");
    setSuccessMessage("");
    setIsFormOpen(true);
  }

  /**
   * Cierra el formulario.
   */
  function closeFormModal(): void {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setSelectedRole(null);
    setFormState({ ...EMPTY_FORM_STATE });
    setFormErrorMessage("");
  }

  /**
   * Abre la confirmación para eliminar.
   */
  function openDeleteModal(role: RoleDto): void {
    setRolePendingDelete(role);
    setDeleteErrorMessage("");
    setSuccessMessage("");
  }

  /**
   * Cierra la confirmación para eliminar.
   */
  function closeDeleteModal(): void {
    if (deletingRoleId !== null) {
      return;
    }

    setRolePendingDelete(null);
    setDeleteErrorMessage("");
  }

  /**
   * Valida los datos del formulario.
   */
  function validateForm(): string {
    const roleKey = formState.roleKey.trim();
    const roleName = formState.roleName.trim();
    const description = formState.description.trim();

    if (formMode === "create" && !roleKey) {
      return "La clave técnica del rol es obligatoria.";
    }

    if (
      formMode === "create" &&
      !/^[A-Z0-9_]{3,80}$/.test(roleKey)
    ) {
      return "La clave debe usar letras mayúsculas, números y guion bajo.";
    }

    if (!roleName) {
      return "El nombre del rol es obligatorio.";
    }

    if (roleName.length < 3) {
      return "El nombre debe contener al menos 3 caracteres.";
    }

    if (roleName.length > 120) {
      return "El nombre no puede superar los 120 caracteres.";
    }

    if (description.length > 500) {
      return "La descripción no puede superar los 500 caracteres.";
    }

    return "";
  }

  /**
   * Crea o actualiza un rol.
   */
  async function handleSubmitRole(): Promise<void> {
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

      if (formMode === "create") {
        const createdRole = await createRoleRequest({
          roleKey: formState.roleKey.trim(),
          roleName: formState.roleName.trim(),
          description: formState.description.trim() || null,
          permissions: formState.permissions
        });

        setRoles((currentRoles) => [
          ...currentRoles,
          createdRole
        ]);

        setSuccessMessage("Rol creado correctamente.");
      }

      if (formMode === "edit" && selectedRole) {
        const updatedRole = await updateRoleRequest(
          selectedRole.id,
          {
            roleName: formState.roleName.trim(),
            description:
              formState.description.trim() || null,
            permissions: formState.permissions
          }
        );

        setRoles((currentRoles) =>
          currentRoles.map((role) =>
            role.id === updatedRole.id
              ? updatedRole
              : role
          )
        );

        setSuccessMessage("Rol actualizado correctamente.");
      }

      setIsFormOpen(false);
      setSelectedRole(null);
      setFormState({ ...EMPTY_FORM_STATE });
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
  async function handleToggleStatus(
    role: RoleDto
  ): Promise<void> {
    if (changingStatusId !== null) {
      return;
    }

    try {
      setChangingStatusId(role.id);
      setPageErrorMessage("");
      setSuccessMessage("");

      const updatedRole = role.isActive
        ? await deactivateRoleRequest(role.id)
        : await activateRoleRequest(role.id);

      setRoles((currentRoles) =>
        currentRoles.map((currentRole) =>
          currentRole.id === updatedRole.id
            ? updatedRole
            : currentRole
        )
      );

      setSuccessMessage(
        updatedRole.isActive
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
      setChangingStatusId(null);
    }
  }

  /**
   * Elimina permanentemente el rol seleccionado.
   */
  async function handleDeleteRole(): Promise<void> {
    if (!rolePendingDelete || deletingRoleId !== null) {
      return;
    }

    try {
      setDeletingRoleId(rolePendingDelete.id);
      setDeleteErrorMessage("");
      setSuccessMessage("");

      await deleteRoleRequest(rolePendingDelete.id);

      setRoles((currentRoles) =>
        currentRoles.filter(
          (role) => role.id !== rolePendingDelete.id
        )
      );

      setRolePendingDelete(null);
      setSuccessMessage("Rol eliminado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el rol.";

      setDeleteErrorMessage(message);
    } finally {
      setDeletingRoleId(null);
    }
  }

  /**
   * Agrega o elimina un permiso de la selección.
   */
  function togglePermission(permissionKey: string): void {
    setFormState((currentState) => {
      const isSelected =
        currentState.permissions.includes(permissionKey);

      return {
        ...currentState,

        permissions: isSelected
          ? currentState.permissions.filter(
              (currentPermissionKey) =>
                currentPermissionKey !== permissionKey
            )
          : [
              ...currentState.permissions,
              permissionKey
            ]
      };
    });
  }

  /**
   * Selecciona o elimina todos los permisos activos.
   */
  function toggleAllPermissions(): void {
    setFormState((currentState) => ({
      ...currentState,

      permissions: allPermissionsSelected
        ? []
        : activePermissionKeys
    }));
  }

  useEffect(() => {
    void loadPageData();
  }, []);

  return (
    <Page
      breadcrumb="Administración / Roles"
      title="Roles del sistema"
      description="Administra los roles utilizados para agrupar permisos y controlar el acceso de los usuarios."
      actions={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void loadPageData()}
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
      <section
        className="roles-kpis"
        aria-label="Resumen de roles"
      >
        <article className="roles-kpi">
          <span className="roles-kpi__label">
            Total de roles
          </span>

          <strong className="roles-kpi__value">
            {summary.total}
          </strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">
            Roles activos
          </span>

          <strong className="roles-kpi__value">
            {summary.active}
          </strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">
            Roles inactivos
          </span>

          <strong className="roles-kpi__value">
            {summary.inactive}
          </strong>
        </article>

        <article className="roles-kpi">
          <span className="roles-kpi__label">
            Permisos asignados
          </span>

          <strong className="roles-kpi__value">
            {summary.assignedPermissions}
          </strong>
        </article>
      </section>

      {successMessage ? (
        <div
          className="roles-alert roles-alert--success"
          role="status"
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
          changingStatusId={changingStatusId}
          deletingRoleId={deletingRoleId}
          onEdit={openEditModal}
          onToggleStatus={(role) =>
            void handleToggleStatus(role)
          }
          onDelete={openDeleteModal}
        />
      </section>

      <Modal
        open={isFormOpen}
        title={
          formMode === "create"
            ? "Crear rol"
            : "Editar rol"
        }
        eyebrow="Configuración del rol"
        size="lg"
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
              onClick={() => void handleSubmitRole()}
              disabled={isSaving}
            >
              {isSaving
                ? "Guardando..."
                : formMode === "create"
                  ? "Crear rol"
                  : "Guardar cambios"}
            </Button>
          </>
        }
      >
        <div className="roles-modal-content">
          {formErrorMessage ? (
            <div
              className="roles-alert roles-alert--error"
              role="alert"
            >
              {formErrorMessage}
            </div>
          ) : null}

          <div className="roles-form-grid">
            <InputField
              label="Clave técnica"
              value={formState.roleKey}
              placeholder="Ejemplo: RECURSOS_HUMANOS"
              maxLength={80}
              disabled={isSaving || formMode === "edit"}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  roleKey: normalizeRoleKey(
                    event.target.value
                  )
                }))
              }
            />

            <InputField
              label="Nombre visible"
              value={formState.roleName}
              placeholder="Ejemplo: Recursos Humanos"
              maxLength={120}
              disabled={isSaving}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  roleName: event.target.value
                }))
              }
            />
          </div>

          <label className="roles-field">
            <span className="roles-field__label">
              Descripción
            </span>

            <textarea
              className="roles-textarea"
              value={formState.description}
              rows={3}
              maxLength={500}
              disabled={isSaving}
              placeholder="Describe brevemente la función del rol."
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  description: event.target.value
                }))
              }
            />

            <span className="roles-field__helper">
              {formState.description.length} de 500 caracteres
            </span>
          </label>

          <section className="roles-permissions">
            <header className="roles-permissions__header">
              <div>
                <h3 className="roles-permissions__title">
                  Permisos asignados
                </h3>

                <p className="roles-permissions__description">
                  Selecciona las acciones disponibles para este rol.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={toggleAllPermissions}
                disabled={
                  isSaving ||
                  activePermissionKeys.length === 0
                }
              >
                {allPermissionsSelected
                  ? "Limpiar selección"
                  : "Seleccionar todos"}
              </Button>
            </header>

            <div className="roles-permissions__summary">
              {formState.permissions.length} permiso(s) seleccionado(s)
            </div>

            <div className="roles-permissions__groups">
              {permissionGroups.length === 0 ? (
                <div className="roles-permissions__empty">
                  No existen permisos activos disponibles.
                </div>
              ) : (
                permissionGroups.map((group) => (
                  <article
                    key={group.moduleKey}
                    className="roles-permission-group"
                  >
                    <header className="roles-permission-group__header">
                      <strong className="roles-permission-group__title">
                        {group.moduleKey}
                      </strong>

                      <span className="roles-permission-group__count">
                        {group.permissions.length}
                      </span>
                    </header>

                    <div className="roles-permission-group__list">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission.permissionKey}
                          className="roles-permission-option"
                        >
                          <input
                            type="checkbox"
                            checked={formState.permissions.includes(
                              permission.permissionKey
                            )}
                            disabled={isSaving}
                            onChange={() =>
                              togglePermission(
                                permission.permissionKey
                              )
                            }
                          />

                          <span className="roles-permission-option__content">
                            <strong className="roles-permission-option__name">
                              {permission.permissionName}
                            </strong>

                            <span className="roles-permission-option__key">
                              {permission.permissionKey}
                            </span>

                            {permission.description ? (
                              <span className="roles-permission-option__description">
                                {permission.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </Modal>

      <Modal
        open={Boolean(rolePendingDelete)}
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
              disabled={deletingRoleId !== null}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={() => void handleDeleteRole()}
              disabled={deletingRoleId !== null}
            >
              {deletingRoleId !== null
                ? "Eliminando..."
                : "Eliminar rol"}
            </Button>
          </>
        }
      >
        {rolePendingDelete ? (
          <div className="roles-modal-content">
            {deleteErrorMessage ? (
              <div
                className="roles-alert roles-alert--error"
                role="alert"
              >
                {deleteErrorMessage}
              </div>
            ) : null}

            <div className="roles-delete-summary">
              <span className="roles-delete-summary__label">
                Rol seleccionado
              </span>

              <strong className="roles-delete-summary__name">
                {rolePendingDelete.roleName}
              </strong>

              <span className="roles-delete-summary__key">
                {rolePendingDelete.roleKey}
              </span>
            </div>

            <p className="roles-delete-warning">
              Esta acción eliminará permanentemente el rol y sus
              permisos asignados. No podrá eliminarse si tiene
              usuarios asociados.
            </p>
          </div>
        ) : null}
      </Modal>
    </Page>
  );
}