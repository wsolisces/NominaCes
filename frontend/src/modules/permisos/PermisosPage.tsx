// ======================================================
// PATH: src/modules/permisos/pages/PermisosPage.tsx
// Pantalla de administración de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el catálogo de permisos del sistema.
 * - Administrar creación, edición, activación y eliminación.
 * - Coordinar tabla, modal y llamadas HTTP del módulo.
 * - Usar permission_key como identificador real del permiso.
 * - Usar el modal global ConfirmActionModal para confirmar acciones sensibles.
 * - Mostrar retroalimentación visual de éxito o error al terminar acciones.
 *
 * No debe:
 * - Definir el layout principal de la aplicación.
 * - Duplicar estilos globales.
 * - Consultar permisos de sesión directamente.
 * - Usar id, porque app_permission no tiene columna id.
 * - Usar window.confirm para confirmaciones del sistema.
 */

import { useEffect, useMemo, useState } from "react";

import {
  ActionFeedbackModal,
  PageHeader,
  useConfirmAction
} from "../../shared/ui";

import {
  activatePermissionRequest,
  createPermissionRequest,
  deactivatePermissionRequest,
  deletePermissionRequest,
  getPermissionsRequest,
  updatePermissionRequest
} from "./permisos.api";

import { PermissionFormModal } from "./PermissionFormModal";
import { PermissionsTable } from "./PermissionsTable";

import type {
  PermissionDto,
  PermissionFormValues
} from "./permisos.types";

import "./permisos.css";

type ModalState =
  | {
      open: false;
      mode: "create";
      permission: null;
    }
  | {
      open: true;
      mode: "create";
      permission: null;
    }
  | {
      open: true;
      mode: "edit";
      permission: PermissionDto;
    };

type FeedbackState = {
  open: boolean;
  variant: "success" | "error";
  title: string;
  message?: string;
};

const CLOSED_MODAL: ModalState = {
  open: false,
  mode: "create",
  permission: null
};

const CLOSED_FEEDBACK: FeedbackState = {
  open: false,
  variant: "success",
  title: ""
};

/**
 * Estado inicial cerrado del modal de permisos.
 */
function getClosedModal(): ModalState {
  return CLOSED_MODAL;
}

/**
 * Estado inicial cerrado del modal de retroalimentación.
 */
function getClosedFeedback(): FeedbackState {
  return CLOSED_FEEDBACK;
}

/**
 * Reemplaza un permiso dentro del arreglo usando permission_key.
 */
function replacePermissionByKey(
  permissions: PermissionDto[],
  updatedPermission: PermissionDto
): PermissionDto[] {
  return permissions.map((permission) =>
    permission.permission_key === updatedPermission.permission_key
      ? updatedPermission
      : permission
  );
}

/**
 * Pantalla principal de administración de permisos.
 */
export default function PermisosPage() {
  const { confirmAction } = useConfirmAction();

  const [permissions, setPermissions] = useState<PermissionDto[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [modal, setModal] = useState<ModalState>(getClosedModal);
  const [feedback, setFeedback] =
    useState<FeedbackState>(getClosedFeedback);

  const totalPermissions = permissions.length;

  const activePermissions = useMemo(() => {
    return permissions.filter((permission) => permission.is_active).length;
  }, [permissions]);

  const inactivePermissions = totalPermissions - activePermissions;

  const moduleCount = useMemo(() => {
    const modules = new Set(
      permissions
        .map((permission) => permission.module_name)
        .filter(Boolean)
    );

    return modules.size;
  }, [permissions]);

  /**
   * Muestra retroalimentación visual de éxito.
   */
  function showSuccessFeedback(title: string, message?: string): void {
    setFeedback({
      open: true,
      variant: "success",
      title,
      message
    });
  }

  /**
   * Muestra retroalimentación visual de error.
   */
  function showErrorFeedback(title: string, message?: string): void {
    setFeedback({
      open: true,
      variant: "error",
      title,
      message
    });
  }

  /**
   * Cierra el modal de retroalimentación visual.
   */
  function closeFeedback(): void {
    setFeedback(CLOSED_FEEDBACK);
  }

  /**
   * Obtiene un mensaje legible a partir de un error desconocido.
   */
  function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }

  /**
   * Carga el catálogo de permisos desde el backend.
   */
  async function loadPermissions(): Promise<void> {
    try {
      setLoadingList(true);
      setPageError(null);

      const response = await getPermissionsRequest();

      setPermissions(response);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No fue posible cargar los permisos."
      );

      setPageError(message);

      showErrorFeedback(
        "No se pudieron cargar los permisos",
        message
      );
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    void loadPermissions();
  }, []);

  /**
   * Abre el modal en modo creación.
   */
  function openCreateModal(): void {
    setModalError(null);

    setModal({
      open: true,
      mode: "create",
      permission: null
    });
  }

  /**
   * Abre el modal en modo edición.
   */
  function openEditModal(permission: PermissionDto): void {
    setModalError(null);

    setModal({
      open: true,
      mode: "edit",
      permission
    });
  }

  /**
   * Cierra el modal si no hay una operación de guardado activa.
   */
  function closeModal(): void {
    if (saving) return;

    setModalError(null);
    setModal(CLOSED_MODAL);
  }

  /**
   * Actualiza el permiso dentro del estado local.
   */
  function replacePermission(updatedPermission: PermissionDto): void {
    setPermissions((currentPermissions) =>
      replacePermissionByKey(currentPermissions, updatedPermission)
    );
  }

  /**
   * Crea o actualiza un permiso según el modo del modal.
   */
  async function handleSubmit(values: PermissionFormValues): Promise<void> {
    try {
      setSaving(true);
      setModalError(null);

      if (modal.mode === "create") {
        const createdPermission = await createPermissionRequest(values);

        setPermissions((currentPermissions) => [
          createdPermission,
          ...currentPermissions
        ]);

        setModal(CLOSED_MODAL);

        showSuccessFeedback(
          "Permiso creado",
          "El permiso se registró correctamente."
        );

        return;
      }

      const updatedPermission = await updatePermissionRequest(
        modal.permission.permission_key,
        values
      );

      replacePermission(updatedPermission);
      setModal(CLOSED_MODAL);

      showSuccessFeedback(
        "Permiso actualizado",
        "Los cambios se guardaron correctamente."
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No fue posible guardar el permiso."
      );

      setModalError(message);

      showErrorFeedback(
        "No se pudo guardar",
        message
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Activa o desactiva un permiso usando confirmación global.
   */
  async function handleToggleStatus(permission: PermissionDto): Promise<void> {
    const confirmed = await confirmAction({
      variant: permission.is_active ? "warning" : "success",
      title: permission.is_active
        ? "Desactivar permiso"
        : "Activar permiso",
      message: permission.is_active
        ? `¿Seguro que deseas desactivar el permiso "${permission.permission_name}"?`
        : `¿Seguro que deseas activar el permiso "${permission.permission_name}"?`,
      confirmLabel: permission.is_active ? "Desactivar" : "Activar",
      cancelLabel: "Cancelar"
    });

    if (!confirmed) return;

    try {
      setPageError(null);

      const updatedPermission = permission.is_active
        ? await deactivatePermissionRequest(permission.permission_key)
        : await activatePermissionRequest(permission.permission_key);

      replacePermission(updatedPermission);

      showSuccessFeedback(
        permission.is_active
          ? "Permiso desactivado"
          : "Permiso activado",
        permission.is_active
          ? "El permiso se desactivó correctamente."
          : "El permiso se activó correctamente."
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No fue posible cambiar el estado del permiso."
      );

      setPageError(message);

      showErrorFeedback(
        "No se pudo cambiar el estado",
        message
      );
    }
  }

  /**
   * Elimina un permiso usando permission_key y confirmación global.
   */
  async function handleDelete(permission: PermissionDto): Promise<void> {
    const confirmed = await confirmAction({
      variant: "danger",
      title: "Eliminar permiso",
      message: `¿Seguro que deseas eliminar el permiso "${permission.permission_name}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar"
    });

    if (!confirmed) return;

    try {
      setPageError(null);

      await deletePermissionRequest(permission.permission_key);

      setPermissions((currentPermissions) =>
        currentPermissions.filter(
          (currentPermission) =>
            currentPermission.permission_key !== permission.permission_key
        )
      );

      showSuccessFeedback(
        "Permiso eliminado",
        "El permiso se eliminó correctamente."
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        "No fue posible eliminar el permiso."
      );

      setPageError(message);

      showErrorFeedback(
        "No se pudo eliminar",
        message
      );
    }
  }

  return (
    <main className="permissions-page">
      <PageHeader
        eyebrow="Administración"
        section="Permisos"
        title="Permisos del sistema"
        description="Consulta, organiza y administra los permisos disponibles para controlar el acceso a módulos, vistas y acciones dentro de NominaCes."
        action={{
          label: "Nuevo permiso",
          icon: "+",
          onClick: openCreateModal,
          disabled: saving
        }}
       
        metrics={[
          {
            label: "Total",
            value: totalPermissions,
            variant: "neutral"
          },
          {
            label: "Activos",
            value: activePermissions,
            variant: "success"
          },
          {
            label: "Inactivos",
            value: inactivePermissions,
            variant: "danger"
          },
          {
            label: "Módulos",
            value: moduleCount,
            variant: "info"
          }
        ]}
      />

      {pageError ? (
        <div className="permissions-alert" role="alert">
          {pageError}
        </div>
      ) : null}

        <PermissionsTable
          permissions={permissions}
          loading={loadingList}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />

      <PermissionFormModal
        open={modal.open}
        mode={modal.mode}
        permission={modal.permission}
        loading={saving}
        error={modalError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ActionFeedbackModal
        open={feedback.open}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        onClose={closeFeedback}
      />
    </main>
  );
}