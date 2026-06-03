// ======================================================
// PATH: backend/src/modules/roles/roles.service.ts
// Módulo: Roles
// Archivo: Service
// ======================================================

import { AppError } from "../../shared/errors/AppError.js";
import type {
  CreateRoleInput,
  RoleDto,
  RoleRow,
  UpdateRoleInput,
} from "./roles.types.js";
import {
  findRoleById,
  findRoleByKey,
  findRoles,
  insertRole,
  setRoleActiveById,
  updateRoleById,
} from "./roles.repository.js";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeRoleKey(value: unknown): string {
  return cleanText(value).toUpperCase().replace(/\s+/g, "_");
}

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

function toRoleDto(role: RoleRow): RoleDto {
  return {
    id: Number(role.id),
    roleKey: role.role_key,
    roleName: role.role_name,
    description: role.description,
    isActive: role.is_active,
    permissions: role.permissions,
  };
}

export async function listRoles(): Promise<RoleDto[]> {
  const roles = await findRoles();
  return roles.map(toRoleDto);
}

export async function getRole(id: number): Promise<RoleDto | null> {
  const role = await findRoleById(id);
  return role ? toRoleDto(role) : null;
}

export async function createRole(payload: unknown): Promise<RoleDto> {
  const body = payload as CreateRoleInput;

  const roleKey = normalizeRoleKey(body.roleKey ?? body.role_key);
  const roleName = cleanText(body.roleName ?? body.role_name);
  const description =
    body.description === undefined ? null : cleanText(body.description) || null;
  const permissions = normalizePermissions(body.permissions);

  if (!roleKey || !roleName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos de rol inválidos",
    });
  }

  const duplicated = await findRoleByKey(roleKey);

  if (duplicated) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "El rol ya existe",
    });
  }

  const created = await insertRole({
    roleKey,
    role_key: roleKey,
    roleName,
    role_name: roleName,
    description,
    permissions,
  });

  return toRoleDto(created);
}

export async function updateRole(
  id: number,
  payload: unknown
): Promise<RoleDto> {
  const body = payload as UpdateRoleInput;

  const roleName =
    body.roleName !== undefined || body.role_name !== undefined
      ? cleanText(body.roleName ?? body.role_name)
      : undefined;

  const description =
    body.description !== undefined
      ? cleanText(body.description) || null
      : undefined;

  const permissions =
    body.permissions !== undefined
      ? normalizePermissions(body.permissions)
      : undefined;

  if (roleName !== undefined && !roleName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos de rol inválidos",
    });
  }

  const updated = await updateRoleById(id, {
    roleName,
    role_name: roleName,
    description,
    permissions,
  });

  if (!updated) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado",
    });
  }

  return toRoleDto(updated);
}

export async function deactivateRole(id: number): Promise<RoleDto> {
  const role = await setRoleActiveById(id, false);

  if (!role) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado",
    });
  }

  return toRoleDto(role);
}

export async function activateRole(id: number): Promise<RoleDto> {
  const role = await setRoleActiveById(id, true);

  if (!role) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado",
    });
  }

  return toRoleDto(role);
}