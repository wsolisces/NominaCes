// ======================================================
// PATH: src/modules/permisos/permisos.api.ts
// Cliente HTTP del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Encapsular las llamadas HTTP del catálogo de permisos.
 * - Normalizar respuestas del backend.
 * - Mantener aislada la ruta base del módulo.
 * - Usar permission_key como identificador real del permiso.
 *
 * No debe:
 * - Renderizar componentes.
 * - Manejar estado visual.
 * - Duplicar lógica de formularios.
 * - Usar id numérico porque app_permission no tiene columna id.
 */

import { API_BASE_URL } from "../../api/httpClient";

import type {
  CreatePermissionPayload,
  PermissionDto,
  PermissionResponse,
  PermissionsResponse,
  UpdatePermissionPayload
} from "./permisos.types";

/**
 * Ruta base real del módulo en backend.
 *
 * Debe coincidir con:
 * app.use("/api/permisos", permisosRoutes);
 */
const PERMISSIONS_ENDPOINT = "/permisos";

type ApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
};

type ApiErrorPayload = {
  message?: unknown;
  error?: unknown;
};

/**
 * Lee el cuerpo de la respuesta HTTP sin romper cuando viene vacío.
 */
async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Obtiene un mensaje de error legible desde la respuesta del backend.
 */
function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as ApiErrorPayload;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return fallback;
}

/**
 * Construye una URL segura usando la base global del frontend.
 */
function buildUrl(path: string): string {
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBaseUrl}${cleanPath}`;
}

/**
 * Codifica claves de permiso para usarlas de forma segura en rutas.
 */
function encodePermissionKey(permissionKey: string): string {
  return encodeURIComponent(permissionKey.trim());
}

/**
 * Ejecuta una petición HTTP del módulo de permisos.
 */
async function request<T>(
  path: string,
  options: RequestInit,
  fallbackError: string
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, fallbackError));
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    return envelope.data as T;
  }

  return payload as T;
}

/**
 * Normaliza distintas formas válidas de respuesta para listado.
 */
function normalizePermissionsPayload(payload: unknown): PermissionDto[] {
  if (Array.isArray(payload)) {
    return payload as PermissionDto[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as Partial<PermissionsResponse>;

  if (Array.isArray(response.permissions)) {
    return response.permissions;
  }

  return [];
}

/**
 * Normaliza distintas formas válidas de respuesta para un permiso.
 */
function normalizePermissionPayload(payload: unknown): PermissionDto {
  if (payload && typeof payload === "object") {
    const response = payload as Partial<PermissionResponse>;

    if (response.permission) {
      return response.permission;
    }
  }

  return payload as PermissionDto;
}

/**
 * Obtiene el catálogo completo de permisos.
 */
export async function getPermissionsRequest(): Promise<PermissionDto[]> {
  const payload = await request<unknown>(
    PERMISSIONS_ENDPOINT,
    {
      method: "GET"
    },
    "No fue posible obtener los permisos."
  );

  return normalizePermissionsPayload(payload);
}

/**
 * Crea un nuevo permiso.
 */
export async function createPermissionRequest(
  values: CreatePermissionPayload
): Promise<PermissionDto> {
  const payload = await request<unknown>(
    PERMISSIONS_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(values)
    },
    "No fue posible crear el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Actualiza un permiso existente usando permission_key.
 */
export async function updatePermissionRequest(
  permissionKey: string,
  values: UpdatePermissionPayload
): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${encodePermissionKey(permissionKey)}`,
    {
      method: "PUT",
      body: JSON.stringify(values)
    },
    "No fue posible actualizar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Activa un permiso usando permission_key.
 */
export async function activatePermissionRequest(
  permissionKey: string
): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${encodePermissionKey(permissionKey)}/activate`,
    {
      method: "PATCH"
    },
    "No fue posible activar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Desactiva un permiso usando permission_key.
 */
export async function deactivatePermissionRequest(
  permissionKey: string
): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${encodePermissionKey(permissionKey)}/deactivate`,
    {
      method: "PATCH"
    },
    "No fue posible desactivar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Elimina un permiso usando permission_key.
 */
export async function deletePermissionRequest(
  permissionKey: string
): Promise<void> {
  await request<void>(
    `${PERMISSIONS_ENDPOINT}/${encodePermissionKey(permissionKey)}`,
    {
      method: "DELETE"
    },
    "No fue posible eliminar el permiso."
  );
}