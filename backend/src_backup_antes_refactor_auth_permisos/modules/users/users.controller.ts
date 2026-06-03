// ======================================================
// PATH: backend\src\modules\users\users.controller.ts
// Controladores HTTP del módulo Users
// ======================================================

import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../../shared/errors/AppError.js";
import { created, ok } from "../../shared/http/responses.js";
import * as usersService from "./users.service.js";

/**
 * Valida creación de usuario.
 */
const createUserSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio."),
  fullName: z.string().min(1, "El nombre completo es obligatorio."),
  roleId: z.string().min(1, "El rol es obligatorio.")
});

/**
 * Valida edición de usuario.
 */
const updateUserSchema = z.object({
  fullName: z.string().min(1, "El nombre completo es obligatorio."),
  roleId: z.string().min(1, "El rol es obligatorio.")
});

/**
 * Obtiene id desde params.
 *
 * Express 5 puede inferir params como string | string[].
 * Por eso normalizamos el valor antes de usarlo.
 */
function getUserIdParam(req: Request): string {
  const rawUserId = req.params.userId;
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;

  if (!userId || String(userId).trim() === "") {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El id de usuario es obligatorio."
    });
  }

  return String(userId);
}

/**
 * Obtiene el usuario autenticado que ejecuta la acción.
 */
function getChangedByUserId(req: Request): string {
  if (!req.auth?.user?.id) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Sesión requerida."
    });
  }

  return req.auth.user.id;
}

/**
 * GET /users
 *
 * Lista usuarios para mantenimiento.
 */
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await usersService.getUsers();

  ok(res, {
    users
  });
}

/**
 * POST /users
 *
 * Crea usuario nuevo.
 *
 * Importante:
 * - El código temporal se muestra una sola vez en esta respuesta.
 * - No se guarda visible en BD.
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos para crear usuario.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const result = await usersService.createNewUser({
    username: parsed.data.username,
    fullName: parsed.data.fullName,
    roleId: parsed.data.roleId,
    changedByUserId: getChangedByUserId(req)
  });

  created(res, result, "Usuario creado correctamente.");
}

/**
 * PATCH /users/:userId
 *
 * Edita nombre completo y rol del usuario.
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos para editar usuario.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const result = await usersService.editUser({
    userId: getUserIdParam(req),
    fullName: parsed.data.fullName,
    roleId: parsed.data.roleId,
    changedByUserId: getChangedByUserId(req)
  });

  ok(res, result, "Usuario actualizado correctamente.");
}

/**
 * POST /users/:userId/activate
 *
 * Activa usuario.
 */
export async function activateUser(req: Request, res: Response): Promise<void> {
  const result = await usersService.activateUserById({
    userId: getUserIdParam(req),
    changedByUserId: getChangedByUserId(req)
  });

  ok(res, result, "Usuario activado correctamente.");
}

/**
 * POST /users/:userId/deactivate
 *
 * Desactiva usuario y revoca sesiones.
 */
export async function deactivateUser(
  req: Request,
  res: Response
): Promise<void> {
  const result = await usersService.deactivateUserById({
    userId: getUserIdParam(req),
    changedByUserId: getChangedByUserId(req)
  });

  ok(res, result, "Usuario desactivado correctamente.");
}

/**
 * POST /users/:userId/unlock
 *
 * Desbloquea usuario.
 */
export async function unlockUser(req: Request, res: Response): Promise<void> {
  const result = await usersService.unlockUserById({
    userId: getUserIdParam(req),
    changedByUserId: getChangedByUserId(req)
  });

  ok(res, result, "Usuario desbloqueado correctamente.");
}

/**
 * POST /users/:userId/reset-password
 *
 * Genera código temporal de 6 dígitos.
 *
 * Importante:
 * - El código se devuelve una sola vez.
 * - El administrador debe compartirlo por el medio definido.
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const result = await usersService.resetUserPassword({
    userId: getUserIdParam(req),
    changedByUserId: getChangedByUserId(req)
  });

  ok(res, result, "Contraseña reseteada correctamente.");
}