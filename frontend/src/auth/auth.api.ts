// ======================================================
// PATH: src/auth/auth.api.ts
// Módulo: Autenticación frontend
// Capa: Cliente API
// Descripción:
//   Centraliza las llamadas HTTP del frontend hacia los endpoints
//   de autenticación del backend.
//
// Responsabilidades:
//   - Ejecutar peticiones de login, sesión, logout y crear contraseña.
//   - Normalizar el usuario recibido desde backend.
//   - Aislar a las pantallas de la estructura exacta del API.
//
// No debe:
//   - Guardar estado global.
//   - Redirigir rutas.
//   - Mostrar mensajes visuales.
//   - Contener lógica de formularios.
// ======================================================

import { apiGet, apiPost } from "../api/httpClient";

import type {
  AuthUser,
  CreatePasswordRequest,
  CreatePasswordResponse,
  LoginRequest,
} from "./auth.types";

export type LoginResponse = {
  user: AuthUser;
};

export type SessionResponse = {
  user: AuthUser | null;
};

/**
 * Convierte un valor desconocido a string seguro.
 *
 * Se usa en normalización para evitar que componentes reciban
 * valores null/undefined donde esperan texto opcional.
 */
function asString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

/**
 * Convierte un valor desconocido a identificador compatible.
 *
 * Se permite string o number porque algunas tablas/API pueden devolver
 * ids numéricos y otras respuestas pueden devolverlos como texto.
 */
function asId(value: unknown): string | number | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  return String(value);
}

/**
 * Lee el primer campo existente dentro de un objeto.
 *
 * Esto permite soportar variantes del backend como:
 * - full_name / fullName
 * - role_name / roleName
 * - role_key / roleKey
 */
function getField(value: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (value[key] !== null && value[key] !== undefined) {
      return value[key];
    }
  }

  return undefined;
}

/**
 * Convierte un valor desconocido a objeto plano seguro.
 *
 * Si el valor no es objeto, devuelve un objeto vacío para que
 * los normalizadores no fallen.
 */
function getObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

/**
 * Normaliza permisos recibidos desde backend.
 *
 * Regla:
 * - Solo se conservan permisos con texto válido.
 * - Cualquier valor no arreglo se convierte en lista vacía.
 */
function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

/**
 * Normaliza el usuario recibido del backend al contrato AuthUser.
 *
 * Esta función es importante porque evita que pantallas como Login,
 * Sidebar o AppLayout dependan de nombres exactos del backend.
 */
export function extractAuthUser(raw: unknown): AuthUser {
  const value = getObject(raw);
  const roleObject = getObject(value.role);

  const id = getField(value, "id", "user_id");
  const userId = getField(value, "user_id", "id");

  const fullName = getField(
    value,
    "full_name",
    "fullName",
    "name",
    "employee_name"
  );

  const roleId = getField(value, "role_id", "roleId", "rol_id", "rolId");

  const roleKey =
    getField(value, "role_key", "roleKey", "rol_key", "rolKey") ??
    getField(roleObject, "role_key", "roleKey", "key");

  const roleName =
    getField(value, "role_name", "roleName", "rol_name", "rolName") ??
    getField(roleObject, "role_name", "roleName", "name");

  const permissions =
    getField(value, "permissions") ?? getField(roleObject, "permissions");

  return {
    ...value,

    id: asId(id),
    user_id: asId(userId),

    username: asString(value.username),

    full_name: asString(fullName),
    fullName: asString(fullName),
    name: asString(value.name),
    employee_name: asString(value.employee_name),

    role_id: asId(roleId),
    role_key: asString(roleKey),
    role_name: asString(roleName),
    role: asString(roleName),

    permissions: normalizePermissions(permissions),

    status: asString(value.status),
    is_active:
      typeof value.is_active === "boolean" ? value.is_active : undefined,
    is_locked:
      typeof value.is_locked === "boolean" ? value.is_locked : undefined,
  };
}

/**
 * Extrae el usuario desde las posibles formas de respuesta del backend.
 *
 * Soporta:
 * - { user }
 * - { data: { user } }
 */
function unwrapUser(response: unknown): unknown {
  const value = getObject(response);
  const data = getObject(value.data);

  return value.user ?? data.user ?? null;
}

/**
 * Normaliza la respuesta del endpoint POST /login.
 */
function normalizeLoginResponse(response: unknown): LoginResponse {
  const user = unwrapUser(response);

  return {
    user: extractAuthUser(user),
  };
}

/**
 * Normaliza la respuesta del endpoint GET /login/me.
 */
function normalizeSessionResponse(response: unknown): SessionResponse {
  const user = unwrapUser(response);

  return {
    user: user ? extractAuthUser(user) : null,
  };
}

/**
 * Ejecuta login contra backend.
 *
 * No guarda estado de sesión en React.
 * AuthProvider es quien decide qué hacer con el usuario recibido.
 */
export async function loginRequest(
  payload: LoginRequest
): Promise<LoginResponse> {
  const response = await apiPost<unknown>("/login", payload);
  return normalizeLoginResponse(response);
}

/**
 * Consulta la sesión actual.
 *
 * Se usa al cargar la aplicación para saber si ya existe sesión válida.
 */
export async function meRequest(): Promise<SessionResponse> {
  const response = await apiGet<unknown>("/login/me");
  return normalizeSessionResponse(response);
}

/**
 * Alias semántico de meRequest().
 *
 * Se conserva para compatibilidad con componentes que usen
 * el nombre getSessionRequest.
 */
export async function getSessionRequest(): Promise<SessionResponse> {
  return meRequest();
}

/**
 * Cierra sesión contra backend.
 *
 * El backend debe revocar la sesión/cookie actual.
 */
export async function logoutRequest(): Promise<void> {
  await apiPost<void>("/login/logout");
}

/**
 * Crea contraseña definitiva usando código temporal.
 *
 * Se usa desde /crear-password cuando el backend indicó que el usuario
 * tiene password_reset_required = true.
 */
export async function createPasswordRequest(
  payload: CreatePasswordRequest
): Promise<CreatePasswordResponse> {
  return apiPost<CreatePasswordResponse>("/login/create-password", payload);
}