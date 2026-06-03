// ======================================================
// PATH: backend/src/modules/login/auth.middleware.ts
// Middleware de autenticación por sesión
// ======================================================

import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { validateSession } from "./login.service.js";

/**
 * Middleware de autenticación.
 *
 * Responsabilidades:
 * - Leer el token de sesión desde la cookie httpOnly configurada en .env.
 * - Validar la sesión usando validateSession.
 * - Agregar req.auth con la información autenticada del usuario.
 *
 * Reglas:
 * - Si no hay cookie de sesión, responde 401.
 * - Si la sesión es inválida o expiró, validateSession debe lanzar error 401.
 * - Si la sesión es válida, continúa con next().
 *
 * No debe:
 * - Validar permisos específicos.
 * - Crear sesiones.
 * - Cerrar sesiones manualmente.
 * - Consultar permisos directamente desde BD.
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