// ======================================================
// PATH: src/modules/roles/roles.api.ts
// Cliente HTTP del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar las peticiones HTTP del módulo de roles.
 * - Normalizar respuestas del backend hacia contratos del frontend.
 * - Mantener encapsulada la comunicación con la API.
 *
 * No debe:
 * - Renderizar componentes.
 * - Manejar estados visuales.
 * - Contener estilos.
 */

import { API_BASE_URL } from "../../api/httpClient";

import type {
  CreateRoleRequest,
  RoleAuditDto,
  RoleDto,
  RolePermissionDto,
  UpdateRolePermissionsRequest,
  UpdateRoleRequest
} from "./roles.types";

/**
 * Envelope flexible para respuestas de API.
 */
type ApiEnvelope<T> = {
  ok?: boolean;
  message?: string;
  data?: T;
};

/**
 * Convierte una ruta relativa en URL absoluta.
 */
function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Lee el cuerpo de una respuesta HTTP de forma segura.
 */
async function parseResponseBody(response: Response): Promise<unknown> {
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
 * Obtiene un mensaje de error legible.
 */
function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
}

/**
 * Extrae data cuando la API responde con envelope.
 */
function unwrapData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data as T;
  }

  return payload as T;
}

/**
 * Ejecuta una petición HTTP tipada.
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit,
  fallbackErrorMessage: string
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallbackErrorMessage));
  }

  return unwrapData<T>(payload);
}

/**
 * Normaliza un valor desconocido a texto.
 */
function normalizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Normaliza un valor desconocido a número.
 */
function normalizeNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * Normaliza un valor desconocido a booleano.
 */
function normalizeBoolean(value: unknown): boolean {
  return Boolean(value);
}

/**
 * Normaliza texto nullable.
 */
function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

/**
 * Normaliza un rol recibido desde el backend.
 */
function normalizeRole(rawRole: unknown): RoleDto {
  const role = rawRole as Record<string, unknown>;

  return {
    id: normalizeNumber(role.id),
    roleKey: normalizeString(role.roleKey ?? role.role_key),
    roleName: normalizeString(role.roleName ?? role.role_name),
    description: normalizeNullableString(role.description),
    isActive: normalizeBoolean(role.isActive ?? role.is_active),
    createdAt: normalizeString(role.createdAt ?? role.created_at),
    updatedAt: normalizeString(role.updatedAt ?? role.updated_at)
  };
}

/**
 * Normaliza un permiso asignable recibido desde el backend.
 */
function normalizeRolePermission(
  rawPermission: unknown
): RolePermissionDto {
  const permission = rawPermission as Record<string, unknown>;

  return {
    permissionKey: normalizeString(
      permission.permissionKey ?? permission.permission_key
    ),
    permissionName: normalizeString(
      permission.permissionName ?? permission.permission_name
    ),
    moduleKey: normalizeString(
      permission.moduleKey ?? permission.module_key
    ),
    description: normalizeNullableString(permission.description),
    isActive: normalizeBoolean(
      permission.isActive ?? permission.is_active
    ),
    assigned: normalizeBoolean(permission.assigned)
  };
}

/**
 * Normaliza un registro de auditoría.
 */
function normalizeRoleAudit(rawAudit: unknown): RoleAuditDto {
  const audit = rawAudit as Record<string, unknown>;

  return {
    id: normalizeNumber(audit.id),
    oldRoleName: normalizeNullableString(
      audit.oldRoleName ?? audit.old_role_name
    ),
    newRoleName: normalizeNullableString(
      audit.newRoleName ?? audit.new_role_name
    ),
    oldDescription: normalizeNullableString(
      audit.oldDescription ?? audit.old_description
    ),
    newDescription: normalizeNullableString(
      audit.newDescription ?? audit.new_description
    ),
    oldIsActive:
      audit.oldIsActive ?? audit.old_is_active ?? null
        ? Boolean(audit.oldIsActive ?? audit.old_is_active)
        : audit.oldIsActive ?? audit.old_is_active === false
          ? false
          : null,
    newIsActive:
      audit.newIsActive ?? audit.new_is_active ?? null
        ? Boolean(audit.newIsActive ?? audit.new_is_active)
        : audit.newIsActive ?? audit.new_is_active === false
          ? false
          : null,
    changedByUsername: normalizeNullableString(
      audit.changedByUsername ?? audit.changed_by_username
    ),
    changedByFullName: normalizeNullableString(
      audit.changedByFullName ?? audit.changed_by_full_name
    ),
    changedAt: normalizeString(audit.changedAt ?? audit.changed_at)
  };
}

/**
 * Consulta todos los roles.
 */
export async function getRolesRequest(): Promise<RoleDto[]> {
  const result = await apiRequest<unknown[]>(
    "/roles",
    {
      method: "GET"
    },
    "No fue posible consultar roles."
  );

  return result.map(normalizeRole);
}

/**
 * Crea un rol.
 */
export async function createRoleRequest(
  payload: CreateRoleRequest
): Promise<RoleDto> {
  const result = await apiRequest<unknown>(
    "/roles",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    "No fue posible crear el rol."
  );

  return normalizeRole(result);
}

/**
 * Actualiza un rol existente.
 */
export async function updateRoleRequest(
  roleId: number,
  payload: UpdateRoleRequest
): Promise<RoleDto> {
  const result = await apiRequest<unknown>(
    `/roles/${roleId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    "No fue posible actualizar el rol."
  );

  return normalizeRole(result);
}

/**
 * Elimina un rol.
 */
export async function deleteRoleRequest(
  roleId: number
): Promise<void> {
  await apiRequest<unknown>(
    `/roles/${roleId}`,
    {
      method: "DELETE"
    },
    "No fue posible eliminar el rol."
  );
}

/**
 * Consulta los permisos disponibles y asignados de un rol.
 */
export async function getRolePermissionsRequest(
  roleId: number
): Promise<RolePermissionDto[]> {
  const result = await apiRequest<unknown[]>(
    `/roles/${roleId}/permissions`,
    {
      method: "GET"
    },
    "No fue posible consultar permisos del rol."
  );

  return result.map(normalizeRolePermission);
}

/**
 * Actualiza los permisos asignados a un rol.
 */
export async function updateRolePermissionsRequest(
  roleId: number,
  payload: UpdateRolePermissionsRequest
): Promise<RolePermissionDto[]> {
  const result = await apiRequest<unknown[]>(
    `/roles/${roleId}/permissions`,
    {
      method: "PUT",
      body: JSON.stringify(payload)
    },
    "No fue posible actualizar permisos del rol."
  );

  return result.map(normalizeRolePermission);
}

/**
 * Consulta la auditoría de un rol.
 */
export async function getRoleAuditRequest(
  roleId: number
): Promise<RoleAuditDto[]> {
  const result = await apiRequest<unknown[]>(
    `/roles/${roleId}/audit`,
    {
      method: "GET"
    },
    "No fue posible consultar la auditoría del rol."
  );

  return result.map(normalizeRoleAudit);
}