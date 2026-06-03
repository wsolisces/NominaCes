// ======================================================
// PATH: backend/src/modules/login/auth.audit.ts
// Bitácora de autenticación
// ======================================================

import { db } from "../../config/db.js";
import type { CreateAuthAuditInput } from "./login.types.js";

/**
 * Registra eventos de autenticación en app_auth_audit.
 *
 * Responsabilidades:
 * - Guardar intentos exitosos y fallidos de autenticación.
 * - Registrar eventos relacionados con sesión, bloqueo o cierre.
 * - Conservar información útil para auditoría como IP y user-agent.
 *
 * Reglas:
 * - Esta función no debe romper el flujo principal si falla la bitácora.
 * - Cualquier error interno se registra en consola y no se relanza.
 *
 * No debe:
 * - Validar credenciales.
 * - Crear sesiones.
 * - Revocar sesiones.
 * - Bloquear usuarios.
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
 * Normaliza un header que puede venir como string, string[] o undefined.
 *
 * Responsabilidades:
 * - Convertir headers HTTP variables a un solo string.
 * - Evitar errores TypeScript por valores string[].
 *
 * No debe:
 * - Interpretar reglas de negocio.
 * - Modificar el request original.
 */
function normalizeHeaderValue(
  value: string | string[] | undefined
): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

/**
 * Obtiene metadatos básicos de la petición HTTP.
 *
 * Responsabilidades:
 * - Obtener la IP real del usuario cuando exista x-forwarded-for.
 * - Obtener el user-agent enviado por el navegador o cliente.
 * - Normalizar valores faltantes como null.
 *
 * Reglas:
 * - Si existe x-forwarded-for, se toma la primera IP.
 * - Si no existe x-forwarded-for, se usa req.ip.
 *
 * No debe:
 * - Validar sesión.
 * - Guardar información en BD.
 * - Modificar el request.
 */
export function getRequestMeta(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwardedFor = normalizeHeaderValue(req.headers["x-forwarded-for"]);
  const userAgent = normalizeHeaderValue(req.headers["user-agent"]);

  const forwardedIp = forwardedFor?.split(",")[0]?.trim() || null;

  return {
    ipAddress: forwardedIp || req.ip || null,
    userAgent
  };
}