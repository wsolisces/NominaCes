// ======================================================
// PATH: frontend/src/pages/Users/users.api.ts
// Endpoints HTTP del módulo Usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar llamadas HTTP del módulo Usuarios.
 * - Adaptar el frontend a las rutas reales del backend.
 * - Normalizar respuestas antes de entregarlas a React.
 * - Mantener endpoints en un solo lugar.
 *
 * No debe:
 * - Renderizar componentes.
 * - Manejar estado visual.
 * - Contener estilos.
 * - Duplicar lógica de negocio del backend.
 */

import { apiRequest } from "../../api/httpClient";

import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserRoleOption,
  UserRow,
  UserTemporaryCodeResult
} from "./users.types";

import {
  extractRoles,
  extractTemporaryCodeResult,
  extractUsers,
  normalizeUserRow,
  unwrapBackendData
} from "./users.utils";

/**
 * Endpoints reales consumidos por Usuarios.
 *
 * Nota:
 * - Si httpClient ya agrega /api, aquí NO se debe escribir /api.
 * - Por eso se usa /users y /roles.
 */
const USERS_ENDPOINTS = {
  users: "/users",
  roles: "/roles",
  byId: (userId: string) => `/users/${userId}`,
  activate: (userId: string) => `/users/${userId}/activate`,
  deactivate: (userId: string) => `/users/${userId}/deactivate`,
  unlock: (userId: string) => `/users/${userId}/unlock`,
  resetPassword: (userId: string) => `/users/${userId}/reset-password`
} as const;

/**
 * Lista usuarios administrativos.
 */
export async function getUsers(): Promise<UserRow[]> {
  const response = await apiRequest<unknown>(USERS_ENDPOINTS.users);

  return extractUsers(response);
}

/**
 * Lista roles activos disponibles para asignar a usuarios.
 *
 * Esta llamada usa /roles porque el backend actual de users.routes.ts
 * no tiene GET /users/roles.
 */
export async function getRoles(): Promise<UserRoleOption[]> {
  const response = await apiRequest<unknown>(USERS_ENDPOINTS.roles);

  return extractRoles(response).filter((role) => role.is_active);
}

/**
 * Crea usuario y recibe código temporal para crear contraseña.
 */
export async function createUser(
  payload: CreateUserPayload
): Promise<UserTemporaryCodeResult> {
  const response = await apiRequest<unknown>(USERS_ENDPOINTS.users, {
    method: "POST",
    body: payload
  });

  return extractTemporaryCodeResult(response);
}

/**
 * Actualiza datos editables del usuario.
 *
 * Backend:
 * PATCH /users/:userId
 */
export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<UserRow> {
  const response = await apiRequest<unknown>(USERS_ENDPOINTS.byId(userId), {
    method: "PATCH",
    body: payload
  });

  return normalizeUserRow(unwrapBackendData(response));
}

/**
 * Activa cuenta.
 *
 * Backend:
 * POST /users/:userId/activate
 */
export async function activateUser(userId: string): Promise<void> {
  await apiRequest<unknown>(USERS_ENDPOINTS.activate(userId), {
    method: "POST"
  });
}

/**
 * Desactiva cuenta.
 *
 * Backend:
 * POST /users/:userId/deactivate
 */
export async function deactivateUser(userId: string): Promise<void> {
  await apiRequest<unknown>(USERS_ENDPOINTS.deactivate(userId), {
    method: "POST"
  });
}

/**
 * Desbloquea cuenta.
 *
 * Backend:
 * POST /users/:userId/unlock
 */
export async function unlockUser(userId: string): Promise<void> {
  await apiRequest<unknown>(USERS_ENDPOINTS.unlock(userId), {
    method: "POST"
  });
}

/**
 * Genera código temporal de contraseña.
 *
 * Backend:
 * POST /users/:userId/reset-password
 */
export async function resetUserPassword(
  userId: string
): Promise<UserTemporaryCodeResult> {
  const response = await apiRequest<unknown>(
    USERS_ENDPOINTS.resetPassword(userId),
    {
      method: "POST"
    }
  );

  return extractTemporaryCodeResult(response);
}