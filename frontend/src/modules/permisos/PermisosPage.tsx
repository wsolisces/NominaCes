// ======================================================
// PATH: src/modules/permisos/pages/PermisosPage.tsx
// Pantalla de administración de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el catálogo de permisos del sistema.
 * - Administrar búsqueda, creación, edición, activación y eliminación.
 * - Coordinar tabla, modal y llamadas HTTP del módulo.
 *
 * No debe:
 * - Definir el layout principal de la aplicación.
 * - Duplicar estilos globales.
 * - Consultar permisos de sesión directamente.
 */

import { useEffect, useMemo, useState } from "react";

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

import "../permisos.css";

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

const CLOSED_MODAL: ModalState = {
  open: false,
  mode: "create",
  permission: null
};

function matchesSearch(permission: PermissionDto, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) return true;

  const searchableText = [
    permission.permission_key,
    permission.permission_name,
    permission.module_key,
    permission.module_name,
    permission.description ?? ""
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

export default function PermisosPage() {
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);

  const filteredPermissions = useMemo(() => {
    return permissions.filter((permission) => matchesSearch(permission, search));
  }, [permissions, search]);

  const totalPermissions = permissions.length;

  const activePermissions = useMemo(() => {
    return permissions.filter((permission) => permission.is_active).length;
  }, [permissions]);

  const inactivePermissions = totalPermissions - activePermissions;

  useEffect(() => {
    void loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      setLoadingList(true);
      setPageError(null);

      const response = await getPermissionsRequest();

      setPermissions(response);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los permisos."
      );
    } finally {
      setLoadingList(false);
    }
  }

  function openCreateModal() {
    setModalError(null);
    setModal({
      open: true,
      mode: "create",
      permission: null
    });
  }

  function openEditModal(permission: PermissionDto) {
    setModalError(null);
    setModal({
      open: true,
      mode: "edit",
      permission
    });
  }

  function closeModal() {
    if (saving) return;

    setModalError(null);
    setModal(CLOSED_MODAL);
  }

  function replacePermission(updatedPermission: PermissionDto) {
    setPermissions((currentPermissions) =>
      currentPermissions.map((permission) =>
        permission.id === updatedPermission.id ? updatedPermission : permission
      )
    );
  }

  async function handleSubmit(values: PermissionFormValues) {
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
        return;
      }

      const updatedPermission = await updatePermissionRequest(
        modal.permission.id,
        values
      );

      replacePermission(updatedPermission);
      setModal(CLOSED_MODAL);
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el permiso."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(permission: PermissionDto) {
    try {
      setPageError(null);

      const updatedPermission = permission.is_active
        ? await deactivatePermissionRequest(permission.id)
        : await activatePermissionRequest(permission.id);

      replacePermission(updatedPermission);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado del permiso."
      );
    }
  }

  async function handleDelete(permission: PermissionDto) {
    const confirmed = window.confirm(
      `¿Eliminar el permiso "${permission.permission_name}"?`
    );

    if (!confirmed) return;

    try {
      setPageError(null);

      await deletePermissionRequest(permission.id);

      setPermissions((currentPermissions) =>
        currentPermissions.filter(
          (currentPermission) => currentPermission.id !== permission.id
        )
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el permiso."
      );
    }
  }

  return (
    <main className="permissions-page">
      <section className="permissions-page__header">
        <div>
          <p className="permissions-page__eyebrow">
            Administración
          </p>

          <h1 className="permissions-page__title">
            Permisos
          </h1>

          <p className="permissions-page__subtitle">
            Administra las funcionalidades que pueden asignarse a los roles del sistema.
          </p>
        </div>

        <button
          type="button"
          className="permission-button permission-button--primary"
          onClick={openCreateModal}
        >
          Nuevo permiso
        </button>
      </section>

      <section className="permissions-summary">
        <article className="permissions-summary__card">
          <span>Total</span>
          <strong>{totalPermissions}</strong>
        </article>

        <article className="permissions-summary__card">
          <span>Activos</span>
          <strong>{activePermissions}</strong>
        </article>

        <article className="permissions-summary__card">
          <span>Inactivos</span>
          <strong>{inactivePermissions}</strong>
        </article>
      </section>

      <section className="permissions-filter-card">
        <div className="permissions-filter-card__content">
          <label className="permissions-search">
            <span>Buscar permiso</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por clave, nombre o módulo"
            />
          </label>

          <button
            type="button"
            className="permission-button permission-button--secondary"
            onClick={() => void loadPermissions()}
            disabled={loadingList}
          >
            Actualizar
          </button>
        </div>
      </section>

      {pageError ? (
        <div className="permissions-alert" role="alert">
          {pageError}
        </div>
      ) : null}

      <PermissionsTable
        permissions={filteredPermissions}
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
    </main>
  );
}