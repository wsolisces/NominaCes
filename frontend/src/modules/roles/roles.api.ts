// ======================================================
// PATH: src/modules/roles/roles.api.ts
// Cliente HTTP del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar los endpoints HTTP del módulo Roles.
 * - Enviar payloads tipados al backend.
 * - Validar y normalizar las respuestas recibidas.
 *
 * No debe:
 * - Administrar estado React.
 * - Mostrar mensajes visuales.
 * - Aplicar reglas de negocio de la pantalla.
 */

import { apiRequest } from "../../api/httpClient";

import type {
  CreateRoleInput,
  RoleDto,
  RolePayload,
  RolesListPayload,
  UpdateRoleInput
} from "./roles.types";

/**
 * Endpoints disponibles del módulo Roles.
 */
const ROLE_ENDPOINTS = {
  list: "/roles",

  detail(roleId: number): string {
    return `/roles/${roleId}`;
  },

  activate(roleId: number): string {
    return `/roles/${roleId}/activate`;
  },

  deactivate(roleId: number): string {
    return `/roles/${roleId}/deactivate`;
  }
} as const;

/**
 * Indica si un valor es un objeto válido.
 */
function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Indica si un valor cumple con la estructura pública de un rol.
 */
function isRoleDto(value: unknown): value is RoleDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value["id"] === "number" &&
    typeof value["roleKey"] === "string" &&
    typeof value["roleName"] === "string" &&
    (
      value["description"] === null ||
      typeof value["description"] === "string"
    ) &&
    typeof value["isActive"] === "boolean" &&
    Array.isArray(value["permissions"])
  );
}

/**
 * Normaliza un listado de roles recibido desde el backend.
 *
 * Formatos soportados:
 * - RoleDto[]
 * - { roles: RoleDto[] }
 */
function extractRoles(payload: RolesListPayload): RoleDto[] {
  if (Array.isArray(payload)) {
    const validRoles = payload.filter(isRoleDto);

    if (validRoles.length !== payload.length) {
      throw new Error(
        "El servidor devolvió uno o más roles inválidos."
      );
    }

    return validRoles;
  }

  if (
    isRecord(payload) &&
    Array.isArray(payload["roles"])
  ) {
    const roles = payload["roles"];
    const validRoles = roles.filter(isRoleDto);

    if (validRoles.length !== roles.length) {
      throw new Error(
        "El servidor devolvió uno o más roles inválidos."
      );
    }

    return validRoles;
  }

  throw new Error(
    "El servidor devolvió un listado de roles inválido."
  );
}

/**
 * Normaliza un rol individual recibido desde el backend.
 *
 * Formatos soportados:
 * - RoleDto
 * - { role: RoleDto }
 */
function extractRole(payload: RolePayload): RoleDto {
  if (
    isRecord(payload) &&
    isRoleDto(payload["role"])
  ) {
    return payload["role"];
  }

  if (isRoleDto(payload)) {
    return payload;
  }

  throw new Error(
    "El servidor devolvió información de rol inválida."
  );
}

/**
 * GET /roles
 *
 * Consulta todos los roles disponibles.
 */
export async function getRolesRequest(): Promise<RoleDto[]> {
  const payload = await apiRequest<RolesListPayload>(
    ROLE_ENDPOINTS.list
  );

  return extractRoles(payload);
}

/**
 * GET /roles/:id
 *
 * Consulta el detalle de un rol.
 */
export async function getRoleRequest(
  roleId: number
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.detail(roleId)
  );

  return extractRole(payload);
}

/**
 * POST /roles
 *
 * Crea un rol nuevo.
 */
export async function createRoleRequest(
  input: CreateRoleInput
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.list,
    {
      method: "POST",
      body: input
    }
  );

  return extractRole(payload);
}

/**
 * PATCH /roles/:id
 *
 * Modifica un rol existente.
 */
export async function updateRoleRequest(
  roleId: number,
  input: UpdateRoleInput
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.detail(roleId),
    {
      method: "PATCH",
      body: input
    }
  );

  return extractRole(payload);
}

/**
 * POST /roles/:id/activate
 *
 * Activa un rol existente.
 */
export async function activateRoleRequest(
  roleId: number
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.activate(roleId),
    {
      method: "POST"
    }
  );

  return extractRole(payload);
}

/**
 * POST /roles/:id/deactivate
 *
 * Inactiva un rol existente.
 */
export async function deactivateRoleRequest(
  roleId: number
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.deactivate(roleId),
    {
      method: "POST"
    }
  );

  return extractRole(payload);
}

/**
 * DELETE /roles/:id
 *
 * Elimina permanentemente un rol.
 */
export async function deleteRoleRequest(
  roleId: number
): Promise<RoleDto> {
  const payload = await apiRequest<RolePayload>(
    ROLE_ENDPOINTS.detail(roleId),
    {
      method: "DELETE"
    }
  );

  return extractRole(payload);
}