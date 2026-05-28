// ======================================================
// PATH: src/api/httpClient.ts
// Cliente HTTP central del frontend
// ======================================================

import {
  ApiClientError,
  type ApiEnvelope,
  type ApiRequestOptions,
} from "./api.types";

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  return "http://localhost:4002/api";
}

export const API_BASE_URL = getApiBaseUrl();

function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const value = payload as {
    error?: {
      message?: string;
    };
    message?: string;
  };

  return value.error?.message || value.message || fallback;
}

function getErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const value = payload as {
    error?: {
      code?: string;
    };
    code?: string;
  };

  return value.error?.code || value.code;
}

function getErrorDetails(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return undefined;

  const value = payload as {
    error?: {
      details?: unknown;
    };
    details?: unknown;
  };

  return value.error?.details ?? value.details;
}

export async function apiRequest<TResponse = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<TResponse> {
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  const requestInit: RequestInit = {
    method,
    headers,
    credentials: "include",
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
      message: "No fue posible conectar con el servidor.",
    });
  }

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiClientError({
      status: response.status,
      code: getErrorCode(payload),
      message: getErrorMessage(payload, "Ocurrió un error en la solicitud."),
      details: getErrorDetails(payload),
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

export function apiGet<TResponse = unknown>(
  path: string
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "GET",
  });
}

export function apiPost<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "POST",
    body,
  });
}

export function apiPut<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PUT",
    body,
  });
}

export function apiPatch<TResponse = unknown>(
  path: string,
  body?: unknown
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "PATCH",
    body,
  });
}

export function apiDelete<TResponse = unknown>(
  path: string
): Promise<TResponse> {
  return apiRequest<TResponse>(path, {
    method: "DELETE",
  });
}