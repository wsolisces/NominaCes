// ======================================================
// PATH: src/modules/permisos/pages/PermisosPage.tsx
// Pantalla de administración de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el catálogo controlado de permisos.
 * - Permitir edición de metadata autorizada.
 * - Permitir activar o inactivar permisos.
 * - Mostrar auditoría por permiso.
 * - Resaltar únicamente los valores modificados en auditoría.
 * - Usar estructura visual reutilizable del sistema.
 *
 * No debe:
 * - Crear permisos técnicos desde pantalla.
 * - Eliminar permisos.
 * - Asignar permisos a roles o usuarios.
 * - Definir layout principal.
 * - Implementar manualmente búsqueda, filtros o configuración de columnas.
 */

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  InputField,
  Modal,
  Page
} from "../../../shared/ui";

import { PermissionsTable } from "../components/PermissionsTable";

import {
  getPermissionAuditRequest,
  getPermissionsRequest,
  updatePermissionRequest
} from "../permisos.api";

import type {
  PermissionAuditDto,
  PermissionDto,
  PermissionFormState,
  PermissionsSummary
} from "../permisos.types";

import "../permisos.css";

/**
 * Estado inicial del formulario de edición.
 */
const EMPTY_FORM_STATE: PermissionFormState = {
  permissionName: "",
  moduleKey: "",
  description: "",
  isActive: true
};

/**
 * Calcula el resumen superior del catálogo de permisos.
 */
function getPermissionsSummary(
  permissions: PermissionDto[]
): PermissionsSummary {
  const modules = new Set(
    permissions
      .map((permission) => permission.moduleKey.trim())
      .filter(Boolean)
  );

  return {
    total: permissions.length,
    active: permissions.filter((permission) => permission.isActive)
      .length,
    inactive: permissions.filter((permission) => !permission.isActive)
      .length,
    modules: modules.size
  };
}

/**
 * Convierte un permiso en estado editable.
 */
function toFormState(
  permission: PermissionDto
): PermissionFormState {
  return {
    permissionName: permission.permissionName,
    moduleKey: permission.moduleKey,
    description: permission.description ?? "",
    isActive: permission.isActive
  };
}

/**
 * Formatea una fecha y hora para lectura.
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
 * Obtiene el texto visible de un valor booleano de auditoría.
 */
function formatStatus(value: boolean | null): string {
  if (value === null) {
    return "Sin dato";
  }

  return value ? "Activo" : "Inactivo";
}

/**
 * Obtiene el texto visible de un valor nullable.
 */
function formatAuditText(value: string | null): string {
  const normalizedValue = value?.trim();

  return normalizedValue || "Sin dato";
}

/**
 * Normaliza un texto de auditoría antes de compararlo.
 */
function normalizeAuditText(value: string | null): string {
  return value?.trim() ?? "";
}

/**
 * Determina si dos textos de auditoría son diferentes.
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
 * Pantalla principal de administración de permisos.
 */
export default function PermisosPage() {
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [changingStatusKey, setChangingStatusKey] = useState<
    string | null
  >(null);

  const [pageErrorMessage, setPageErrorMessage] = useState("");
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedPermission, setSelectedPermission] =
    useState<PermissionDto | null>(null);

  const [formState, setFormState] =
    useState<PermissionFormState>(EMPTY_FORM_STATE);

  const [auditPermission, setAuditPermission] =
    useState<PermissionDto | null>(null);

  const [auditRows, setAuditRows] = useState<PermissionAuditDto[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditErrorMessage, setAuditErrorMessage] = useState("");

  /**
   * Obtiene los módulos existentes sin valores repetidos.
   */
  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(
        permissions
          .map((permission) => permission.moduleKey.trim())
          .filter(Boolean)
      )
    ).sort((firstModule, secondModule) =>
      firstModule.localeCompare(secondModule, "es")
    );
  }, [permissions]);

  /**
   * Calcula el resumen visible de permisos.
   */
  const summary = useMemo(
    () => getPermissionsSummary(permissions),
    [permissions]
  );

  /**
   * Carga los permisos desde el backend.
   */
  async function loadPermissions(): Promise<void> {
    try {
      setIsLoading(true);
      setPageErrorMessage("");
      setSuccessMessage("");

      const result = await getPermissionsRequest();

      setPermissions(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar permisos.";

      setPageErrorMessage(message);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Abre el modal de edición de un permiso.
   */
  function openEditModal(permission: PermissionDto): void {
    setSelectedPermission(permission);
    setFormState(toFormState(permission));
    setEditErrorMessage("");
    setSuccessMessage("");
  }

  /**
   * Cierra el modal de edición.
   */
  function closeEditModal(): void {
    if (isSaving) {
      return;
    }

    setSelectedPermission(null);
    setFormState(EMPTY_FORM_STATE);
    setEditErrorMessage("");
  }

  /**
   * Valida la información editable antes de enviarla.
   */
  function validateForm(): string {
    const permissionName = formState.permissionName.trim();
    const moduleKey = formState.moduleKey.trim();

    if (!permissionName) {
      return "El nombre del permiso es obligatorio.";
    }

    if (permissionName.length < 3) {
      return "El nombre del permiso debe contener al menos 3 caracteres.";
    }

    if (!moduleKey) {
      return "El módulo es obligatorio.";
    }

    if (formState.description.trim().length > 500) {
      return "La descripción no puede superar los 500 caracteres.";
    }

    return "";
  }

  /**
   * Guarda los cambios autorizados del permiso seleccionado.
   */
  async function handleSubmitEdit(): Promise<void> {
    if (!selectedPermission || isSaving) {
      return;
    }

    const validationMessage = validateForm();

    if (validationMessage) {
      setEditErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setEditErrorMessage("");
      setSuccessMessage("");

      const updated = await updatePermissionRequest(
        selectedPermission.permissionKey,
        {
          permissionName: formState.permissionName.trim(),
          moduleKey: formState.moduleKey.trim(),
          description: formState.description.trim() || null,
          isActive: formState.isActive
        }
      );

      setPermissions((currentPermissions) =>
        currentPermissions.map((permission) =>
          permission.permissionKey === updated.permissionKey
            ? updated
            : permission
        )
      );

      setSelectedPermission(null);
      setFormState(EMPTY_FORM_STATE);
      setSuccessMessage("Permiso actualizado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el permiso.";

      setEditErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Activa o inactiva un permiso desde la tabla.
   */
  async function handleToggleStatus(
    permission: PermissionDto
  ): Promise<void> {
    if (changingStatusKey) {
      return;
    }

    try {
      setChangingStatusKey(permission.permissionKey);
      setPageErrorMessage("");
      setSuccessMessage("");

      const updated = await updatePermissionRequest(
        permission.permissionKey,
        {
          permissionName: permission.permissionName,
          moduleKey: permission.moduleKey,
          description: permission.description,
          isActive: !permission.isActive
        }
      );

      setPermissions((currentPermissions) =>
        currentPermissions.map((currentPermission) =>
          currentPermission.permissionKey === updated.permissionKey
            ? updated
            : currentPermission
        )
      );

      setSuccessMessage(
        updated.isActive
          ? "Permiso activado correctamente."
          : "Permiso inactivado correctamente."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado del permiso.";

      setPageErrorMessage(message);
    } finally {
      setChangingStatusKey(null);
    }
  }

  /**
   * Abre el modal de auditoría y consulta su historial.
   */
  async function openAuditModal(
    permission: PermissionDto
  ): Promise<void> {
    try {
      setAuditPermission(permission);
      setAuditRows([]);
      setAuditErrorMessage("");
      setIsAuditLoading(true);

      const audit = await getPermissionAuditRequest(
        permission.permissionKey
      );

      setAuditRows(audit);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar la auditoría.";

      setAuditErrorMessage(message);
    } finally {
      setIsAuditLoading(false);
    }
  }

  /**
   * Cierra el modal de auditoría.
   */
  function closeAuditModal(): void {
    setAuditPermission(null);
    setAuditRows([]);
    setAuditErrorMessage("");
  }

  useEffect(() => {
    void loadPermissions();
  }, []);

  return (
    <Page
      breadcrumb="Administración / Permisos"
      title="Permisos del sistema"
      description="Consulta, organiza y administra los permisos disponibles para controlar el acceso a módulos, vistas y acciones dentro de NominaCes."
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => void loadPermissions()}
          disabled={isLoading}
        >
          {isLoading ? "Actualizando..." : "Actualizar"}
        </Button>
      }
    >
      <section
        className="permissions-kpis"
        aria-label="Resumen de permisos"
      >
        <article className="permissions-kpi">
          <span className="permissions-kpi__label">
            Total de permisos
          </span>

          <strong className="permissions-kpi__value">
            {summary.total}
          </strong>
        </article>

        <article className="permissions-kpi">
          <span className="permissions-kpi__label">
            Permisos activos
          </span>

          <strong className="permissions-kpi__value">
            {summary.active}
          </strong>
        </article>

        <article className="permissions-kpi">
          <span className="permissions-kpi__label">
            Permisos inactivos
          </span>

          <strong className="permissions-kpi__value">
            {summary.inactive}
          </strong>
        </article>

        <article className="permissions-kpi">
          <span className="permissions-kpi__label">
            Módulos registrados
          </span>

          <strong className="permissions-kpi__value">
            {summary.modules}
          </strong>
        </article>
      </section>

      {successMessage ? (
        <div
          className="permissions-alert permissions-alert--success"
          role="status"
          aria-live="polite"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            className="permissions-alert__close"
            aria-label="Cerrar mensaje"
            onClick={() => setSuccessMessage("")}
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="permissions-panel">
        <PermissionsTable
          permissions={permissions}
          isLoading={isLoading}
          errorMessage={pageErrorMessage}
          onEdit={openEditModal}
          onToggleStatus={(permission) =>
            void handleToggleStatus(permission)
          }
          onAudit={(permission) =>
            void openAuditModal(permission)
          }
        />
      </section>

      <Modal
        open={Boolean(selectedPermission)}
        title="Editar permiso"
        eyebrow="Configuración del permiso"
        size="md"
        onClose={closeEditModal}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeEditModal}
              disabled={isSaving}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={() => void handleSubmitEdit()}
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </>
        }
      >
        {selectedPermission ? (
          <div className="app-modal-content-grid">
            <div className="permissions-edit-summary">
              <div className="permissions-edit-summary__content">
                <span className="permissions-edit-summary__label">
                  Clave técnica
                </span>

                <strong className="permissions-edit-summary__key">
                  {selectedPermission.permissionKey}
                </strong>
              </div>

              <span
                className={
                  formState.isActive
                    ? "permissions-edit-summary__status permissions-edit-summary__status--active"
                    : "permissions-edit-summary__status permissions-edit-summary__status--inactive"
                }
              >
                {formState.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            {editErrorMessage ? (
              <div
                className="permissions-alert permissions-alert--error"
                role="alert"
              >
                {editErrorMessage}
              </div>
            ) : null}

            <InputField
              label="Nombre visible"
              value={formState.permissionName}
              placeholder="Ejemplo: Consultar usuarios"
              maxLength={120}
              disabled={isSaving}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  permissionName: event.target.value
                }))
              }
            />

            <div className="app-modal-inline-row">
              <label className="app-modal-field">
                <span className="app-modal-field__label">
                  Módulo
                </span>

                <select
                  className="app-modal-select"
                  value={formState.moduleKey}
                  disabled={isSaving}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      moduleKey: event.target.value
                    }))
                  }
                >
                  <option value="" disabled>
                    Selecciona un módulo
                  </option>

                  {moduleOptions.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </label>

              <label className="app-modal-switch-control">
                <span className="app-modal-field__label">
                  Estado del permiso
                </span>

                <span className="app-modal-switch-row">
                  <span className="app-modal-switch-text">
                    {formState.isActive
                      ? "Permiso activo"
                      : "Permiso inactivo"}
                  </span>

                  <input
                    className="app-modal-switch-input"
                    type="checkbox"
                    checked={formState.isActive}
                    disabled={isSaving}
                    aria-label="Cambiar estado del permiso"
                    onChange={(event) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        isActive: event.target.checked
                      }))
                    }
                  />

                  <span
                    className="app-modal-switch"
                    aria-hidden="true"
                  >
                    <span className="app-modal-switch__thumb" />
                  </span>
                </span>
              </label>
            </div>

            <label className="app-modal-field">
              <span className="app-modal-field__label">
                Descripción
              </span>

              <textarea
                className="app-modal-textarea"
                value={formState.description}
                rows={3}
                maxLength={500}
                disabled={isSaving}
                placeholder="Describe brevemente qué acceso concede este permiso."
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
        ) : null}
      </Modal>

      <Modal
        open={Boolean(auditPermission)}
        title="Auditoría del permiso"
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
        {auditPermission ? (
          <div className="app-modal-content-grid">
            <div className="permissions-audit-info">
              <span className="permissions-audit-info__label">
                Permiso consultado
              </span>

              <strong className="permissions-audit-info__key">
                {auditPermission.permissionKey}
              </strong>
            </div>

            {auditErrorMessage ? (
              <div
                className="permissions-alert permissions-alert--error"
                role="alert"
              >
                {auditErrorMessage}
              </div>
            ) : null}

            <div className="permissions-table-wrapper">
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Módulo</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {isAuditLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="permissions-table__empty"
                      >
                        Cargando auditoría...
                      </td>
                    </tr>
                  ) : auditErrorMessage ? null : auditRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="permissions-table__empty"
                      >
                        Este permiso aún no tiene auditoría.
                      </td>
                    </tr>
                  ) : (
                    auditRows.map((audit) => {
                      const permissionNameChanged =
                        hasAuditTextChanged(
                          audit.oldPermissionName,
                          audit.newPermissionName
                        );

                      const moduleChanged = hasAuditTextChanged(
                        audit.oldModuleKey,
                        audit.newModuleKey
                      );

                      const statusChanged = hasAuditStatusChanged(
                        audit.oldIsActive,
                        audit.newIsActive
                      );

                      return (
                        <tr key={audit.id}>
                          <td>
                            {formatDateTime(audit.changedAt)}
                          </td>

                          <td>
                            {audit.changedByFullName ||
                              audit.changedByUsername ||
                              "Sistema"}
                          </td>

                          <td>
                            {permissionNameChanged ? (
                              <div className="permissions-audit-change">
                                <span className="permissions-audit-change__old">
                                  {formatAuditText(
                                    audit.oldPermissionName
                                  )}
                                </span>

                                <span
                                  className="permissions-audit-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="permissions-audit-change__new">
                                  {formatAuditText(
                                    audit.newPermissionName
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="permissions-audit-change__same">
                                {formatAuditText(
                                  audit.newPermissionName ??
                                    audit.oldPermissionName
                                )}
                              </span>
                            )}
                          </td>

                          <td>
                            {moduleChanged ? (
                              <div className="permissions-audit-change">
                                <span className="permissions-audit-change__old">
                                  {formatAuditText(
                                    audit.oldModuleKey
                                  )}
                                </span>

                                <span
                                  className="permissions-audit-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="permissions-audit-change__new">
                                  {formatAuditText(
                                    audit.newModuleKey
                                  )}
                                </span>
                              </div>
                            ) : (
                              <span className="permissions-audit-change__same">
                                {formatAuditText(
                                  audit.newModuleKey ??
                                    audit.oldModuleKey
                                )}
                              </span>
                            )}
                          </td>

                          <td>
                            {statusChanged ? (
                              <div className="permissions-audit-status-change">
                                <span className="permissions-audit-status">
                                  {formatStatus(audit.oldIsActive)}
                                </span>

                                <span
                                  className="permissions-audit-status-change__arrow"
                                  aria-hidden="true"
                                >
                                  →
                                </span>

                                <span className="permissions-audit-status permissions-audit-status--changed">
                                  {formatStatus(audit.newIsActive)}
                                </span>
                              </div>
                            ) : (
                              <span className="permissions-audit-status">
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