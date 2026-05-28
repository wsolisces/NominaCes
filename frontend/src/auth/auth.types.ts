// ======================================================
// PATH: src/auth/auth.types.ts
// Módulo: Autenticación frontend
// Capa: Tipos / contratos
// Descripción:
//   Define los contratos TypeScript usados por el frontend
//   para iniciar sesión, validar sesión, cerrar sesión y crear
//   contraseña mediante código temporal.
//
// Responsabilidades:
//   - Centralizar tipos reutilizables de autenticación.
//   - Evitar que Login, ResetPassword, Sidebar o Layout dependan
//     directamente de la forma exacta de respuesta del backend.
//   - Mantener compatibilidad con respuestas flexibles del API.
//
// No debe:
//   - Ejecutar peticiones HTTP.
//   - Guardar estado global.
//   - Contener lógica visual.
//   - Contener reglas de navegación.
// ======================================================

/**
 * Usuario autenticado normalizado para uso interno del frontend.
 *
 * Este tipo acepta campos flexibles porque el backend puede devolver
 * datos adicionales del usuario, rol o permisos.
 *
 * Regla:
 * - Los componentes deben consumir AuthUser.
 * - Los componentes no deben depender directamente del JSON crudo del backend.
 */
export type AuthUser = {
  id?: number | string;
  user_id?: number | string;

  username?: string;

  full_name?: string;
  fullName?: string;
  name?: string;
  employee_name?: string;

  role_id?: number | string;
  role_key?: string;
  role_name?: string;
  role?: string;

  permissions?: string[];

  status?: string;
  is_active?: boolean;
  is_locked?: boolean;

  [key: string]: unknown;
};

/**
 * Datos requeridos por el login actual.
 *
 * Regla de negocio:
 * - NominaCes inicia sesión con username.
 * - No se usa email para autenticar.
 */
export type LoginRequest = {
  username: string;
  password: string;
};

/**
 * Resultado controlado para pantallas de login.
 *
 * Importante:
 * - signIn() no debe lanzar errores hacia la pantalla.
 * - Login.tsx debe poder decidir con ok=true/false si redirige,
 *   muestra error o manda a crear contraseña.
 */
export type LoginResult = {
  ok: boolean;
  user?: AuthUser;
  error?: string;
  code?: string;
  status?: number;
  details?: unknown;
};

/**
 * Payload para crear contraseña definitiva usando código temporal.
 *
 * Se usa cuando backend detecta:
 * - password_reset_required = true
 */
export type CreatePasswordRequest = {
  username: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Respuesta esperada cuando el backend crea correctamente
 * la nueva contraseña del usuario.
 */
export type CreatePasswordResponse = {
  username: string;
  passwordChanged: boolean;
};

/**
 * Contrato público del contexto de autenticación.
 *
 * Cualquier componente que use useAuth() debe depender solo
 * de estas propiedades y funciones.
 */
export type AuthContextValue = {
  user: AuthUser | null;

  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;

  login: (payload: LoginRequest) => Promise<AuthUser>;
  signIn: (payload: LoginRequest) => Promise<LoginResult>;

  logout: () => Promise<void>;
  signOut: () => Promise<void>;

  refreshSession: () => Promise<AuthUser | null>;
  refreshUser: () => Promise<AuthUser | null>;
};

/**
 * Forma flexible de respuesta del backend.
 *
 * Se mantiene porque el backend puede responder en diferentes formatos:
 * - { user }
 * - { data: { user } }
 * - { ok, data }
 * - { error }
 */
export type AuthBackendPayload = {
  ok?: boolean;
  data?: unknown;
  user?: unknown;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};