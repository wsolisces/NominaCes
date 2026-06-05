// ======================================================
// PATH: backend/src/modules/roles/roles.service.ts
// Reglas de negocio del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Normalizar datos recibidos.
 * - Validar creación y modificación de roles.
 * - Aplicar reglas de negocio.
 * - Coordinar operaciones del repository.
 * - Convertir filas internas a respuestas públicas.
 *
 * No debe:
 * - Ejecutar SQL.
 * - Leer Request o Response de Express.
 * - Validar cookies o permisos del usuario.
 */

import { AppError } from "../../shared/errors/AppError.js";

import {
  countUsersByRoleId,
  deleteRoleById,
  findRoleById,
  findRoleByKey,
  findRoles,
  insertRole,
  setRoleActiveById,
  updateRoleById
} from "./roles.repository.js";

import type {
  CreateRoleInput,
  NormalizedCreateRoleInput,
  NormalizedUpdateRoleInput,
  RoleDto,
  RoleRow,
  UpdateRoleInput
} from "./roles.types.js";

/**
 * Roles protegidos que no pueden eliminarse ni desactivarse.
 */
const PROTECTED_ROLE_KEYS = new Set([
  "ADMINISTRADOR"
]);

/**
 * Indica si el valor recibido es un objeto utilizable.
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
 * Limpia valores de texto recibidos desde HTTP.
 */
function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

/**
 * Normaliza la clave técnica de un rol.
 *
 * Ejemplo:
 * "recursos humanos" se convierte en "RECURSOS_HUMANOS".
 */
function normalizeRoleKey(value: unknown): string {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normaliza permisos y elimina valores duplicados o vacíos.
 */
function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => cleanText(item).toUpperCase())
        .filter(Boolean)
    )
  );
}

/**
 * Convierte una fila interna a la respuesta pública.
 */
function toRoleDto(role: RoleRow): RoleDto {
  return {
    id: Number(role.id),
    roleKey: role.role_key,
    roleName: role.role_name,
    description: role.description,
    isActive: role.is_active,
    permissions: role.permissions
  };
}

/**
 * Confirma que un rol exista.
 */
async function requireRole(id: number): Promise<RoleRow> {
  const role = await findRoleById(id);

  if (!role) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  return role;
}

/**
 * Confirma que el rol no sea un rol protegido.
 */
function ensureRoleIsNotProtected(
  role: RoleRow,
  action: "desactivarse" | "eliminarse"
): void {
  if (PROTECTED_ROLE_KEYS.has(role.role_key.toUpperCase())) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: `El rol Administrador no puede ${action}.`
    });
  }
}

/**
 * Lista todos los roles.
 */
export async function listRoles(): Promise<RoleDto[]> {
  const roles = await findRoles();

  return roles.map(toRoleDto);
}

/**
 * Consulta un rol mediante su ID.
 */
export async function getRole(
  id: number
): Promise<RoleDto | null> {
  const role = await findRoleById(id);

  return role ? toRoleDto(role) : null;
}

/**
 * Crea un rol nuevo.
 */
export async function createRole(
  payload: unknown
): Promise<RoleDto> {
  if (!isRecord(payload)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos de rol inválidos."
    });
  }

  const body = payload as CreateRoleInput;

  const input: NormalizedCreateRoleInput = {
    roleKey: normalizeRoleKey(
      body.roleKey ?? body.role_key
    ),

    roleName: cleanText(
      body.roleName ?? body.role_name
    ),

    description:
      body.description === undefined
        ? null
        : cleanText(body.description) || null,

    permissions: normalizePermissions(body.permissions)
  };

  if (!input.roleKey || !input.roleName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "La clave y el nombre del rol son obligatorios."
    });
  }

  if (input.roleKey.length > 80) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "La clave del rol no puede superar 80 caracteres."
    });
  }

  if (input.roleName.length > 120) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El nombre del rol no puede superar 120 caracteres."
    });
  }

  const duplicated = await findRoleByKey(input.roleKey);

  if (duplicated) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Ya existe un rol con esa clave."
    });
  }

  const created = await insertRole(input);

  return toRoleDto(created);
}

/**
 * Modifica nombre, descripción o permisos de un rol.
 */
export async function updateRole(
  id: number,
  payload: unknown
): Promise<RoleDto> {
  if (!isRecord(payload)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos de rol inválidos."
    });
  }

  const body = payload as UpdateRoleInput;

  const hasRoleName =
    body.roleName !== undefined ||
    body.role_name !== undefined;

  const hasDescription =
    body.description !== undefined;

  const hasPermissions =
    body.permissions !== undefined;

  if (
    !hasRoleName &&
    !hasDescription &&
    !hasPermissions
  ) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "No se recibieron datos para modificar el rol."
    });
  }

  const input: NormalizedUpdateRoleInput = {};

  if (hasRoleName) {
    const roleName = cleanText(
      body.roleName ?? body.role_name
    );

    if (!roleName) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "El nombre del rol no puede estar vacío."
      });
    }

    if (roleName.length > 120) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "El nombre del rol no puede superar 120 caracteres."
      });
    }

    input.roleName = roleName;
  }

  if (hasDescription) {
    input.description =
      cleanText(body.description) || null;
  }

  if (hasPermissions) {
    if (!Array.isArray(body.permissions)) {
      throw new AppError({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "La lista de permisos es inválida."
      });
    }

    input.permissions = normalizePermissions(
      body.permissions
    );
  }

  const updated = await updateRoleById(id, input);

  if (!updated) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  return toRoleDto(updated);
}

/**
 * Desactiva un rol.
 */
export async function deactivateRole(
  id: number
): Promise<RoleDto> {
  const current = await requireRole(id);

  ensureRoleIsNotProtected(
    current,
    "desactivarse"
  );

  const updated = await setRoleActiveById(id, false);

  if (!updated) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  return toRoleDto(updated);
}

/**
 * Activa un rol.
 */
export async function activateRole(
  id: number
): Promise<RoleDto> {
  const updated = await setRoleActiveById(id, true);

  if (!updated) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  return toRoleDto(updated);
}

/**
 * Elimina permanentemente un rol.
 *
 * Reglas:
 * - El rol debe existir.
 * - ADMINISTRADOR no puede eliminarse.
 * - El rol no puede tener usuarios asignados.
 */
export async function deleteRole(
  id: number
): Promise<RoleDto> {
  const current = await requireRole(id);

  ensureRoleIsNotProtected(
    current,
    "eliminarse"
  );

  const assignedUsers = await countUsersByRoleId(id);

  if (assignedUsers > 0) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message:
        `No se puede eliminar el rol porque tiene ` +
        `${assignedUsers} usuario(s) asignado(s).`
    });
  }

  const deleted = await deleteRoleById(id);

  if (!deleted) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  return toRoleDto(deleted);
}