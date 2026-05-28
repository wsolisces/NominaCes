// ======================================================
// PATH: src/auth/AuthProvider.tsx
// Módulo: Autenticación frontend
// Capa: Provider / estado global
// Descripción:
//   Mantiene en memoria el estado de sesión del usuario autenticado
//   y expone funciones reutilizables para login, logout y refresh.
//
// Responsabilidades:
//   - Cargar sesión inicial con /login/me.
//   - Guardar usuario autenticado en memoria React.
//   - Exponer login(), signIn(), logout() y refreshSession().
//   - Convertir errores técnicos del API en resultados controlados.
//   - Evitar que las pantallas llamen directamente al API.
//
// No debe:
//   - Renderizar pantallas de login.
//   - Definir rutas.
//   - Manejar permisos visuales del menú.
//   - Contener estilos.
// ======================================================

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiClientError } from "../api/api.types";

import {
  extractAuthUser,
  loginRequest,
  logoutRequest,
  meRequest,
} from "./auth.api";

import type {
  AuthContextValue,
  AuthUser,
  LoginRequest,
  LoginResult,
} from "./auth.types";

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Convierte errores técnicos del cliente HTTP en un resultado simple
 * que la pantalla Login.tsx pueda usar sin try/catch complejo.
 *
 * Casos esperados:
 * - usuario incorrecto
 * - contraseña incorrecta
 * - usuario bloqueado
 * - usuario inactivo
 * - rol inactivo
 * - contraseña temporal requerida
 */
function getLoginError(error: unknown): Omit<LoginResult, "ok"> {
  if (error instanceof ApiClientError) {
    return {
      error: error.message || "No se pudo iniciar sesión.",
      code: error.code,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof Error && error.message) {
    return {
      error: error.message,
    };
  }

  if (typeof error === "string" && error.trim()) {
    return {
      error,
    };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return {
        error: message,
      };
    }
  }

  return {
    error: "No se pudo iniciar sesión.",
  };
}

/**
 * Provider global de autenticación.
 *
 * Debe envolver al router completo para que Login, RequireAuth,
 * AppLayout, Sidebar y cualquier pantalla privada puedan usar useAuth().
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Consulta la sesión vigente contra backend.
   *
   * Se usa para:
   * - validar sesión al abrir la aplicación
   * - refrescar usuario después de cambios administrativos
   * - limpiar frontend si la sesión ya no es válida
   */
  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await meRequest();
      const nextUser = response.user ? extractAuthUser(response.user) : null;

      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    /**
     * Carga inicial de sesión.
     *
     * Regla:
     * - Mientras esto no termina, RequireAuth no debe decidir si redirige.
     * - Por eso se mantiene loading=true hasta finalizar.
     */
    async function loadSession() {
      try {
        const response = await meRequest();
        const nextUser = response.user ? extractAuthUser(response.user) : null;

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
   * Ejecuta login directo.
   *
   * Esta función sí puede lanzar error.
   * Para pantallas visuales se recomienda usar signIn(),
   * porque signIn devuelve { ok, error }.
   */
  const login = useCallback(async (payload: LoginRequest): Promise<AuthUser> => {
    const response = await loginRequest(payload);
    const nextUser = extractAuthUser(response.user);

    setUser(nextUser);
    return nextUser;
  }, []);

  /**
   * Login seguro para UI.
   *
   * No lanza errores hacia el componente.
   * Devuelve un resultado controlado para que Login.tsx pueda:
   * - mostrar mensaje
   * - redirigir al panel
   * - redirigir a crear contraseña
   */
  const signIn = useCallback(
    async (payload: LoginRequest): Promise<LoginResult> => {
      try {
        const nextUser = await login(payload);

        return {
          ok: true,
          user: nextUser,
        };
      } catch (error) {
        setUser(null);

        return {
          ok: false,
          ...getLoginError(error),
        };
      }
    },
    [login]
  );

  /**
   * Cierra sesión local y remota.
   *
   * Aunque el backend falle o la sesión ya no exista, el frontend
   * debe limpiar el usuario local para sacar al usuario del sistema.
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
    }),
    [user, loading, initialized, login, signIn, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}