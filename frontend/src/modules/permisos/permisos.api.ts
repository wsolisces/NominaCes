// ======================================================
// PATH: src/modules/permisos/permisos.api.ts
// Cliente HTTP del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Consumir endpoints del backend para permisos.
 * - Normalizar respuestas HTTP.
 * - Mantener aisladas las rutas del API.
 *
 * No debe:
 * - Renderizar componentes.
 * - Guardar estado visual.
 * - Duplicar reglas de negocio del backend.
 */

import type {
  PermissionAuditDto,
  PermissionDto,
  UpdatePermissionPayload
} from "./permisos.types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4002";

/**
 * Respuesta estándar del backend.
 */
type ApiResponse<T> = {
  data: T;
  message?: string;
};

/**
 * Extrae mensaje seguro de una respuesta fallida.
 */
async function getErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };

    return payload.message || "No fue posible completar la operación.";
  } catch {
    return "No fue posible completar la operación.";
  }
}

/**
 * Normaliza respuestas con formato:
 * - T
 * - { data: T }
 */
function unwrapApiResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

/**
 * Consulta permisos.
 */
export async function getPermissionsRequest(): Promise<PermissionDto[]> {
  const response = await fetch(`${API_BASE_URL}/permisos`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload: unknown = await response.json();

  return unwrapApiResponse<PermissionDto[]>(payload);
}

/**
 * Consulta detalle de un permiso.
 */
export async function getPermissionRequest(
  permissionKey: string
): Promise<PermissionDto> {
  const response = await fetch(
    `${API_BASE_URL}/permisos/${encodeURIComponent(permissionKey)}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload: unknown = await response.json();

  return unwrapApiResponse<PermissionDto>(payload);
}

/**
 * Actualiza metadata de un permiso controlado.
 */
export async function updatePermissionRequest(
  permissionKey: string,
  payload: UpdatePermissionPayload
): Promise<PermissionDto> {
  const response = await fetch(
    `${API_BASE_URL}/permisos/${encodeURIComponent(permissionKey)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result: unknown = await response.json();

  return unwrapApiResponse<PermissionDto>(result);
}

/**
 * Consulta auditoría de un permiso.
 */
export async function getPermissionAuditRequest(
  permissionKey: string
): Promise<PermissionAuditDto[]> {
  const response = await fetch(
    `${API_BASE_URL}/permisos/${encodeURIComponent(permissionKey)}/audit`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload: unknown = await response.json();

  return unwrapApiResponse<PermissionAuditDto[]>(payload);
}