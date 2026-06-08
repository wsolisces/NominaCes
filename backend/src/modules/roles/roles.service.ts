// ======================================================
// PATH: backend/src/modules/roles/roles.service.ts
// Servicio del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Aplicar reglas de negocio de roles.
 * - Proteger SOPORTE.
 * - Validar creación, edición, activación e inactivación.
 * - Coordinar cambios de permisos y auditoría.
 *
 * No debe:
 * - Recibir Request/Response directamente.
 * - Renderizar mensajes visuales.
 * - Duplicar consultas SQL del repositorio.
 */

import type {
  ChangeRoleStatusInput,
  CreateRoleInput,
  RoleAuditRow,
  RoleDetail,
  RoleListFilters,
  RoleRow,
  UpdateRoleInput,
} from "./roles.types.js";

import {
  createRole,
  findRoleAudit,
  findRoleById,
  findRoleDetail,
  findRoles,
  inactivateUsersByRole,
  insertRoleAudit,
  replaceRolePermissions,
  roleKeyExists,
  roleNameExists,
  setRoleActive,
  updateRoleData,
  withTransaction,
} from "./roles.repository.js";

type ServiceError = Error & {
  statusCode?: number;
};

/**
 * Crea errores con código HTTP.
 */
function createServiceError(message: string, statusCode = 400): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

/**
 * Normaliza el nombre visible de un rol.
 */
function normalizeRoleName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Genera clave técnica estable a partir del nombre.
 */
function generateRoleKey(roleName: string): string {
  return normalizeRoleName(roleName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normaliza lista de permisos.
 */
function normalizePermissionKeys(permissionKeys?: string[]): string[] {
  if (!permissionKeys?.length) return [];

  return Array.from(
    new Set(
      permissionKeys
        .map((permissionKey) => permissionKey.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

/**
 * Valida si un rol puede editarse.
 */
function assertEditableRole(role: RoleRow): void {
  if (role.is_protected || role.role_key === "SOPORTE") {
    throw createServiceError(
      "El rol SOPORTE está protegido y no se puede modificar.",
      403
    );
  }

  if (!role.is_active) {
    throw createServiceError(
      "Primero debes reactivar el rol para modificarlo.",
      409
    );
  }
}

/**
 * Lista roles.
 */
export async function listRolesService(
  filters: RoleListFilters
): Promise<RoleRow[]> {
  return findRoles(filters);
}

/**
 * Obtiene detalle completo de rol.
 */
export async function getRoleDetailService(roleId: string): Promise<RoleDetail> {
  const role = await findRoleDetail(roleId);

  if (!role) {
    throw createServiceError("Rol no encontrado.", 404);
  }

  return role;
}

/**
 * Crea un rol normal.
 */
export async function createRoleService(
  input: CreateRoleInput,
  actorUserId: string | null
): Promise<RoleRow> {
  const roleName = normalizeRoleName(input.role_name ?? "");
  const roleKey = generateRoleKey(roleName);
  const description = input.description?.trim() || null;
  const permissionKeys = normalizePermissionKeys(input.permission_keys);

  if (!roleName) {
    throw createServiceError("El nombre del rol es obligatorio.");
  }

  if (!roleKey) {
    throw createServiceError("No fue posible generar la clave del rol.");
  }

  if (roleKey === "SOPORTE") {
    throw createServiceError(
      "No se puede crear el rol SOPORTE desde pantalla.",
      403
    );
  }

  return withTransaction(async (client) => {
    const existsByName = await roleNameExists(roleName, undefined, client);
    const existsByKey = await roleKeyExists(roleKey, undefined, client);

    if (existsByName || existsByKey) {
      throw createServiceError(
        "Ya existe un rol con ese nombre o clave, incluso si está inactivo.",
        409
      );
    }

    const role = await createRole(
      {
        role_key: roleKey,
        role_name: roleName,
        description,
      },
      client
    );

    await replaceRolePermissions(role.id, permissionKeys, actorUserId, client);

    await insertRoleAudit(
      {
        roleId: role.id,
        action: "ROL_CREADO",
        oldData: null,
        newData: {
          role,
          permission_keys: permissionKeys,
        },
        changedByUserId: actorUserId,
      },
      client
    );

    return role;
  });
}

/**
 * Edita datos y permisos de un rol activo.
 */
export async function updateRoleService(
  roleId: string,
  input: UpdateRoleInput,
  actorUserId: string | null
): Promise<RoleRow> {
  const roleName = normalizeRoleName(input.role_name ?? "");
  const description = input.description?.trim() || null;
  const permissionKeys = normalizePermissionKeys(input.permission_keys);

  if (!roleName) {
    throw createServiceError("El nombre del rol es obligatorio.");
  }

  return withTransaction(async (client) => {
    const currentRole = await findRoleById(roleId, client);

    if (!currentRole) {
      throw createServiceError("Rol no encontrado.", 404);
    }

    assertEditableRole(currentRole);

    const existsByName = await roleNameExists(roleName, roleId, client);

    if (existsByName) {
      throw createServiceError(
        "Ya existe un rol con ese nombre, incluso si está inactivo.",
        409
      );
    }

    const role = await updateRoleData(
      roleId,
      {
        role_name: roleName,
        description,
      },
      client
    );

    await replaceRolePermissions(roleId, permissionKeys, actorUserId, client);

    await insertRoleAudit(
      {
        roleId,
        action: "ROL_MODIFICADO",
        oldData: currentRole,
        newData: {
          role,
          permission_keys: permissionKeys,
        },
        changedByUserId: actorUserId,
      },
      client
    );

    return role;
  });
}

/**
 * Cambia estado de un rol.
 */
export async function changeRoleStatusService(
  roleId: string,
  input: ChangeRoleStatusInput,
  actorUserId: string | null
): Promise<RoleRow> {
  return withTransaction(async (client) => {
    const currentRole = await findRoleById(roleId, client);

    if (!currentRole) {
      throw createServiceError("Rol no encontrado.", 404);
    }

    if (currentRole.is_protected || currentRole.role_key === "SOPORTE") {
      throw createServiceError(
        "El rol SOPORTE está protegido y no se puede inactivar.",
        403
      );
    }

    if (currentRole.is_active === input.is_active) {
      return currentRole;
    }

    if (!input.is_active && !input.reason?.trim()) {
      throw createServiceError("El motivo para inactivar el rol es obligatorio.");
    }

    const updatedRole = await setRoleActive(roleId, input.is_active, client);

    let affectedUsers = 0;

    if (!input.is_active) {
      affectedUsers = await inactivateUsersByRole(
        {
          roleId,
          reason: input.reason!.trim(),
          actorUserId,
        },
        client
      );
    }

    await insertRoleAudit(
      {
        roleId,
        action: input.is_active ? "ROL_REACTIVADO" : "ROL_INACTIVADO",
        oldData: currentRole,
        newData: {
          ...updatedRole,
          affected_users: affectedUsers,
        },
        changedByUserId: actorUserId,
        reason: input.is_active ? null : input.reason!.trim(),
      },
      client
    );

    return updatedRole;
  });
}

/**
 * Consulta auditoría de rol.
 */
export async function getRoleAuditService(
  roleId: string
): Promise<RoleAuditRow[]> {
  const role = await findRoleById(roleId);

  if (!role) {
    throw createServiceError("Rol no encontrado.", 404);
  }

  return findRoleAudit(roleId);
}