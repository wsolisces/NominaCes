// ======================================================
// PATH: backend/src/integrations/fortia/fortia.client.ts
// Cliente centralizado para autenticación y consultas Fortia
// ======================================================

import { env, fortiaUrls, type FortiaUrlKey } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { FortiaAuthResult } from "./fortia.types.js";

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
 *
 * No debe:
 * - Guardar información en BD.
 * - Crear sesiones internas.
 */
type FortiaAuthPayload = {
  username: string;
  password: string;
};

/**
 * Opciones reutilizables para cualquier consulta a Fortia.
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
 * Responsabilidades:
 * - Tomar la URL base desde fortiaUrls.
 * - Agregar query params de manera segura.
 *
 * No debe:
 * - Leer process.env directamente.
 * - Validar reglas de negocio internas.
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
 * - string directo
 * - { token }
 * - { access_token }
 * - { data: { token } }
 *
 * No debe:
 * - Validar si el token ya expiró.
 * - Guardar token en sesión.
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
 * - Usa credenciales Fortia desde env.
 * - Llama FORTIA_AUTH_URL.
 * - Normaliza la respuesta a { token }.
 *
 * No debe:
 * - Cifrar el token.
 * - Crear sesión.
 * - Enviar el token al frontend.
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
 * Responsabilidades:
 * - Resolver URL desde fortiaUrls.
 * - Agregar query params.
 * - Agregar Authorization Bearer.
 * - Parsear respuesta JSON.
 * - Normalizar errores de red y errores Fortia.
 *
 * Reglas:
 * - Si Fortia responde 401, se lanza UNAUTHORIZED.
 * - Si Fortia responde otro error, se lanza BAD_REQUEST con 502.
 *
 * No debe:
 * - Crear sesiones NominaCes.
 * - Cifrar tokens.
 * - Modificar datos internos.
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