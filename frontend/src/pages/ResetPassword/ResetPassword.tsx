// ======================================================
// PATH: src/pages/ResetPassword/ResetPassword.tsx
// Módulo: Autenticación frontend
// Pantalla: Crear contraseña
// Descripción:
//   Pantalla pública para que un usuario con contraseña temporal
//   cree una contraseña definitiva usando código de restablecimiento.
//
// Flujo:
//   1. Login detecta password_reset_required.
//   2. Login redirige a /crear-password con el username.
//   3. Usuario captura código temporal, nueva contraseña y confirmación.
//   4. Se llama POST /login/create-password.
//   5. Si backend confirma el cambio, regresa a /login.
//
// Responsabilidades:
//   - Capturar usuario, código temporal y contraseña nueva.
//   - Validar reglas mínimas de contraseña antes de enviar.
//   - Mostrar errores controlados del backend.
//   - Redirigir al login cuando la contraseña se crea correctamente.
//   - Mantener estructura compatible con el diseño monocromático.
//
// No debe:
//   - Iniciar sesión automáticamente.
//   - Guardar sesión.
//   - Modificar permisos.
//   - Consultar endpoints que no sean de creación de contraseña.
// ======================================================

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiClientError } from "../../api/api.types";
import { createPasswordRequest } from "../../auth/auth.api";
import { IconEye, IconEyeOff, IconSpinner } from "../../components/icons";

import logoCesantoni from "../../components/img/Cesantoni_Blanco.png";
import isotipoCesantoni from "../../components/img/Cesantoni_Blanco_Isotipo.png";

import "./ResetPassword.css";

type ResetPasswordLocationState = {
  username?: string;
} | null;

type PasswordValidation = {
  valid: boolean;
  errors: string[];
};

/**
 * Obtiene el username enviado desde Login.tsx.
 *
 * Si el usuario entra directo a /crear-password, el campo queda vacío
 * y podrá capturarlo manualmente.
 */
function getStateUsername(state: unknown): string {
  const value = state as ResetPasswordLocationState;

  return typeof value?.username === "string" ? value.username : "";
}

/**
 * Convierte errores desconocidos a mensaje legible.
 *
 * Si el backend devuelve details como arreglo de validaciones,
 * se unen para mostrarlas en una sola alerta.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (Array.isArray(error.details) && error.details.length > 0) {
      return error.details.map(String).join(" ");
    }

    return error.message || "No fue posible crear la contraseña.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "No fue posible crear la contraseña.";
}

/**
 * Valida reglas mínimas de contraseña en frontend.
 *
 * Importante:
 * - Esta validación es solo preventiva para mejorar UX.
 * - El backend sigue siendo la validación definitiva.
 */
function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("mínimo 8 caracteres");
  }

  if (!/[A-ZÁÉÍÓÚÑ]/.test(password)) {
    errors.push("una mayúscula");
  }

  if (!/[a-záéíóúñ]/.test(password)) {
    errors.push("una minúscula");
  }

  if (!/\d/.test(password)) {
    errors.push("un número");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Icono de usuario usado dentro del input.
 */
function ResetUserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12.15a3.45 3.45 0 1 0 0-6.9 3.45 3.45 0 0 0 0 6.9Z"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <path
        d="M5.75 19.1c.78-3.22 3.02-5.1 6.25-5.1s5.47 1.88 6.25 5.1"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Icono de candado usado dentro de inputs de contraseña.
 */
function ResetLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.25 10.5h9.5v7.25h-9.5V10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.5V8.75a3 3 0 0 1 6 0v1.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Icono de código temporal usado dentro del input.
 */
function ResetCodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 8.5h10M7 12h10M7 15.5h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5.75 4.75h12.5v14.5H5.75V4.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Pantalla pública para crear contraseña definitiva.
 *
 * El diseño visual se controla desde ResetPassword.css.
 * La pantalla no inicia sesión automáticamente después del cambio.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const initialUsername = useMemo(
    () => getStateUsername(location.state),
    [location.state]
  );

  const [username, setUsername] = useState(initialUsername);
  const [code, setCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValidation = useMemo(
    () => validatePassword(newPassword),
    [newPassword]
  );

  const isBusy = submitting;

  function clearErrorIfNeeded() {
    if (error) setError(null);
  }

  /**
   * Envía la nueva contraseña al backend.
   *
   * Reglas:
   * - Código temporal debe tener 6 dígitos.
   * - Contraseña debe cumplir reglas mínimas de frontend.
   * - Confirmación debe coincidir.
   *
   * Si backend confirma el cambio:
   * - No inicia sesión automáticamente.
   * - Redirige a login para que el usuario entre con su nueva contraseña.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const cleanUsername = username.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanUsername) {
      setError("El usuario es obligatorio.");
      usernameInputRef.current?.focus();
      return;
    }

    if (!cleanCode) {
      setError("El código temporal es obligatorio.");
      codeInputRef.current?.focus();
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("El código temporal debe tener 6 dígitos.");
      codeInputRef.current?.focus();
      return;
    }

    if (!newPassword) {
      setError("La nueva contraseña es obligatoria.");
      passwordInputRef.current?.focus();
      return;
    }

    if (!passwordValidation.valid) {
      setError(
        `La contraseña debe tener ${passwordValidation.errors.join(", ")}.`
      );
      passwordInputRef.current?.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmación de contraseña no coincide.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createPasswordRequest({
        username: cleanUsername,
        code: cleanCode,
        newPassword,
        confirmPassword
      });

      navigate("/login", {
        replace: true,
        state: {
          passwordCreated: true,
          username: cleanUsername
        }
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="reset-password-page">
      <section className="reset-password-shell" aria-label="Crear contraseña">
        <aside className="reset-password-brand" aria-label="Cesantoni">
          <img
            src={isotipoCesantoni}
            alt=""
            className="reset-password-watermark"
            draggable={false}
            aria-hidden="true"
          />

          <div className="reset-password-brand-center">
            <img
              src={logoCesantoni}
              alt="Cesantoni Porcelanato Premium"
              className="reset-password-logo"
              draggable={false}
            />
          </div>
        </aside>

        <section
          className="reset-password-access"
          aria-label="Formulario para crear contraseña"
        >
          <div className="reset-password-card">
            <header className="reset-password-header">
              <p className="reset-password-kicker">
                Restablecimiento requerido
              </p>
              <h1>Crear contraseña</h1>
              <p>
                Ingresa el código temporal y define una contraseña nueva para
                activar tu acceso.
              </p>
            </header>

            {error && (
              <div className="reset-password-error" role="alert">
                {error}
              </div>
            )}

            <form
              className="reset-password-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="reset-password-field">
                <label htmlFor="reset-username">Usuario</label>

                <div className="reset-password-input-shell">
                  <span className="reset-password-input-icon" aria-hidden="true">
                    <ResetUserIcon />
                  </span>

                  <input
                    id="reset-username"
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    autoComplete="username"
                    placeholder="Ingresa tu usuario"
                    disabled={isBusy}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      clearErrorIfNeeded();
                    }}
                  />
                </div>
              </div>

              <div className="reset-password-field">
                <label htmlFor="reset-code">Código temporal</label>

                <div className="reset-password-input-shell">
                  <span className="reset-password-input-icon" aria-hidden="true">
                    <ResetCodeIcon />
                  </span>

                  <input
                    id="reset-code"
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    autoComplete="one-time-code"
                    placeholder="Ej. 123456"
                    disabled={isBusy}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, ""));
                      clearErrorIfNeeded();
                    }}
                  />
                </div>
              </div>

              <div className="reset-password-field">
                <label htmlFor="reset-new-password">Nueva contraseña</label>

                <div className="reset-password-input-shell">
                  <span className="reset-password-input-icon" aria-hidden="true">
                    <ResetLockIcon />
                  </span>

                  <input
                    id="reset-new-password"
                    ref={passwordInputRef}
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    autoComplete="new-password"
                    placeholder="Crea una contraseña"
                    disabled={isBusy}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      clearErrorIfNeeded();
                    }}
                  />

                  {newPassword.length > 0 && (
                    <button
                      type="button"
                      className="reset-password-toggle"
                      disabled={isBusy}
                      aria-label={
                        showNewPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() => setShowNewPassword((current) => !current)}
                    >
                      {showNewPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  )}
                </div>
              </div>

              <div className="reset-password-field">
                <label htmlFor="reset-confirm-password">
                  Confirmar contraseña
                </label>

                <div className="reset-password-input-shell">
                  <span className="reset-password-input-icon" aria-hidden="true">
                    <ResetLockIcon />
                  </span>

                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    autoComplete="new-password"
                    placeholder="Repite la contraseña"
                    disabled={isBusy}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearErrorIfNeeded();
                    }}
                  />

                  {confirmPassword.length > 0 && (
                    <button
                      type="button"
                      className="reset-password-toggle"
                      disabled={isBusy}
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                    >
                      {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  )}
                </div>
              </div>

              <div className="reset-password-rules">
                <span
                  className={
                    newPassword.length >= 8
                      ? "reset-password-rule-ok"
                      : undefined
                  }
                >
                  Mínimo 8 caracteres
                </span>

                <span
                  className={
                    /[A-ZÁÉÍÓÚÑ]/.test(newPassword)
                      ? "reset-password-rule-ok"
                      : undefined
                  }
                >
                  Una mayúscula
                </span>

                <span
                  className={
                    /[a-záéíóúñ]/.test(newPassword)
                      ? "reset-password-rule-ok"
                      : undefined
                  }
                >
                  Una minúscula
                </span>

                <span
                  className={
                    /\d/.test(newPassword)
                      ? "reset-password-rule-ok"
                      : undefined
                  }
                >
                  Un número
                </span>
              </div>

              <button
                type="submit"
                className="reset-password-submit"
                disabled={isBusy}
              >
                {isBusy ? (
                  <span className="reset-password-submit-content">
                    <IconSpinner className="reset-password-spinner" />
                    Guardando
                  </span>
                ) : (
                  <span>Crear contraseña</span>
                )}
              </button>

              <button
                type="button"
                className="reset-password-back"
                disabled={isBusy}
                onClick={() => navigate("/login", { replace: true })}
              >
                Regresar al inicio de sesión
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}