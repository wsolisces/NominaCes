// ======================================================
// PATH: src/shared/ui/Form/FormField.tsx
// Campo de formulario reutilizable
// ======================================================

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes
} from "react";

import "./form.css";

/**
 * Opción para select reutilizable.
 */
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/**
 * Props base compartidas para campos.
 */
type BaseFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
};

/**
 * Props para input.
 */
export type InputFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement>;

/**
 * Props para select.
 */
export type SelectFieldProps = BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: SelectOption[];
    placeholder?: string;
  };

/**
 * Contenedor visual de campo.
 *
 * Responsabilidades:
 * - Estandarizar label, ayuda y error.
 * - Evitar repetir estructura en cada modal.
 */
function FieldShell({ label, error, hint, children }: BaseFieldProps) {
  return (
    <label className="app-field">
      <span className="app-field__label">{label}</span>

      {children}

      {hint && !error && <span className="app-field__hint">{hint}</span>}
      {error && <span className="app-field__error">{error}</span>}
    </label>
  );
}

/**
 * Input reutilizable.
 */
export function InputField({
  label,
  error,
  hint,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <input className={`app-field__control ${className}`} {...props} />
    </FieldShell>
  );
}

/**
 * Select reutilizable.
 */
export function SelectField({
  label,
  error,
  hint,
  options,
  placeholder = "Selecciona una opción",
  className = "",
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <select className={`app-field__control ${className}`} {...props}>
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}