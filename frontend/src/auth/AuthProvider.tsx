// ======================================================
// PATH: src/auth/AuthProvider.tsx
// Módulo: Autenticación frontend
// Capa: Provider / estado global
// ======================================================

/**
 * Responsabilidades:
 * - Cargar la sesión inicial mediante /login/me.
 * - Mantener al usuario autenticado en memoria.
 * - Exponer funciones reutilizables de autenticación.
 * - Exponer helpers para controlar elementos visuales por permiso.
 * - Convertir errores técnicos del API en resultados controlados.
 *
 * No debe:
 * - Renderizar pantallas de login.
 * - Definir rutas.
 * - Decidir qué elementos específicos debe mostrar cada módulo.
 * - Sustituir la autorización obligatoria del backend.
 * - Contener estilos.
 */

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { ApiClientError } from "../api/api.types";

import {
  extractAuthUser,
  loginRequest,
  logoutRequest,
  meRequest
} from "./auth.api";

import type {
  AuthContextValue,
  AuthUser,
  LoginRequest,
  LoginResult,
  PermissionKey
} from "./auth.types";

export const AuthContext =
  createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Normaliza una clave técnica de permiso.
 *
 * Reglas:
 * - Elimina espacios laterales.
 * - Convierte la clave a mayúsculas.
 */
function normalizePermission(permission: PermissionKey): PermissionKey {
  return permission.trim().toUpperCase();
}

/**
 * Obtiene una lista normalizada y sin permisos repetidos.
 */
function normalizePermissions(
  permissions: PermissionKey[]
): PermissionKey[] {
  return Array.from(
    new Set(
      permissions
        .map(normalizePermission)
        .filter(Boolean)
    )
  );
}

/**
 * Convierte errores técnicos del cliente HTTP en un resultado
 * controlado que pueda utilizar la pantalla de acceso.
 */
function getLoginError(error: unknown): Omit<LoginResult, "ok"> {
  if (error instanceof ApiClientError) {
    return {
      error: error.message || "No se pudo iniciar sesión.",
      code: error.code,
      status: error.status,
      details: error.details
    };
  }

  if (error instanceof Error && error.message) {
    return {
      error: error.message
    };
  }

  if (typeof error === "string" && error.trim()) {
    return {
      error
    };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return {
        error: message
      };
    }
  }

  return {
    error: "No se pudo iniciar sesión."
  };
}

/**
 * Provider global de autenticación y permisos.
 *
 * Debe envolver al router completo para permitir que Login,
 * RequireAuth, AppLayout, Sidebar y páginas privadas utilicen
 * la sesión y los permisos del usuario.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Permisos normalizados del usuario autenticado.
   */
  const userPermissions = useMemo<PermissionKey[]>(
    () => normalizePermissions(user?.permissions ?? []),
    [user]
  );

  /**
   * Determina si el usuario posee un permiso específico.
   *
   * Este helper controla únicamente la interfaz.
   * El backend debe continuar validando cada operación.
   */
  const hasPermission = useCallback(
    (permission: PermissionKey): boolean => {
      const normalizedPermission = normalizePermission(permission);

      if (!normalizedPermission) {
        return false;
      }

      return userPermissions.includes(normalizedPermission);
    },
    [userPermissions]
  );

  /**
   * Determina si el usuario posee al menos uno de los permisos.
   */
  const hasAnyPermission = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (permissions.length === 0) {
        return false;
      }

      return permissions.some(hasPermission);
    },
    [hasPermission]
  );

  /**
   * Determina si el usuario posee todos los permisos indicados.
   */
  const hasAllPermissions = useCallback(
    (permissions: PermissionKey[]): boolean => {
      if (permissions.length === 0) {
        return false;
      }

      return permissions.every(hasPermission);
    },
    [hasPermission]
  );

  /**
   * Consulta nuevamente la sesión vigente contra backend.
   *
   * Se utiliza para:
   * - Validar la sesión actual.
   * - Actualizar datos y permisos del usuario.
   * - Limpiar el estado local cuando la sesión dejó de ser válida.
   */
  const refreshSession = useCallback(
    async (): Promise<AuthUser | null> => {
      try {
        const response = await meRequest();

        const nextUser = response.user
          ? extractAuthUser(response.user)
          : null;

        setUser(nextUser);

        return nextUser;
      } catch {
        setUser(null);
        return null;
      }
    },
    []
  );

  /**
   * Carga inicialmente la sesión del usuario.
   *
   * Mientras la petición no finalice, loading permanece activo
   * para evitar redirecciones prematuras desde RequireAuth.
   */
  useEffect(() => {
    let mounted = true;

    async function loadSession(): Promise<void> {
      try {
        const response = await meRequest();

        const nextUser = response.user
          ? extractAuthUser(response.user)
          : null;

        if (mounted) {
          setUser(nextUser);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Ejecuta inicio de sesión directo.
   *
   * Puede lanzar errores. Para componentes visuales se recomienda
   * utilizar signIn(), que devuelve un resultado controlado.
   */
  const login = useCallback(
    async (payload: LoginRequest): Promise<AuthUser> => {
      const response = await loginRequest(payload);
      const nextUser = extractAuthUser(response.user);

      setUser(nextUser);

      return nextUser;
    },
    []
  );

  /**
   * Ejecuta inicio de sesión controlado para componentes visuales.
   */
  const signIn = useCallback(
    async (payload: LoginRequest): Promise<LoginResult> => {
      try {
        const nextUser = await login(payload);

        return {
          ok: true,
          user: nextUser
        };
      } catch (error) {
        setUser(null);

        return {
          ok: false,
          ...getLoginError(error)
        };
      }
    },
    [login]
  );

  /**
   * Cierra la sesión local y remota.
   *
   * Aunque la petición remota falle, el usuario local se limpia
   * para evitar mantener una sesión inválida en la interfaz.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const initialized = !loading;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      initialized,
      isAuthenticated: Boolean(user),

      login,
      signIn,

      logout,
      signOut: logout,

      refreshSession,
      refreshUser: refreshSession,

      hasPermission,
      hasAnyPermission,
      hasAllPermissions
    }),
    [
      user,
      loading,
      initialized,
      login,
      signIn,
      logout,
      refreshSession,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}