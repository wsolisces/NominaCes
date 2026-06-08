// ======================================================
// PATH: src/modules/permisos/permisos.api.ts
// Cliente HTTP del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Encapsular las llamadas HTTP del catálogo de permisos.
 * - Normalizar respuestas del backend.
 * - Mantener aislada la ruta base del módulo.
 *
 * No debe:
 * - Renderizar componentes.
 * - Manejar estado visual.
 * - Duplicar lógica de formularios.
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
 * Ajusta este endpoint si tu backend expone otra ruta.
 *
 * Opciones comunes:
 * - "/permissions"
 * - "/permisos"
 */
const PERMISSIONS_ENDPOINT = "/permissions";

type ApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
};

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }

  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }

  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  fallbackError: string
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

  const envelope = payload as ApiEnvelope<T>;

  if (envelope && typeof envelope === "object" && "data" in envelope) {
    return envelope.data as T;
  }

  return payload as T;
}

function normalizePermissionsPayload(payload: unknown): PermissionDto[] {
  if (Array.isArray(payload)) {
    return payload as PermissionDto[];
  }

  const response = payload as Partial<PermissionsResponse>;

  if (Array.isArray(response.permissions)) {
    return response.permissions;
  }

  return [];
}

function normalizePermissionPayload(payload: unknown): PermissionDto {
  const response = payload as Partial<PermissionResponse>;

  if (response.permission) {
    return response.permission;
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
 * Actualiza un permiso existente.
 */
export async function updatePermissionRequest(
  id: number,
  values: UpdatePermissionPayload
): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(values)
    },
    "No fue posible actualizar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Activa un permiso.
 */
export async function activatePermissionRequest(id: number): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${id}/activate`,
    {
      method: "PATCH"
    },
    "No fue posible activar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Desactiva un permiso.
 */
export async function deactivatePermissionRequest(id: number): Promise<PermissionDto> {
  const payload = await request<unknown>(
    `${PERMISSIONS_ENDPOINT}/${id}/deactivate`,
    {
      method: "PATCH"
    },
    "No fue posible desactivar el permiso."
  );

  return normalizePermissionPayload(payload);
}

/**
 * Elimina un permiso.
 */
export async function deletePermissionRequest(id: number): Promise<void> {
  await request<void>(
    `${PERMISSIONS_ENDPOINT}/${id}`,
    {
      method: "DELETE"
    },
    "No fue posible eliminar el permiso."
  );
}