// ======================================================
// PATH: backend\src\modules\login\fortia.client.ts
// Cliente centralizado para autenticación y consultas Fortia
// ======================================================

import { env, fortiaUrls, type FortiaUrlKey } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { FortiaAuthResult } from "./login.types.js";

/**
 * Payload enviado al endpoint de autenticación Fortia.
 *
 * Según Fortia:
 * - El endpoint devuelve un JSON Web Token.
 * - El JWT permite autenticar consultas posteriores.
 * - El JWT de Fortia expira después de 30 minutos.
 *
 * En NominaCes:
 * - El token Fortia se obtiene en cada login correcto.
 * - El frontend nunca recibe el token Fortia.
 * - El token Fortia se cifra y se guarda en app_session.
 * - La sesión NominaCes durará 25 minutos como margen de seguridad.
 *
 * Si Fortia cambia los nombres esperados del body, se ajusta solo aquí.
 */
type FortiaAuthPayload = {
  username: string;
  password: string;
};

/**
 * Opciones reutilizables para cualquier consulta a Fortia.
 *
 * Los módulos no deben armar manualmente:
 * - URL completa
 * - Authorization Bearer
 * - headers
 * - manejo de errores Fortia
 *
 * Todo debe pasar por fortiaRequest, fortiaGet o fortiaPost.
 */
type FortiaRequestOptions = {
  urlKey: FortiaUrlKey;
  token: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

/**
 * Construye la URL final para Fortia.
 *
 * Las URLs vienen completas desde .env porque Fortia no usa una sola base
 * uniforme para todos los recursos.
 *
 * Ejemplo:
 * - FORTIA_AUTH_URL
 * - FORTIA_EMPLOYEES_V2
 * - FORTIA_PAYROLL_V2
 * - FORTIA_RECEIPT_DETAILS_V1
 *
 * Si se envían query params, se agregan de forma segura.
 */
function buildFortiaUrl(
  urlKey: FortiaUrlKey,
  query?: FortiaRequestOptions["query"]
): string {
  const baseUrl = fortiaUrls[urlKey];

  if (!query || Object.keys(query).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Extrae el JWT de la respuesta de Fortia de forma tolerante.
 *
 * Fortia puede devolver:
 *
 * 1. String directo:
 * "eyJhbGciOi..."
 *
 * 2. Objeto:
 * {
 *   "token": "eyJhbGciOi..."
 * }
 *
 * 3. Objeto con data:
 * {
 *   "data": {
 *     "token": "eyJhbGciOi..."
 *   }
 * }
 *
 * Fortia indica que el JWT expira a los 30 minutos.
 * NominaCes usa 25 minutos como margen de seguridad.
 */
function extractFortiaToken(responseBody: unknown): string | null {
  if (typeof responseBody === "string" && responseBody.trim()) {
    return responseBody.trim();
  }

  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const body = responseBody as Record<string, unknown>;

  const directToken =
    body.token ??
    body.access_token ??
    body.accessToken ??
    body.jwt ??
    body.bearerToken;

  if (typeof directToken === "string" && directToken.trim()) {
    return directToken.trim();
  }

  const data = body.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;

    const dataToken =
      dataRecord.token ??
      dataRecord.access_token ??
      dataRecord.accessToken ??
      dataRecord.jwt ??
      dataRecord.bearerToken;

    if (typeof dataToken === "string" && dataToken.trim()) {
      return dataToken.trim();
    }
  }

  return null;
}


/**
 * Autentica contra Fortia y devuelve el token normalizado.
 *
 * Flujo:
 * 1. Usa FORTIA_USERNAME y FORTIA_PASSWORD desde .env.
 * 2. Llama FORTIA_AUTH_URL.
 * 3. Extrae el JWT de la respuesta.
 * 4. Devuelve solo { token }.
 *
 * No guarda nada en BD.
 * No cifra el token.
 * No crea sesión.
 *
 * La creación de sesión se hará en login.service.ts.
 */
export async function authenticateFortia(): Promise<FortiaAuthResult> {
  const payload: FortiaAuthPayload = {
    username: env.FORTIA_USERNAME,
    password: env.FORTIA_PASSWORD
  };

  let response: Response;

  try {
    response = await fetch(fortiaUrls.auth, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("[FORTIA_AUTH_NETWORK_ERROR]", error);

    throw new AppError({
      statusCode: 502,
      code: "BAD_REQUEST",
      message: "No fue posible conectar con Fortia."
    });
  }

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    console.error("[FORTIA_AUTH_ERROR]", {
      status: response.status,
      body: responseBody
    });

    throw new AppError({
      statusCode: 502,
      code: "BAD_REQUEST",
      message: "Fortia rechazó la autenticación."
    });
  }

  const token = extractFortiaToken(responseBody);

  if (!token) {
    console.error("[FORTIA_AUTH_TOKEN_NOT_FOUND]", responseBody);

    throw new AppError({
      statusCode: 502,
      code: "BAD_REQUEST",
      message: "Fortia no devolvió token de autenticación."
    });
  }

  return { token };
}

/**
 * Ejecuta una consulta genérica a Fortia usando token Bearer.
 *
 * Esta función centraliza:
 * - URL desde fortiaUrls
 * - query params
 * - método HTTP
 * - header Authorization
 * - parseo JSON
 * - errores de red
 * - errores de Fortia
 *
 * Si Fortia responde 401:
 * - Se regresa UNAUTHORIZED para que el backend pueda cerrar sesión.
 *
 * Si Fortia responde otro error:
 * - Se regresa BAD_REQUEST/502 para indicar error externo.
 */
export async function fortiaRequest<T>(
  options: FortiaRequestOptions
): Promise<T> {
  const method = options.method ?? "GET";
  const url = buildFortiaUrl(options.urlKey, options.query);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json"
      },
      body:
        method === "GET" || method === "DELETE"
          ? undefined
          : JSON.stringify(options.body ?? {})
    });
  } catch (error) {
    console.error("[FORTIA_REQUEST_NETWORK_ERROR]", {
      urlKey: options.urlKey,
      error
    });

    throw new AppError({
      statusCode: 502,
      code: "BAD_REQUEST",
      message: "No fue posible conectar con Fortia."
    });
  }

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    console.error("[FORTIA_REQUEST_ERROR]", {
      urlKey: options.urlKey,
      status: response.status,
      body: responseBody
    });

    throw new AppError({
      statusCode: response.status === 401 ? 401 : 502,
      code: response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST",
      message:
        response.status === 401
          ? "Token Fortia inválido o expirado."
          : "Fortia devolvió un error en la consulta."
    });
  }

  return responseBody as T;
}

/**
 * Helper para consultas GET a Fortia.
 *
 * Ejemplo de uso futuro:
 *
 * const empleados = await fortiaGet({
 *   urlKey: "employeesV2",
 *   token,
 *   query: { company_id: 1 }
 * });
 */
export async function fortiaGet<T>(params: {
  urlKey: FortiaUrlKey;
  token: string;
  query?: FortiaRequestOptions["query"];
}): Promise<T> {
  return fortiaRequest<T>({
    urlKey: params.urlKey,
    token: params.token,
    method: "GET",
    query: params.query
  });
}

/**
 * Helper para consultas POST a Fortia.
 */
export async function fortiaPost<T>(params: {
  urlKey: FortiaUrlKey;
  token: string;
  body?: unknown;
  query?: FortiaRequestOptions["query"];
}): Promise<T> {
  return fortiaRequest<T>({
    urlKey: params.urlKey,
    token: params.token,
    method: "POST",
    query: params.query,
    body: params.body
  });
}