// ======================================================
// PATH: backend\src\modules\login\login.controller.ts
// Controladores HTTP del módulo Login
// ======================================================

import type { Request, Response } from "express";
import { z } from "zod";

import { env, isProduction } from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import { ok } from "../../shared/http/responses.js";
import { getRequestMeta } from "./auth.audit.js";
import * as loginService from "./login.service.js";

/**
 * Schema de validación para login.
 */
const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio."),
  password: z.string().min(1, "La contraseña es obligatoria.")
});

/**
 * Schema de validación para crear contraseña con código temporal.
 */
const createPasswordSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio."),
  code: z.string().min(1, "El código temporal es obligatorio."),
  newPassword: z.string().min(1, "La nueva contraseña es obligatoria."),
  confirmPassword: z.string().min(1, "La confirmación de contraseña es obligatoria.")
});

/**
 * Opciones estándar para cookie de sesión.
 *
 * httpOnly:
 * - JavaScript del frontend no puede leer la cookie.
 *
 * sameSite:
 * - En desarrollo usamos lax.
 *
 * secure:
 * - En producción debe viajar solo sobre HTTPS.
 */
function getSessionCookieOptions(expiresAt: string) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    expires: new Date(expiresAt),
    path: "/"
  };
}

/**
 * Limpia la cookie de sesión.
 */
function clearSessionCookie(res: Response): void {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/"
  });
}

/**
 * POST /login
 *
 * Inicia sesión:
 * - valida usuario/contraseña internos
 * - obtiene token Fortia
 * - crea sesión
 * - envía cookie httpOnly
 */
export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos de login inválidos.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const meta = getRequestMeta(req);

  const result = await loginService.login({
    username: parsed.data.username,
    password: parsed.data.password,
    meta
  });

  res.cookie(
    env.SESSION_COOKIE_NAME,
    result.sessionToken,
    getSessionCookieOptions(result.expiresAt)
  );

  ok(res, {
    user: result.user,
    expiresAt: result.expiresAt
  });
}

/**
 * GET /login/me
 *
 * Devuelve el usuario autenticado actual.
 */
export async function me(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Sesión requerida."
    });
  }

  ok(res, {
    user: req.auth.user
  });
}

/**
 * POST /login/logout
 *
 * Cierra sesión:
 * - revoca sesión en BD
 * - limpia token Fortia cifrado
 * - limpia cookie
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const sessionToken = req.cookies?.[env.SESSION_COOKIE_NAME];

  if (sessionToken && typeof sessionToken === "string") {
    await loginService.logout({
      sessionToken,
      meta: getRequestMeta(req)
    });
  }

  clearSessionCookie(res);

  ok(res, {
    loggedOut: true
  });
}


/**
 * POST /login/create-password
 *
 * Crea una nueva contraseña usando código temporal.
 *
 * Se usa cuando:
 * - el usuario fue creado por primera vez
 * - el administrador reseteó su contraseña
 */
export async function createPassword(req: Request, res: Response): Promise<void> {
  const parsed = createPasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos para crear contraseña.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const result = await loginService.createPasswordWithTempCode({
    username: parsed.data.username,
    code: parsed.data.code,
    newPassword: parsed.data.newPassword,
    confirmPassword: parsed.data.confirmPassword,
    meta: getRequestMeta(req)
  });

  ok(res, result, "Contraseña creada correctamente.");
}