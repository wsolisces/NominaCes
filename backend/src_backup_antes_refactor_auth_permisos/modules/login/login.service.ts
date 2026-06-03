// ======================================================
// PATH: backend/src/modules/login/login.service.ts
// Lógica de negocio del módulo Login
// ======================================================

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  decryptText,
  encryptText,
  generateSecureToken,
  sha256Hash,
} from "../../shared/security/crypto.js";

import {
  hashPassword,
  normalizeUsername,
  validatePasswordStrength,
  verifyPassword,
} from "../../shared/security/password.js";

import { createAuthAudit } from "./login.audit.js";
import { authenticateFortia } from "../../fortia/fortia.client.js";

import type {
  AuthenticatedUser,
  LoginResult,
  RequestMeta,
  SessionRecord,
} from "./login.types.js";

import {
  completePasswordReset,
  createPasswordResetAudit,
  createSession,
  findActiveSessionByTokenHash,
  findLoginUserById,
  findLoginUserByUsernameNormalized,
  findUserForPasswordReset,
  getPermissionsByRoleId,
  registerFailedLoginAttempt,
  resetFailedLoginAttempts,
  revokeActiveSessionsByUserId,
  revokeSessionById,
  touchSession,
} from "./login.repository.js";

function buildAuthenticatedUser(input: {
  id: string;
  username: string;
  fullName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  permissions: AuthenticatedUser["permissions"];
}): AuthenticatedUser {
  return {
    id: input.id,
    user_id: input.id,

    username: input.username,

    full_name: input.fullName,
    fullName: input.fullName,

    role_id: input.roleId,
    role_key: input.roleKey,
    role_name: input.roleName,

    permissions: input.permissions,
  };
}

function buildSessionExpiration(): Date {
  return new Date(Date.now() + env.SESSION_TTL_MINUTES * 60 * 1000);
}

export async function login(input: {
  username: string;
  password: string;
  meta: RequestMeta;
}): Promise<LoginResult & { sessionToken: string }> {
  const usernameNormalized = normalizeUsername(input.username);
  const user = await findLoginUserByUsernameNormalized(usernameNormalized);

  if (!user) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: null,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "USER_NOT_FOUND",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Usuario o contraseña incorrectos.",
    });
  }

  if (!user.role_is_active) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "ROLE_INACTIVE",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "El rol del usuario está inactivo.",
    });
  }

  if (!user.is_active) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "USER_INACTIVE",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "El usuario está inactivo.",
    });
  }

  if (user.is_locked) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "USER_LOCKED",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "El usuario está bloqueado. Solicita desbloqueo al administrador.",
    });
  }

  if (user.password_reset_required) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "PASSWORD_RESET_REQUIRED",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Debes crear una nueva contraseña antes de iniciar sesión.",
      details: {
        passwordResetRequired: true,
      },
    });
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    user.password_hash
  );

  if (!isPasswordValid) {
    const failedResult = await registerFailedLoginAttempt(user.id);

    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: failedResult.isLocked
        ? "FAILED_LOGIN_ATTEMPTS_USER_LOCKED"
        : "INVALID_PASSWORD",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    if (failedResult.isLocked) {
      await revokeActiveSessionsByUserId(user.id, "USER_LOCKED");

      await createAuthAudit({
        usernameAttempted: input.username,
        userId: user.id,
        action: "USER_LOCKED",
        success: true,
        failureReason: "FAILED_LOGIN_ATTEMPTS",
        ipAddress: input.meta.ipAddress,
        userAgent: input.meta.userAgent,
      });

      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message:
          "El usuario fue bloqueado por 3 intentos fallidos. Solicita desbloqueo al administrador.",
      });
    }

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Usuario o contraseña incorrectos.",
    });
  }

  const fortiaAuth = await authenticateFortia();
  const fortiaTokenEncrypted = encryptText(fortiaAuth.token);

  await resetFailedLoginAttempts(user.id);

  const revokedCount = await revokeActiveSessionsByUserId(
    user.id,
    "SESSION_REVOKED_BY_NEW_LOGIN"
  );

  if (revokedCount > 0) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "SESSION_REVOKED_BY_NEW_LOGIN",
      success: true,
      failureReason: null,
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });
  }

  const sessionToken = generateSecureToken();
  const sessionTokenHash = sha256Hash(sessionToken);
  const expiresAt = buildSessionExpiration();

  await createSession({
    userId: user.id,
    sessionTokenHash,
    fortiaTokenEncrypted,
    expiresAt,
    ipAddress: input.meta.ipAddress,
    userAgent: input.meta.userAgent,
  });

  const permissions = await getPermissionsByRoleId(user.role_id);

  const authenticatedUser = buildAuthenticatedUser({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    roleId: user.role_id,
    roleKey: user.role_key,
    roleName: user.role_name,
    permissions,
  });

  await createAuthAudit({
    usernameAttempted: input.username,
    userId: user.id,
    action: "LOGIN_SUCCESS",
    success: true,
    failureReason: null,
    ipAddress: input.meta.ipAddress,
    userAgent: input.meta.userAgent,
  });

  return {
    user: authenticatedUser,
    expiresAt: expiresAt.toISOString(),
    sessionToken,
  };
}

export async function validateSession(sessionToken: string): Promise<{
  session: SessionRecord;
  user: AuthenticatedUser;
  fortiaToken: string;
}> {
  const sessionTokenHash = sha256Hash(sessionToken);
  const session = await findActiveSessionByTokenHash(sessionTokenHash);

  if (!session) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Sesión inválida o expirada.",
    });
  }

  if (session.expires_at.getTime() <= Date.now()) {
    await revokeSessionById(session.id, "SESSION_EXPIRED");

    await createAuthAudit({
      usernameAttempted: null,
      userId: session.user_id,
      action: "SESSION_EXPIRED",
      success: true,
      failureReason: null,
    });

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Tu sesión expiró. Inicia sesión nuevamente.",
    });
  }

  const user = await findLoginUserById(session.user_id);

  if (!user) {
    await revokeSessionById(session.id, "LOGOUT");

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Usuario de sesión no encontrado.",
    });
  }

  if (!user.role_is_active) {
    await revokeSessionById(session.id, "LOGOUT");

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "El rol del usuario ya no es válido.",
    });
  }

  if (!user.is_active || user.is_locked) {
    await revokeSessionById(
      session.id,
      user.is_locked ? "USER_LOCKED" : "LOGOUT"
    );

    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "La sesión ya no es válida.",
    });
  }

  await touchSession(session.id);

  const permissions = await getPermissionsByRoleId(user.role_id);

  const authenticatedUser = buildAuthenticatedUser({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    roleId: user.role_id,
    roleKey: user.role_key,
    roleName: user.role_name,
    permissions,
  });

  return {
    session,
    user: authenticatedUser,
    fortiaToken: decryptText(session.fortia_token_encrypted),
  };
}

export async function logout(input: {
  sessionToken: string;
  meta: RequestMeta;
}): Promise<void> {
  const sessionTokenHash = sha256Hash(input.sessionToken);
  const session = await findActiveSessionByTokenHash(sessionTokenHash);

  if (!session) {
    return;
  }

  await revokeSessionById(session.id, "LOGOUT");

  await createAuthAudit({
    usernameAttempted: null,
    userId: session.user_id,
    action: "LOGOUT",
    success: true,
    failureReason: null,
    ipAddress: input.meta.ipAddress,
    userAgent: input.meta.userAgent,
  });
}

export async function createPasswordWithTempCode(input: {
  username: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
  meta: RequestMeta;
}): Promise<{
  username: string;
  passwordChanged: boolean;
}> {
  const usernameNormalized = normalizeUsername(input.username);
  const user = await findUserForPasswordReset(usernameNormalized);

  if (!user) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: null,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "RESET_USER_NOT_FOUND",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Usuario no encontrado.",
    });
  }

  if (!user.role_is_active) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "ROLE_INACTIVE",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "El rol del usuario está inactivo.",
    });
  }

  if (!user.is_active) {
    await createAuthAudit({
      usernameAttempted: input.username,
      userId: user.id,
      action: "LOGIN_FAILED",
      success: false,
      failureReason: "RESET_USER_INACTIVE",
      ipAddress: input.meta.ipAddress,
      userAgent: input.meta.userAgent,
    });

    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "El usuario está inactivo.",
    });
  }

  if (!user.password_reset_required) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "El usuario no tiene restablecimiento de contraseña pendiente.",
    });
  }

  if (!user.password_reset_code_hash || !user.password_reset_expires_at) {
    throw new AppError({
      statusCode: 409,
      code: "CONFLICT",
      message: "El usuario no tiene código temporal vigente.",
    });
  }

  if (user.password_reset_expires_at.getTime() <= Date.now()) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "El código temporal expiró. Solicita uno nuevo al administrador.",
    });
  }

  const cleanCode = input.code.trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El código temporal debe tener 6 dígitos.",
    });
  }

  const codeHash = sha256Hash(cleanCode);

  if (codeHash !== user.password_reset_code_hash) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "El código temporal es incorrecto.",
    });
  }

  if (input.newPassword !== input.confirmPassword) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "La confirmación de contraseña no coincide.",
    });
  }

  const passwordErrors = validatePasswordStrength(input.newPassword);

  if (passwordErrors.length > 0) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "La contraseña no cumple las reglas de seguridad.",
      details: passwordErrors,
    });
  }

  const passwordHash = await hashPassword(input.newPassword);

  await completePasswordReset({
    userId: user.id,
    passwordHash,
  });

  await revokeActiveSessionsByUserId(user.id, "PASSWORD_RESET");

  await createPasswordResetAudit({
    userId: user.id,
    username: user.username,
  });

  await createAuthAudit({
    usernameAttempted: input.username,
    userId: user.id,
    action: "PASSWORD_RESET",
    success: true,
    failureReason: null,
    ipAddress: input.meta.ipAddress,
    userAgent: input.meta.userAgent,
  });

  return {
    username: user.username,
    passwordChanged: true,
  };
}