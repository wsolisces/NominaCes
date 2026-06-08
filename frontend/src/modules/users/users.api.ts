// ======================================================
// PATH: src/modules/usuarios/usuarios.api.ts
// Cliente API del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Encapsular llamadas HTTP relacionadas con usuarios.
 * - Normalizar respuestas comunes del backend.
 * - Mantener la pantalla desacoplada de fetch y de rutas internas.
 *
 * No debe:
 * - Renderizar componentes.
 * - Manejar estados visuales.
 * - Contener reglas de presentación.
 */

import { API_BASE_URL } from "../../api/httpClient";

import type {
  CreateUserPayload,
  RoleOptionDto,
  UpdateUserPayload,
  UserDto
} from "./users.types";

const USERS_ENDPOINT = "/users";
const ROLES_ENDPOINT = "/roles";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  users?: UserDto[];
  roles?: RoleOptionDto[];
};

function buildUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
  }

  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  fallbackError = "No fue posible completar la solicitud."
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackError));
  }

  return payload as T;
}

function extractUsers(payload: unknown): UserDto[] {
  const envelope = payload as ApiEnvelope<UserDto[] | { users?: UserDto[] }>;

  if (Array.isArray(envelope)) {
    return envelope;
  }

  if (Array.isArray(envelope.users)) {
    return envelope.users;
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data;
  }

  if (
    envelope.data &&
    typeof envelope.data === "object" &&
    Array.isArray((envelope.data as { users?: UserDto[] }).users)
  ) {
    return (envelope.data as { users: UserDto[] }).users;
  }

  return [];
}

function extractRoles(payload: unknown): RoleOptionDto[] {
  const envelope = payload as ApiEnvelope<RoleOptionDto[] | { roles?: RoleOptionDto[] }>;

  if (Array.isArray(envelope)) {
    return envelope;
  }

  if (Array.isArray(envelope.roles)) {
    return envelope.roles;
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data;
  }

  if (
    envelope.data &&
    typeof envelope.data === "object" &&
    Array.isArray((envelope.data as { roles?: RoleOptionDto[] }).roles)
  ) {
    return (envelope.data as { roles: RoleOptionDto[] }).roles;
  }

  return [];
}

/**
 * Obtiene usuarios registrados en el sistema.
 */
export async function getUsersRequest(): Promise<UserDto[]> {
  const payload = await request<unknown>(
    USERS_ENDPOINT,
    { method: "GET" },
    "No fue posible cargar los usuarios."
  );

  return extractUsers(payload);
}

/**
 * Obtiene roles activos para el formulario de usuarios.
 */
export async function getUserRolesRequest(): Promise<RoleOptionDto[]> {
  const payload = await request<unknown>(
    ROLES_ENDPOINT,
    { method: "GET" },
    "No fue posible cargar los roles."
  );

  return extractRoles(payload).filter((role) => role.is_active);
}

/**
 * Crea un usuario.
 */
export async function createUserRequest(payload: CreateUserPayload): Promise<UserDto> {
  const response = await request<ApiEnvelope<UserDto> | UserDto>(
    USERS_ENDPOINT,
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    "No fue posible crear el usuario."
  );

  if ("data" in response && response.data) {
    return response.data;
  }

  return response as UserDto;
}

/**
 * Actualiza un usuario.
 */
export async function updateUserRequest(
  userId: number,
  payload: UpdateUserPayload
): Promise<UserDto> {
  const response = await request<ApiEnvelope<UserDto> | UserDto>(
    `${USERS_ENDPOINT}/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    "No fue posible actualizar el usuario."
  );

  if ("data" in response && response.data) {
    return response.data;
  }

  return response as UserDto;
}

/**
 * Activa un usuario.
 */
export async function activateUserRequest(userId: number): Promise<void> {
  await request(
    `${USERS_ENDPOINT}/${userId}/activate`,
    { method: "PATCH" },
    "No fue posible activar el usuario."
  );
}

/**
 * Inactiva un usuario.
 */
export async function deactivateUserRequest(userId: number): Promise<void> {
  await request(
    `${USERS_ENDPOINT}/${userId}/deactivate`,
    { method: "PATCH" },
    "No fue posible inactivar el usuario."
  );
}

/**
 * Desbloquea un usuario bloqueado por intentos fallidos.
 */
export async function unlockUserRequest(userId: number): Promise<void> {
  await request(
    `${USERS_ENDPOINT}/${userId}/unlock`,
    { method: "PATCH" },
    "No fue posible desbloquear el usuario."
  );
}

/**
 * Elimina un usuario.
 */
export async function deleteUserRequest(userId: number): Promise<void> {
  await request(
    `${USERS_ENDPOINT}/${userId}`,
    { method: "DELETE" },
    "No fue posible eliminar el usuario."
  );
}