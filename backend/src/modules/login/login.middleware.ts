// ======================================================
// PATH: backend\src\modules\login\login.middleware.ts
// Middlewares de autenticación y permisos
// ======================================================

import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { AppPermission } from "./login.permissions.js";
import { validateSession } from "./login.service.js";

/**
 * Middleware de autenticación.
 *
 * Valida la cookie httpOnly:
 * - Si no existe, responde 401.
 * - Si existe pero no es válida, responde 401.
 * - Si la sesión expiró, se revoca y responde 401.
 * - Si es válida, agrega req.auth para uso de controladores.
 */
export async function authRequired(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.cookies?.[env.SESSION_COOKIE_NAME];

    if (!sessionToken || typeof sessionToken !== "string") {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Sesión requerida."
      });
    }

    const validated = await validateSession(sessionToken);

    req.auth = {
      sessionId: validated.session.id,
      user: validated.user,
      fortiaToken: validated.fortiaToken
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware de permisos.
 *
 * Se usa después de authRequired.
 *
 * Ejemplo:
 *
 * router.get(
 *   "/users",
 *   authRequired,
 *   requirePermission("USERS_VIEW"),
 *   controller.listUsers
 * );
 */
export function requirePermission(permission: AppPermission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.auth) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "Sesión requerida."
        });
      }

      const hasPermission = req.auth.user.permissions.includes(permission);

      if (!hasPermission) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "No tienes permiso para esta acción."
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}