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

import { Button, InputField, Modal, Page } from "../../../shared/ui";

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

import "../../security/security-pages.css";

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
    permissions.map((permission) => permission.moduleKey)
  );

  return {
    total: permissions.length,
    active: permissions.filter((permission) => permission.isActive).length,
    inactive: permissions.filter((permission) => !permission.isActive).length,
    modules: modules.size
  };
}

/**
 * Convierte un permiso en estado editable.
 */
function toFormState(permission: PermissionDto): PermissionFormState {
  return {
    permissionName: permission.permissionName,
    moduleKey: permission.moduleKey,
    description: permission.description ?? "",
    isActive: permission.isActive
  };
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
 * Obtiene el texto visible de un valor booleano de auditoría.
 */
function formatStatus(value: boolean | null): string {
  if (value === null) {
    return "Sin dato";
  }

  return value ? "Activo" : "Inactivo";
}

/**
 * Pantalla principal de administración de permisos.
 */
export default function PermisosPage() {
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
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
   * Carga permisos desde el backend.
   */
  async function loadPermissions(): Promise<void> {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const result = await getPermissionsRequest();

      setPermissions(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible consultar permisos.";

      setErrorMessage(message);
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
    setErrorMessage("");
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
  }

  /**
   * Valida la información editable antes de enviarla.
   */
  function validateForm(): string {
    if (!formState.permissionName.trim()) {
      return "El nombre del permiso es obligatorio.";
    }

    if (!formState.moduleKey.trim()) {
      return "El módulo es obligatorio.";
    }

    return "";
  }

  /**
   * Guarda los cambios autorizados del permiso seleccionado.
   */
  async function handleSubmitEdit(): Promise<void> {
    if (!selectedPermission) {
      return;
    }

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
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

      setErrorMessage(message);
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
    if (isChangingStatus) {
      return;
    }

    try {
      setIsChangingStatus(true);
      setErrorMessage("");
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

      setErrorMessage(message);
    } finally {
      setIsChangingStatus(false);
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

  const summary = useMemo(
    () => getPermissionsSummary(permissions),
    [permissions]
  );

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
        className="security-kpis"
        aria-label="Resumen de permisos"
      >
        <article className="security-kpi">
          <span className="security-kpi__label">Total</span>
          <strong className="security-kpi__value">
            {summary.total}
          </strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Activos</span>
          <strong className="security-kpi__value">
            {summary.active}
          </strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Inactivos</span>
          <strong className="security-kpi__value">
            {summary.inactive}
          </strong>
        </article>

        <article className="security-kpi">
          <span className="security-kpi__label">Módulos</span>
          <strong className="security-kpi__value">
            {summary.modules}
          </strong>
        </article>
      </section>

      {successMessage ? (
        <div
          className="security-alert security-alert--success"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <section className="security-panel">
        <PermissionsTable
          permissions={permissions}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onEdit={openEditModal}
          onToggleStatus={(permission) =>
            void handleToggleStatus(permission)
          }
          onAudit={(permission) => void openAuditModal(permission)}
        />
      </section>

      <Modal
        open={Boolean(selectedPermission)}
        title="Editar permiso"
        eyebrow="Catálogo controlado"
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
          <div className="security-form-grid">
            <div className="security-main-text">
              <strong>{selectedPermission.permissionKey}</strong>
              <span>La clave técnica no se puede modificar.</span>
            </div>

            {errorMessage ? (
              <div
                className="security-alert security-alert--error"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}

            <InputField
              label="Nombre del permiso"
              value={formState.permissionName}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  permissionName: event.target.value
                }))
              }
            />

            <InputField
              label="Módulo"
              value={formState.moduleKey}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  moduleKey: event.target.value
                }))
              }
            />

            <label className="security-field">
              <span className="security-field__label">
                Descripción
              </span>

              <textarea
                className="security-textarea"
                value={formState.description}
                rows={4}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    description: event.target.value
                  }))
                }
              />
            </label>

            <label className="security-check">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    isActive: event.target.checked
                  }))
                }
              />

              <span>Permiso activo</span>
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(auditPermission)}
        title="Auditoría"
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
          <div className="security-form-grid">
            <div className="security-main-text">
              <strong>{auditPermission.permissionKey}</strong>
              <span>
                Registro de cambios realizados al permiso.
              </span>
            </div>

            {auditErrorMessage ? (
              <div
                className="security-alert security-alert--error"
                role="alert"
              >
                {auditErrorMessage}
              </div>
            ) : null}

            <div className="security-table-wrapper">
              <table className="security-table">
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
                        className="security-table__empty"
                      >
                        Cargando auditoría...
                      </td>
                    </tr>
                  ) : auditRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="security-table__empty"
                      >
                        Este permiso aún no tiene auditoría.
                      </td>
                    </tr>
                  ) : (
                    auditRows.map((audit) => (
                      <tr key={audit.id}>
                        <td>{formatDateTime(audit.changedAt)}</td>

                        <td>
                          {audit.changedByFullName ||
                            audit.changedByUsername ||
                            "Sistema"}
                        </td>

                        <td>
                          <div className="security-main-text">
                            <span>
                              {audit.oldPermissionName || "Sin dato"}
                            </span>

                            <strong>
                              {audit.newPermissionName || "Sin dato"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <div className="security-main-text">
                            <span>
                              {audit.oldModuleKey || "Sin dato"}
                            </span>

                            <strong>
                              {audit.newModuleKey || "Sin dato"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          {formatStatus(audit.oldIsActive)} →{" "}
                          {formatStatus(audit.newIsActive)}
                        </td>
                      </tr>
                    ))
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