// ======================================================
// PATH: backend\src\modules\login\login.audit.ts
// Bitácora de autenticación del módulo Login
// ======================================================

import { db } from "../../config/db.js";
import type { CreateAuthAuditInput } from "./login.types.js";

/**
 * Registra eventos de autenticación.
 *
 * Se usa para:
 * - login exitoso
 * - login fallido
 * - logout
 * - sesión expirada
 * - sesión revocada por nuevo login
 * - usuario bloqueado
 *
 * Esta función no debe romper el flujo principal si la bitácora falla.
 * Por eso captura su propio error y solo lo registra en consola.
 */
export async function createAuthAudit(
  input: CreateAuthAuditInput
): Promise<void> {
  try {
    await db.query(
      `
      INSERT INTO app_auth_audit (
        username_attempted,
        user_id,
        action,
        success,
        failure_reason,
        ip_address,
        user_agent
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      `,
      [
        input.usernameAttempted ?? null,
        input.userId ?? null,
        input.action,
        input.success,
        input.failureReason ?? null,
        input.ipAddress ?? null,
        input.userAgent ?? null
      ]
    );
  } catch (error) {
    console.error("[AUTH_AUDIT_ERROR]", error);
  }
}

/**
 * Obtiene IP y navegador/equipo desde Express Request.
 *
 * Se mantiene separado para reutilizarlo en:
 * - login
 * - logout
 * - reset de contraseña
 * - bloqueo por intentos fallidos
 */
export function getRequestMeta(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;

  return {
    ipAddress: forwardedIp?.split(",")[0]?.trim() || req.ip || null,
    userAgent:
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : null
  };
}