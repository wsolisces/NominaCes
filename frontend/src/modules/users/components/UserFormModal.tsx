// ======================================================
// PATH: frontend/src/pages/Users/components/UserFormModal.tsx
// Modal de alta y edición de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Renderizar el formulario de creación y edición de usuarios.
 * - Usar el Modal reutilizable del sistema.
 * - Recibir estado y eventos desde UsuariosPage.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Validar reglas de negocio complejas.
 * - Guardar estado global.
 * - Mostrar información sensible.
 */

import type { FormEvent } from "react";

import {
  Button,
  InputField,
  Modal,
  SelectField,
  type SelectOption
} from "../../../shared/ui";

import type {
  UserFormMode,
  UserFormState
} from "../users.types";

export type UserFormModalProps = {
  open: boolean;
  mode: UserFormMode;
  form: UserFormState;
  roleOptions: SelectOption[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChangeField: (field: keyof UserFormState, value: string) => void;
};

/**
 * Devuelve textos de encabezado según modo.
 */
function getModalCopy(mode: UserFormMode): {
  title: string;
  eyebrow: string;
  submitLabel: string;
} {
  if (mode === "edit") {
    return {
      title: "Editar usuario",
      eyebrow: "Administración de accesos",
      submitLabel: "Guardar cambios"
    };
  }

  return {
    title: "Nuevo usuario",
    eyebrow: "Administración de accesos",
    submitLabel: "Crear usuario"
  };
}

/**
 * Modal de formulario para usuarios.
 */
export function UserFormModal({
  open,
  mode,
  form,
  roleOptions,
  loading,
  onClose,
  onSubmit,
  onChangeField
}: UserFormModalProps) {
  const copy = getModalCopy(mode);
  const isEditMode = mode === "edit";

  return (
    <Modal
      open={open}
      title={copy.title}
      eyebrow={copy.eyebrow}
      size="md"
      onClose={onClose}
      footer={
        <div className="users-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            form="users-form"
            disabled={loading}
          >
            {loading ? "Guardando..." : copy.submitLabel}
          </Button>
        </div>
      }
    >
      <form
        id="users-form"
        className="users-form"
        onSubmit={onSubmit}
      >
        <InputField
          label="Usuario"
          value={form.username}
          onChange={(event) => onChangeField("username", event.target.value)}
          placeholder="Ej. wsolis"
          disabled={loading || isEditMode}
        />

        <InputField
          label="Nombre completo"
          value={form.fullName}
          onChange={(event) => onChangeField("fullName", event.target.value)}
          placeholder="Nombre y apellidos"
          disabled={loading}
        />

        <SelectField
          label="Rol"
          value={form.roleId}
          onChange={(event) => onChangeField("roleId", event.target.value)}
          options={roleOptions}
          disabled={loading}
        />
      </form>
    </Modal>
  );
}