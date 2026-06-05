// ======================================================
// PATH: src/api/httpClient.ts
// Cliente HTTP central del frontend
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar las solicitudes HTTP hacia el backend.
 * - Incluir la cookie de sesión en todas las solicitudes.
 * - Normalizar respuestas y errores del backend.
 * - Detectar sesiones vencidas y redirigir al inicio de sesión.
 *
 * No debe:
 * - Contener lógica específica de módulos.
 * - Mostrar mensajes directamente en componentes.
 * - Administrar el estado completo de autenticación.
 */

import {
  ApiClientError,
  type ApiEnvelope,
  type ApiRequestOptions
} from "./api.types";

/**
 * Evento emitido cuando el backend indica que la sesión
 * actual dejó de ser válida.
 */
export const AUTH_SESSION_EXPIRED_EVENT =
  "nominaces:auth-session-expired";

/**
 * Obtiene la URL base utilizada para las solicitudes al backend.
 */
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as
    | string
    | undefined;

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  return "http://localhost:4002/api";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Construye una URL completa usando la ruta recibida.
 */
function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Normaliza una ruta para realizar comparaciones internas.
 */
function normalizePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return cleanPath.replace(/\/+$/, "") || "/";
}

/**
 * Determina si la solicitud corresponde al intento de inicio
 * de sesión y, por lo tanto, un 401 representa credenciales inválidas.
 */
function isLoginRequest(path: string, method: string): boolean {
  return normalizePath(path) === "/login" && method === "POST";
}

/**
 * Determina si el navegador ya se encuentra en la pantalla
 * pública de inicio de sesión.
 */
function isLoginPage(): boolean {
  return window.location.pathname === "/login";
}

/**
 * Notifica que la sesión venció y redirige al inicio de sesión.
 */
function handleUnauthorizedSession(
  path: string,
  method: string
): void {
  /*
   * Un 401 durante el POST de login corresponde normalmente
   * a credenciales inválidas y debe mostrarse dentro del formulario.
   */
  if (isLoginRequest(path, method)) {
    return;
  }

  /*
   * Evita redirecciones repetidas cuando AuthProvider consulta
   * la sesión mientras el usuario ya está en /login.
   */
  if (isLoginPage()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EXPIRED_EVENT)
  );

  window.location.replace("/login?reason=session-expired");
}

/**
 * Obtiene y convierte el contenido de una respuesta HTTP.
 */
async function parseResponseBody(
  response: Response
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Obtiene el mensaje normalizado de un error del backend.
 */
function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const value = payload as {
    error?: {
      message?: string;
    };
    message?: string;
  };

  return value.error?.message || value.message || fallback;
}

/**
 * Obtiene el código normalizado de un error del backend.
 */
function getErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = payload as {
    error?: {
      code?: string;
    };
    code?: string;
  };

  return value.error?.code || value.code;
}

/**
 * Obtiene los detalles adicionales de un error del backend.
 */
function getErrorDetails(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const value = payload as {
    error?: {
      details?: unknown;
    };
    details?: unknown;
  };

  return value.error?.details ?? value.details;
}

/**
 * Ejecuta una solicitud HTTP y normaliza su respuesta.
 */
export async function apiRequest<TResponse = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {})
  };

  const requestInit: RequestInit = {
    method,
    headers,
    credentials: "include"
  };

  if (options.body !== undefined) {
    if (!options.skipJsonContentType) {
      headers["Content-Type"] = "application/json";
      requestInit.body = JSON.stringify(options.body);
    } else {
      requestInit.body = options.body as BodyInit;
    }
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), requestInit);
  } catch {
    throw new ApiClientError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "No fue posible conectar con el servidor."
    });
  }

  const payload = await parseResponseBody(response);

  if (response.status === 401) {
    handleUnauthorizedSession(path, method);
  }

  if (!response.ok) {
    throw new ApiClientError({
      status: response.status,
      code: getErrorCode(payload),
      message: getErrorMessage(
        payload,
        response.status === 401
          ? "Tu sesión venció. Inicia sesión nuevamente."
          : "Ocurrió un error en la solicitud."
      ),
      details: getErrorDetails(payload)
    });
  }

  const envelope = payload as ApiEnvelope<TResponse>;

  if (
    envelope &&
    typeof envelope === "object" &&
    "ok" in envelope &&
    "data" in envelope
  ) {
    return envelope.data as TResponse;
  }

  return payload as TResponse;
}

/**
 * Ejecuta una solicitud GET.
 */
export function apiGet<TResponse = unknown>(
  path: string
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "GET"
  });
}

/**
 * Ejecuta una solicitud POST.
 */
export function apiPost<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    body
  });
}

/**
 * Ejecuta una solicitud PUT.
 */
export function apiPut<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PUT",
    body
  });
}

/**
 * Ejecuta una solicitud PATCH.
 */
export function apiPatch<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PATCH",
    body
  });
}

/**
 * Ejecuta una solicitud DELETE.
 */
export function apiDelete<TResponse = unknown>(
  path: string
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "DELETE"
  });
}