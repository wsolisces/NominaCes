// ======================================================
// PATH: src/pages/Login/Login.tsx
// Módulo: Autenticación frontend
// Pantalla: Login
// Descripción:
//   Pantalla pública para iniciar sesión con usuario y contraseña.
//
// Flujo:
//   1. Usuario captura username y password.
//   2. Se llama signIn() desde AuthProvider.
//   3. Si login es correcto, redirige al panel o ruta original.
//   4. Si backend indica password_reset_required, redirige a /crear-password.
//   5. Si falla, muestra mensaje sin redirigir.
//
// Responsabilidades:
//   - Validar campos básicos del formulario.
//   - Mostrar errores de autenticación.
//   - Redirigir según el resultado de signIn().
//   - Mantener el diseño visual del login.
//
// No debe:
//   - Consultar directamente fetch/api.
//   - Guardar sesión.
//   - Validar permisos.
//   - Modificar estilos globales.
// ======================================================

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/useAuth";
import { IconEye, IconEyeOff, IconSpinner } from "../../components/icons";

import logoCesantoni from "../../components/img/Cesantoni_Blanco.png";
import isotipoCesantoni from "../../components/img/Cesantoni_Blanco_Isotipo.png";

import "./Login.css";

/**
 * Ruta privada previa a la que el usuario intentó acceder.
 *
 * React Router puede mandar:
 * - string directo
 * - objeto location parcial
 * - null/undefined cuando no hay ruta previa
 */
type RedirectFrom =
  | string
  | {
      pathname?: string;
      search?: string;
      hash?: string;
    }
  | null
  | undefined;

/**
 * Estado recibido desde React Router al redirigir al login.
 */
type LoginLocationState = {
  from?: RedirectFrom;
} | null;

type LoginTheme = "orange" | "blue";

/**
 * Tema visual del login.
 *
 * Cambiar aquí:
 * - "orange" para tema naranja
 * - "blue" para tema azul marino
 */
const LOGIN_THEME: LoginTheme = "orange";

const LOGIN_THEME_CLASS: Record<LoginTheme, string> = {
  orange: "login-theme-orange",
  blue: "login-theme-blue"
};

/**
 * Convierte errores desconocidos a mensaje legible.
 *
 * Se usa como respaldo para errores inesperados fuera del flujo normal
 * de signIn(), que ya devuelve errores controlados.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "No fue posible iniciar sesión. Intenta nuevamente.";
}

/**
 * Valida el usuario antes de llamar al backend.
 *
 * Esta validación es solo de UX. La validación definitiva sigue
 * estando en backend.
 */
function validateUsername(value: string): string | null {
  const cleanValue = value.trim();

  if (!cleanValue) return "El usuario es obligatorio.";
  if (cleanValue.length < 3) return "Ingresa un usuario válido.";

  return null;
}

/**
 * Normaliza la ruta a la que debe regresar el usuario después del login.
 *
 * Esto permite que si el usuario intentó entrar a una ruta privada,
 * después del login vuelva a esa ruta y no siempre a /panel.
 */
function normalizeRedirectTarget(from: RedirectFrom): string {
  if (!from) return "/panel";

  if (typeof from === "string") {
    return from.trim() || "/panel";
  }

  const pathname = from.pathname || "/panel";
  const search = from.search || "";
  const hash = from.hash || "";

  return `${pathname}${search}${hash}`;
}

/**
 * Obtiene la ruta destino desde location.state.
 */
function getRedirectTarget(state: unknown): string {
  const locationState = state as LoginLocationState;

  return normalizeRedirectTarget(locationState?.from);
}

/**
 * Detecta si backend está indicando que el usuario debe crear
 * una contraseña nueva antes de iniciar sesión.
 *
 * Señales soportadas:
 * - details.passwordResetRequired = true
 * - mensaje textual del backend
 */
function isPasswordResetRequired(details: unknown, message?: string): boolean {
  if (
    details &&
    typeof details === "object" &&
    "passwordResetRequired" in details &&
    (details as { passwordResetRequired?: unknown }).passwordResetRequired ===
      true
  ) {
    return true;
  }

  return Boolean(message?.toLowerCase().includes("crear una nueva contraseña"));
}

function LoginUserIcon() {
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

function LoginLockIcon() {
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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading: authLoading, signIn } = useAuth();

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = submitting || authLoading;

  useEffect(() => {
    if (!user) return;

    navigate(getRedirectTarget(location.state), { replace: true });
  }, [user, navigate, location.state]);

  function clearErrorIfNeeded() {
    if (error) setError(null);
  }

  /**
   * Envía credenciales al AuthProvider.
   *
   * Regla importante:
   * - Solo redirige al sistema si result.ok === true.
   * - Si result.ok === false, nunca debe mandar al panel.
   * - Si backend indica contraseña pendiente, manda a /crear-password.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const usernameError = validateUsername(username);

    if (usernameError) {
      setError(usernameError);
      usernameRef.current?.focus();
      return;
    }

    if (!password.trim()) {
      setError("La contraseña es obligatoria.");
      passwordRef.current?.focus();
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    try {
      setSubmitting(true);
      setError(null);

      const result = await signIn({
        username: cleanUsername,
        password
      });

      if (!result.ok) {
        if (isPasswordResetRequired(result.details, result.error)) {
          navigate("/crear-password", {
            replace: true,
            state: {
              username: cleanUsername
            }
          });

          return;
        }

        setError(result.error || "Usuario o contraseña incorrectos.");
        setPassword("");
        passwordRef.current?.focus();
        return;
      }

      navigate(getRedirectTarget(location.state), { replace: true });
    } catch (error: unknown) {
      setError(getErrorMessage(error));
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`login-page ${LOGIN_THEME_CLASS[LOGIN_THEME]}`}>
      <section className="login-shell" aria-label="Inicio de sesión">
        <aside className="login-brand" aria-label="Cesantoni">
          <img
            src={isotipoCesantoni}
            alt=""
            className="login-brand-watermark"
            draggable={false}
            aria-hidden="true"
          />

          <div className="login-brand-center">
            <img
              src={logoCesantoni}
              alt="Cesantoni Porcelanato Premium"
              className="login-brand-logo"
              draggable={false}
            />
          </div>
        </aside>

        <section className="login-access" aria-label="Formulario de acceso">
          <div className="login-card">
            <header className="login-card-header">
              <p className="login-welcome">Bienvenido de nuevo</p>
              <h1>Iniciar sesión</h1>
              <p>Accede a tu cuenta para continuar</p>
            </header>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label htmlFor="login-username">Usuario</label>

                <div className="login-input-shell">
                  <span className="login-input-icon" aria-hidden="true">
                    <LoginUserIcon />
                  </span>

                  <input
                    id="login-username"
                    ref={usernameRef}
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

              <div className="login-field">
                <label htmlFor="login-password">Contraseña</label>

                <div className="login-input-shell">
                  <span className="login-input-icon" aria-hidden="true">
                    <LoginLockIcon />
                  </span>

                  <input
                    id="login-password"
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    disabled={isBusy}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearErrorIfNeeded();
                    }}
                  />

                  {password.length > 0 && (
                    <button
                      type="button"
                      className="login-password-toggle"
                      disabled={isBusy}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  )}
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={isBusy}>
                {isBusy ? (
                  <span className="login-submit-content">
                    <IconSpinner className="login-spinner" />
                    Validando
                  </span>
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}