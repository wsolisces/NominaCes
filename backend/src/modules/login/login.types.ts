// ======================================================
// PATH: backend/src/modules/login/login.types.ts
// Tipos centrales del módulo Login
// ======================================================

import type { AppPermission } from "./login.permissions.js";

export type AuthAuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED_BY_NEW_LOGIN"
  | "USER_LOCKED"
  | "PASSWORD_RESET";

export type SessionRevokedReason =
  | "LOGOUT"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED_BY_NEW_LOGIN"
  | "USER_LOCKED"
  | "PASSWORD_RESET";

export type LoginUserRecord = {
  id: string;
  username: string;
  username_normalized: string;
  password_hash: string;
  full_name: string;

  role_id: string;
  role_key: string;
  role_name: string;
  role_is_active: boolean;

  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  password_reset_required: boolean;
};

export type PasswordResetUserRecord = {
  id: string;
  username: string;
  username_normalized: string;
  full_name: string;

  role_id: string;
  role_key: string;
  role_name: string;
  role_is_active: boolean;

  is_active: boolean;
  is_locked: boolean;
  password_reset_required: boolean;
  password_reset_code_hash: string | null;
  password_reset_expires_at: Date | null;
};

export type AuthenticatedUser = {
  id: string;
  user_id: string;

  username: string;

  full_name: string;
  fullName: string;

  role_id: string;
  role_key: string;
  role_name: string;

  permissions: AppPermission[];
};

export type SessionRecord = {
  id: string;
  user_id: string;
  session_token_hash: string;
  fortia_token_encrypted: string;
  expires_at: Date;
  revoked_at: Date | null;
};

export type LoginResult = {
  user: AuthenticatedUser;
  expiresAt: string;
};

export type CreateAuthAuditInput = {
  usernameAttempted?: string | null;
  userId?: string | null;
  action: AuthAuditAction;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type RequestMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type FortiaAuthResult = {
  token: string;
};