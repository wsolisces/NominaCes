// ======================================================
// PATH: src/auth/auth.types.ts
// Módulo: Autenticación frontend
// Capa: Tipos / contratos
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar tipos reutilizables de autenticación.
 * - Definir el contrato del usuario autenticado.
 * - Definir helpers públicos para autorización visual por permisos.
 * - Evitar que componentes dependan del JSON crudo del backend.
 * - Mantener contratos compartidos entre Login, Layout y rutas.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Guardar estado global.
 * - Contener lógica visual.
 * - Autorizar operaciones del backend.
 * - Contener reglas específicas de módulos.
 */

/**
 * Clave técnica de un permiso.
 *
 * Se mantiene como string porque el catálogo puede crecer sin obligar
 * al frontend a modificar este contrato general.
 */
export type PermissionKey = string;

/**
 * Configuración reutilizable para elementos protegidos por permisos.
 *
 * Puede utilizarse en:
 * - rutas
 * - elementos del sidebar
 * - botones
 * - acciones administrativas
 */
export type PermissionRequirement = {
  /**
   * Permiso único obligatorio.
   */
  requiredPermission?: PermissionKey;

  /**
   * El usuario debe contar con al menos uno de estos permisos.
   */
  anyPermissions?: PermissionKey[];

  /**
   * El usuario debe contar con todos estos permisos.
   */
  allPermissions?: PermissionKey[];
};

/**
 * Usuario autenticado normalizado para uso interno del frontend.
 *
 * Regla:
 * - Los componentes deben consumir AuthUser.
 * - Los componentes no deben depender directamente del JSON crudo.
 * - permissions debe ser normalizado por extractAuthUser().
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

  /**
   * Permisos activos asignados al usuario autenticado.
   */
  permissions?: PermissionKey[];

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
 * signIn() no debe lanzar errores hacia la pantalla.
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
 * Payload para crear contraseña definitiva mediante código temporal.
 */
export type CreatePasswordRequest = {
  username: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Respuesta esperada al crear correctamente una contraseña.
 */
export type CreatePasswordResponse = {
  username: string;
  passwordChanged: boolean;
};

/**
 * Contrato público del contexto de autenticación.
 *
 * Importante:
 * - Los helpers de permisos controlan únicamente la interfaz.
 * - El backend debe continuar validando cada operación protegida.
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

  /**
   * Indica si el usuario cuenta con un permiso específico.
   */
  hasPermission: (permission: PermissionKey) => boolean;

  /**
   * Indica si el usuario cuenta con al menos uno de los permisos.
   */
  hasAnyPermission: (permissions: PermissionKey[]) => boolean;

  /**
   * Indica si el usuario cuenta con todos los permisos.
   */
  hasAllPermissions: (permissions: PermissionKey[]) => boolean;
};

/**
 * Forma flexible de respuesta del backend.
 *
 * Formatos compatibles:
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