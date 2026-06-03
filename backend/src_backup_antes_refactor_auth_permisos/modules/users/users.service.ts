// ======================================================
// PATH: backend\src\modules\users\users.service.ts
// Lógica de negocio del módulo Users
// ======================================================

import { AppError } from "../../shared/errors/AppError.js";
import {
  generateSixDigitCode,
  sha256Hash
} from "../../shared/security/crypto.js";
import { normalizeUsername } from "../../shared/security/password.js";

import { revokeActiveSessionsByUserId } from "../login/login.repository.js";

import type {
  CreateUserInput,
  UpdateUserInput,
  UserActionResult,
  UserListRow,
  UserTemporaryCodeResult
} from "./users.types.js";

import {
  activateUser,
  createUser,
  createUserAudit,
  deactivateUser,
  findUserById,
  findUserByUsernameNormalized,
  listUsers,
  roleExistsActive,
  setPasswordResetCode,
  unlockUser,
  updateUser
} from "./users.repository.js";

/**
 * Vigencia del código temporal de contraseña.
 *
 * Regla definida:
 * - código de 6 dígitos
 * - válido por 5 minutos
 */
const TEMP_CODE_TTL_MINUTES = 5;

/**
 * Genera código temporal y su fecha de expiración.
 *
 * El código real se devuelve una sola vez al administrador.
 * En BD se guarda únicamente el hash.
 */
function buildTemporaryCode(): {
  temporaryCode: string;
  temporaryCodeHash: string;
  temporaryCodeExpiresAt: Date;
} {
  const temporaryCode = generateSixDigitCode();

  return {
    temporaryCode,
    temporaryCodeHash: sha256Hash(temporaryCode),
    temporaryCodeExpiresAt: new Date(
      Date.now() + TEMP_CODE_TTL_MINUTES * 60 * 1000
    )
  };
}

/**
 * Lista usuarios para mantenimiento.
 */
export async function getUsers(): Promise<UserListRow[]> {
  return listUsers();
}

/**
 * Crea un usuario nuevo.
 *
 * Reglas:
 * - username único, sin distinguir mayúsculas/minúsculas
 * - rol debe existir y estar activo
 * - usuario nace activo
 * - usuario nace desbloqueado
 * - usuario nace con password_reset_required = true
 * - se genera código temporal de 6 dígitos
 * - el código se muestra una sola vez
 */
export async function createNewUser(
  input: CreateUserInput
): Promise<UserTemporaryCodeResult> {
  const username = input.username.trim();
  const usernameNormalized = normalizeUsername(username);
  const fullName = input.fullName.trim();

  if (!username) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El usuario es obligatorio."
    });
  }

  if (!fullName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El nombre completo es obligatorio."
    });
  }

  const existingUser = await findUserByUsernameNormalized(usernameNormalized);

  if (existingUser) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "Ya existe un usuario con ese username."
    });
  }

  const roleIsValid = await roleExistsActive(input.roleId);

  if (!roleIsValid) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El rol seleccionado no existe o está inactivo."
    });
  }

  const temp = buildTemporaryCode();

  const user = await createUser({
    username,
    usernameNormalized,
    fullName,
    roleId: input.roleId,
    temporaryCodeHash: temp.temporaryCodeHash,
    temporaryCodeExpiresAt: temp.temporaryCodeExpiresAt
  });

  await createUserAudit({
    userId: user.id,
    action: "CREATE",
    oldData: null,
    newData: {
      username: user.username,
      full_name: user.full_name,
      role_id: user.role_id,
      role_key: user.role_key,
      is_active: user.is_active,
      is_locked: user.is_locked,
      password_reset_required: user.password_reset_required,
      password_reset_expires_at: user.password_reset_expires_at
    },
    changedByUserId: input.changedByUserId
  });

  return {
    user,
    temporaryCode: temp.temporaryCode,
    expiresAt: temp.temporaryCodeExpiresAt.toISOString()
  };
}

/**
 * Edita datos principales del usuario.
 *
 * Reglas:
 * - no cambia username
 * - no cambia contraseña
 * - permite cambiar nombre y rol
 */
export async function editUser(
  input: UpdateUserInput
): Promise<UserActionResult> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado."
    });
  }

  const fullName = input.fullName.trim();

  if (!fullName) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El nombre completo es obligatorio."
    });
  }

  const roleIsValid = await roleExistsActive(input.roleId);

  if (!roleIsValid) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El rol seleccionado no existe o está inactivo."
    });
  }

  const updatedUser = await updateUser({
    userId: input.userId,
    fullName,
    roleId: input.roleId
  });

  await createUserAudit({
    userId: updatedUser.id,
    action: "UPDATE",
    oldData: currentUser,
    newData: updatedUser,
    changedByUserId: input.changedByUserId
  });

  return {
    user: updatedUser
  };
}

/**
 * Activa un usuario.
 */
export async function activateUserById(input: {
  userId: string;
  changedByUserId: string;
}): Promise<UserActionResult> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado."
    });
  }

  const updatedUser = await activateUser(input.userId);

  await createUserAudit({
    userId: updatedUser.id,
    action: "ACTIVATE",
    oldData: currentUser,
    newData: updatedUser,
    changedByUserId: input.changedByUserId
  });

  return {
    user: updatedUser
  };
}

/**
 * Desactiva un usuario.
 *
 * Al desactivar:
 * - revoca sesiones activas
 */
export async function deactivateUserById(input: {
  userId: string;
  changedByUserId: string;
}): Promise<UserActionResult> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado."
    });
  }

  const updatedUser = await deactivateUser(input.userId);

  await revokeActiveSessionsByUserId(input.userId, "LOGOUT");

  await createUserAudit({
    userId: updatedUser.id,
    action: "DEACTIVATE",
    oldData: currentUser,
    newData: updatedUser,
    changedByUserId: input.changedByUserId
  });

  return {
    user: updatedUser
  };
}

/**
 * Desbloquea un usuario.
 *
 * Reglas:
 * - limpia is_locked
 * - reinicia failed_login_attempts
 * - limpia locked_at y locked_reason
 */
export async function unlockUserById(input: {
  userId: string;
  changedByUserId: string;
}): Promise<UserActionResult> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado."
    });
  }

  const updatedUser = await unlockUser(input.userId);

  await createUserAudit({
    userId: updatedUser.id,
    action: "UNLOCK",
    oldData: currentUser,
    newData: updatedUser,
    changedByUserId: input.changedByUserId
  });

  return {
    user: updatedUser
  };
}

/**
 * Resetea contraseña de un usuario.
 *
 * Reglas:
 * - genera nuevo código temporal
 * - marca password_reset_required = true
 * - revoca sesiones activas
 * - devuelve código temporal una sola vez
 */
export async function resetUserPassword(input: {
  userId: string;
  changedByUserId: string;
}): Promise<UserTemporaryCodeResult> {
  const currentUser = await findUserById(input.userId);

  if (!currentUser) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado."
    });
  }

  const temp = buildTemporaryCode();

  const updatedUser = await setPasswordResetCode({
    userId: input.userId,
    temporaryCodeHash: temp.temporaryCodeHash,
    temporaryCodeExpiresAt: temp.temporaryCodeExpiresAt
  });

  await revokeActiveSessionsByUserId(input.userId, "PASSWORD_RESET");

  await createUserAudit({
    userId: updatedUser.id,
    action: "RESET_PASSWORD",
    oldData: currentUser,
    newData: {
      ...updatedUser,
      temporaryCodeShownOnce: true
    },
    changedByUserId: input.changedByUserId
  });

  return {
    user: updatedUser,
    temporaryCode: temp.temporaryCode,
    expiresAt: temp.temporaryCodeExpiresAt.toISOString()
  };
}