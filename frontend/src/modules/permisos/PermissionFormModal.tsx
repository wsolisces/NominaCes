// ======================================================
// PATH: src/modules/permisos/components/PermissionFormModal.tsx
// Modal de creación y edición de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Capturar la información editable de un permiso.
 * - Validar campos obligatorios antes de enviar.
 * - Reutilizarse para crear y editar permisos.
 * - Generar automáticamente permission_key al crear permisos.
 *
 * No debe:
 * - Llamar directamente al backend.
 * - Modificar la lista de permisos.
 * - Conocer reglas de navegación.
 * - Solicitar manualmente la clave del permiso al crear.
 */

import { useEffect, useMemo, useState, type FormEvent } from "react";

import type {
  PermissionDto,
  PermissionFormValues
} from "./permisos.types";

const EMPTY_FORM: PermissionFormValues = {
  permission_key: "",
  permission_name: "",
  module_key: "",
  module_name: "",
  description: "",
  is_active: true
};

const MODULE_OPTIONS = [
  {
    module_key: "USERS",
    module_name: "Usuarios"
  },
  {
    module_key: "ROLES",
    module_name: "Roles"
  },
  {
    module_key: "PERMISSIONS",
    module_name: "Permisos"
  },
  {
    module_key: "CATALOGS",
    module_name: "Catálogos"
  },
  {
    module_key: "HEADCOUNT",
    module_name: "Head Count"
  },
  {
    module_key: "PAYROLL",
    module_name: "Nómina"
  },
  {
    module_key: "ISN",
    module_name: "ISN"
  }
];

export type PermissionFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  permission: PermissionDto | null;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: PermissionFormValues) => void;
};

/**
 * Normaliza texto para usarlo como segmento de clave técnica.
 */
function normalizeKeySegment(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/Ñ/g, "N")
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normaliza claves de módulo.
 */
function normalizeModuleKey(value: string): string {
  return normalizeKeySegment(value);
}

/**
 * Genera la clave técnica del permiso.
 *
 * Regla:
 * - La clave no la captura el usuario.
 * - Se forma con módulo + nombre del permiso.
 */
function buildPermissionKey(moduleKey: string, permissionName: string): string {
  const normalizedModuleKey = normalizeModuleKey(moduleKey);
  const normalizedPermissionName = normalizeKeySegment(permissionName);

  if (!normalizedModuleKey || !normalizedPermissionName) {
    return "";
  }

  return `${normalizedModuleKey}_${normalizedPermissionName}`;
}

export function PermissionFormModal({
  open,
  mode,
  permission,
  loading = false,
  error = null,
  onClose,
  onSubmit
}: PermissionFormModalProps) {
  const [values, setValues] = useState<PermissionFormValues>(EMPTY_FORM);
  const [localError, setLocalError] = useState<string | null>(null);

  const title = useMemo(() => {
    return mode === "create" ? "Crear permiso" : "Editar permiso";
  }, [mode]);

  const generatedPermissionKey = useMemo(() => {
    if (mode === "edit") {
      return values.permission_key;
    }

    return buildPermissionKey(values.module_key, values.permission_name);
  }, [mode, values.module_key, values.permission_key, values.permission_name]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && permission) {
      setValues({
        permission_key: permission.permission_key ?? "",
        permission_name: permission.permission_name ?? "",
        module_key: permission.module_key ?? "",
        module_name: permission.module_name ?? "",
        description: permission.description ?? "",
        is_active: Boolean(permission.is_active)
      });
      setLocalError(null);
      return;
    }

    setValues(EMPTY_FORM);
    setLocalError(null);
  }, [mode, open, permission]);

  if (!open) return null;

  function updateField<K extends keyof PermissionFormValues>(
    field: K,
    value: PermissionFormValues[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value
    }));
  }

  function handleModuleChange(moduleKey: string) {
    const normalizedModuleKey = normalizeModuleKey(moduleKey);

    const selectedModule = MODULE_OPTIONS.find(
      (moduleOption) => moduleOption.module_key === normalizedModuleKey
    );

    updateField("module_key", normalizedModuleKey);
    updateField("module_name", selectedModule?.module_name ?? "");
  }

  function validateForm(): string | null {
    if (!values.permission_name.trim()) {
      return "Captura el nombre del permiso.";
    }

    if (!values.module_key.trim()) {
      return "Selecciona el módulo del permiso.";
    }

    if (!values.module_name.trim()) {
      return "Selecciona un módulo válido.";
    }

    if (mode === "create" && !generatedPermissionKey) {
      return "No fue posible generar la clave del permiso.";
    }

    if (mode === "edit" && !values.permission_key.trim()) {
      return "La clave del permiso no es válida.";
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);

    onSubmit({
      permission_key:
        mode === "create"
          ? generatedPermissionKey
          : values.permission_key.trim(),
      permission_name: values.permission_name.trim(),
      module_key: normalizeModuleKey(values.module_key),
      module_name: values.module_name.trim(),
      description: values.description.trim(),
      is_active: values.is_active
    });
  }

  const visibleError = localError ?? error;

  return (
    <div className="permission-modal-backdrop" role="presentation">
      <section
        className="permission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-modal-title"
      >
        <header className="permission-modal__header">
          <div>
            <p className="permission-modal__eyebrow">Catálogo de permisos</p>
            <h2 id="permission-modal-title" className="permission-modal__title">
              {title}
            </h2>
          </div>

          <button
            type="button"
            className="permission-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={loading}
          >
            ×
          </button>
        </header>

        <form className="permission-form" onSubmit={handleSubmit}>
          <div className="permission-form__grid">
            {mode === "edit" ? (
              <label className="permission-form__field">
                <span>Clave técnica</span>
                <input
                  value={values.permission_key}
                  disabled
                  readOnly
                  aria-readonly="true"
                />
              </label>
            ) : null}
            
            <label className="permission-form__field">
              <span>Nombre del permiso</span>
              <input
                value={values.permission_name}
                onChange={(event) =>
                  updateField("permission_name", event.target.value)
                }
                placeholder="Ver usuarios"
                disabled={loading}
              />
            </label>

            <label className="permission-form__field">
              <span>Módulo</span>
              <select
                value={values.module_key}
                onChange={(event) => handleModuleChange(event.target.value)}
                disabled={loading}
              >
                <option value="">Seleccionar módulo</option>
                {MODULE_OPTIONS.map((moduleOption) => (
                  <option
                    key={moduleOption.module_key}
                    value={moduleOption.module_key}
                  >
                    {moduleOption.module_name}
                  </option>
                ))}
              </select>
            </label>

            

            <label className="permission-form__field">
              <span>Estado</span>

              <button
                type="button"
                className={
                  values.is_active
                    ? "permission-switch permission-switch--active"
                    : "permission-switch"
                }
                onClick={() => updateField("is_active", !values.is_active)}
                disabled={loading}
                aria-pressed={values.is_active}
              >
                <span className="permission-switch__track">
                  <span className="permission-switch__thumb" />
                </span>
                <span className="permission-switch__text">
                  {values.is_active ? "Activo" : "Inactivo"}
                </span>
              </button>
            </label>

            <label className="permission-form__field permission-form__field--full">
              <span>Descripción</span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Describe para qué se utiliza este permiso"
                disabled={loading}
                rows={4}
              />
            </label>
          </div>

          {visibleError ? (
            <p className="permission-form__error">{visibleError}</p>
          ) : null}

          <footer className="permission-modal__footer">
            <button
              type="button"
              className="permission-button permission-button--secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="permission-button permission-button--primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar permiso"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}