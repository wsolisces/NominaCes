// ======================================================
// PATH: backend/src/modules/users/users.service.ts
// Servicio de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Aplicar reglas de negocio del catálogo de usuarios.
 * - Normalizar username, nombre completo y rol.
 * - Validar duplicados antes de crear o modificar.
 * - Generar contraseña temporal cuando sea necesario.
 *
 * No debe:
 * - Acceder directamente a req/res.
 * - Crear conexiones directas a PostgreSQL.
 * - Definir rutas HTTP.
 */

import bcrypt from "bcryptjs";

import {
  createUser,
  deleteUserById,
  findActiveRoleById,
  findUserById,
  findUserByUsernameNormalized,
  findUsers,
  lockUserById,
  resetUserPasswordById,
  setUserActiveState,
  unlockUserById,
  updateUser
} from "./users.repository.js";

import {
  UserDomainError,
  type CreateUserInput,
  type RoleId,
  type UpdateUserInput,
  type UserDto,
  type UserId,
  type UserListFilters,
  type UserMutationResult,
  type ResetUserPasswordResult
} from "./users.types.js";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_ROUNDS = 12;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeUsername(value: unknown): string {
  return normalizeText(value);
}

function normalizeUsernameForLookup(value: unknown): string {
  return normalizeUsername(value).toLowerCase();
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizeId(value: unknown): UserId {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new UserDomainError(
      "El id del usuario no es válido.",
      400,
      "USER_ID_INVALID"
    );
  }

  return id;
}

function normalizeRoleId(value: unknown): RoleId | null {
  if (value === null || value === undefined || value === "") return null;

  const roleId = Number(value);

  if (!Number.isInteger(roleId) || roleId <= 0) {
    throw new UserDomainError(
      "El rol seleccionado no es válido.",
      400,
      "ROLE_ID_INVALID"
    );
  }

  return roleId;
}

function assertUsername(username: string): void {
  if (!username) {
    throw new UserDomainError(
      "El usuario es obligatorio.",
      400,
      "USERNAME_REQUIRED"
    );
  }

  if (username.length < 3) {
    throw new UserDomainError(
      "El usuario debe tener al menos 3 caracteres.",
      400,
      "USERNAME_TOO_SHORT"
    );
  }

  if (username.length > 80) {
    throw new UserDomainError(
      "El usuario no puede exceder 80 caracteres.",
      400,
      "USERNAME_TOO_LONG"
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new UserDomainError(
      "El usuario solo puede contener letras, números, punto, guion y guion bajo.",
      400,
      "USERNAME_INVALID"
    );
  }
}

function assertFullName(fullName: string): void {
  if (!fullName) {
    throw new UserDomainError(
      "El nombre completo es obligatorio.",
      400,
      "FULL_NAME_REQUIRED"
    );
  }

  if (fullName.length > 150) {
    throw new UserDomainError(
      "El nombre completo no puede exceder 150 caracteres.",
      400,
      "FULL_NAME_TOO_LONG"
    );
  }
}

function assertPassword(password: string): void {
  if (!password) {
    throw new UserDomainError(
      "La contraseña es obligatoria.",
      400,
      "PASSWORD_REQUIRED"
    );
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new UserDomainError(
      "La contraseña debe tener al menos 8 caracteres.",
      400,
      "PASSWORD_TOO_SHORT"
    );
  }
}

function generateTemporaryPassword(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `Nomina${suffix}${random}!`;
}

async function assertRoleExistsIfProvided(roleId: RoleId | null): Promise<void> {
  if (!roleId) return;

  const role = await findActiveRoleById(roleId);

  if (!role) {
    throw new UserDomainError(
      "El rol seleccionado no existe o está inactivo.",
      400,
      "ROLE_NOT_FOUND"
    );
  }
}

/**
 * Obtiene usuarios con filtros normalizados.
 */
export async function listUsersService(
  filters: UserListFilters
): Promise<UserDto[]> {
  return findUsers({
    search: normalizeNullableText(filters.search) ?? undefined,
    role_id:
      filters.role_id !== undefined && filters.role_id !== null
        ? normalizeRoleId(filters.role_id) ?? undefined
        : undefined,
    is_active: filters.is_active,
    is_locked: filters.is_locked
  });
}

/**
 * Obtiene un usuario por id.
 */
export async function getUserByIdService(rawId: unknown): Promise<UserDto> {
  const id = normalizeId(rawId);
  const user = await findUserById(id);

  if (!user) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return user;
}

/**
 * Crea un usuario validando username, rol y contraseña.
 */
export async function createUserService(
  input: CreateUserInput
): Promise<UserMutationResult> {
  const username = normalizeUsername(input.username);
  const usernameNormalized = normalizeUsernameForLookup(input.username);
  const fullName = normalizeText(input.full_name);
  const roleId = normalizeRoleId(input.role_id);
  const password = normalizeText(input.password);
  const isActive = normalizeBoolean(input.is_active, true);

  assertUsername(username);
  assertFullName(fullName);
  assertPassword(password);
  await assertRoleExistsIfProvided(roleId);

  const existing = await findUserByUsernameNormalized(usernameNormalized);

  if (existing) {
    throw new UserDomainError(
      "Ya existe un usuario con ese nombre de acceso.",
      409,
      "USERNAME_DUPLICATED"
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await createUser({
    username,
    username_normalized: usernameNormalized,
    full_name: fullName,
    role_id: roleId,
    password,
    password_hash: passwordHash,
    password_reset_required: true,
    is_active: isActive
  });

  return { user };
}

/**
 * Actualiza un usuario existente.
 */
export async function updateUserService(
  rawId: unknown,
  input: UpdateUserInput
): Promise<UserMutationResult> {
  const id = normalizeId(rawId);

  const current = await findUserById(id);

  if (!current) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const username =
    input.username !== undefined
      ? normalizeUsername(input.username)
      : current.username;

  const usernameNormalized =
    input.username !== undefined
      ? normalizeUsernameForLookup(input.username)
      : current.username_normalized;

  const fullName =
    input.full_name !== undefined
      ? normalizeText(input.full_name)
      : current.full_name;

  const roleId =
    input.role_id !== undefined
      ? normalizeRoleId(input.role_id)
      : current.role_id;

  const isActive =
    input.is_active !== undefined
      ? normalizeBoolean(input.is_active, current.is_active)
      : current.is_active;

  assertUsername(username);
  assertFullName(fullName);
  await assertRoleExistsIfProvided(roleId);

  if (usernameNormalized !== current.username_normalized) {
    const duplicated = await findUserByUsernameNormalized(usernameNormalized);

    if (duplicated && duplicated.id !== id) {
      throw new UserDomainError(
        "Ya existe otro usuario con ese nombre de acceso.",
        409,
        "USERNAME_DUPLICATED"
      );
    }
  }

  const user = await updateUser(id, {
    username,
    username_normalized: usernameNormalized,
    full_name: fullName,
    role_id: roleId,
    is_active: isActive
  });

  if (!user) {
    throw new UserDomainError(
      "No fue posible actualizar el usuario.",
      500,
      "USER_UPDATE_FAILED"
    );
  }

  return { user };
}

/**
 * Activa un usuario.
 */
export async function activateUserService(
  rawId: unknown
): Promise<UserMutationResult> {
  const id = normalizeId(rawId);
  const user = await setUserActiveState(id, true);

  if (!user) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return { user };
}

/**
 * Desactiva un usuario.
 */
export async function deactivateUserService(
  rawId: unknown
): Promise<UserMutationResult> {
  const id = normalizeId(rawId);
  const user = await setUserActiveState(id, false);

  if (!user) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return { user };
}

/**
 * Bloquea manualmente un usuario.
 */
export async function lockUserService(
  rawId: unknown,
  reasonInput?: unknown
): Promise<UserMutationResult> {
  const id = normalizeId(rawId);
  const reason =
    normalizeNullableText(reasonInput) ?? "Bloqueado manualmente por administrador.";

  const user = await lockUserById(id, reason);

  if (!user) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return { user };
}

/**
 * Desbloquea un usuario.
 */
export async function unlockUserService(
  rawId: unknown
): Promise<UserMutationResult> {
  const id = normalizeId(rawId);
  const user = await unlockUserById(id);

  if (!user) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  return { user };
}

/**
 * Restablece contraseña con contraseña temporal.
 */
export async function resetUserPasswordService(
  rawId: unknown
): Promise<ResetUserPasswordResult> {
  const id = normalizeId(rawId);

  const current = await findUserById(id);

  if (!current) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const user = await resetUserPasswordById(id, passwordHash);

  if (!user) {
    throw new UserDomainError(
      "No fue posible restablecer la contraseña.",
      500,
      "USER_PASSWORD_RESET_FAILED"
    );
  }

  return {
    user,
    temporaryPassword
  };
}

/**
 * Elimina un usuario por id.
 */
export async function deleteUserService(rawId: unknown): Promise<void> {
  const id = normalizeId(rawId);
  const deleted = await deleteUserById(id);

  if (!deleted) {
    throw new UserDomainError(
      "No se encontró el usuario solicitado.",
      404,
      "USER_NOT_FOUND"
    );
  }
}