// ======================================================
// PATH: backend/src/modules/users/users.controller.ts
// Controlador HTTP del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Recibir solicitudes HTTP del catálogo de usuarios.
 * - Normalizar parámetros provenientes de Express.
 * - Delegar reglas de negocio al service.
 * - Responder con un formato consistente.
 *
 * No debe:
 * - Ejecutar SQL directamente.
 * - Crear conexiones a PostgreSQL.
 * - Duplicar validaciones profundas del service.
 */

import type { Request, Response } from "express";

import {
  activateUserService,
  createUserService,
  deactivateUserService,
  deleteUserService,
  getUserByIdService,
  listUsersService,
  lockUserService,
  resetUserPasswordService,
  unlockUserService,
  updateUserService
} from "./users.service.js";

import { UserDomainError } from "./users.types.js";

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  const normalized = asString(value);

  if (!normalized) return undefined;

  const numberValue = Number(normalized);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  const normalized = asString(value);

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
}

function sendError(res: Response, error: unknown): void {
  if (error instanceof UserDomainError) {
    res.status(error.statusCode).json({
      ok: false,
      code: error.code,
      message: error.message
    });

    return;
  }

  console.error("[users.controller] Error no controlado:", error);

  res.status(500).json({
    ok: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocurrió un error interno al procesar la solicitud."
  });
}

/**
 * GET /users
 * Lista usuarios con filtros opcionales.
 */
export async function listUsersController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const users = await listUsersService({
      search: asString(req.query.search),
      role_id: asNumber(req.query.role_id),
      is_active: asBoolean(req.query.is_active),
      is_locked: asBoolean(req.query.is_locked)
    });

    res.status(200).json({
      ok: true,
      data: users
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /users/:id
 * Obtiene un usuario por id.
 */
export async function getUserByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const user = await getUserByIdService(req.params.id);

    res.status(200).json({
      ok: true,
      data: user
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /users
 * Crea un usuario.
 */
export async function createUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await createUserService(req.body);

    res.status(201).json({
      ok: true,
      data: result.user,
      message: "Usuario creado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PUT /users/:id
 * Actualiza un usuario.
 */
export async function updateUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await updateUserService(req.params.id, req.body);

    res.status(200).json({
      ok: true,
      data: result.user,
      message: "Usuario actualizado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /users/:id/activate
 * Activa un usuario.
 */
export async function activateUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await activateUserService(req.params.id);

    res.status(200).json({
      ok: true,
      data: result.user,
      message: "Usuario activado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /users/:id/deactivate
 * Desactiva un usuario.
 */
export async function deactivateUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await deactivateUserService(req.params.id);

    res.status(200).json({
      ok: true,
      data: result.user,
      message: "Usuario desactivado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /users/:id/lock
 * Bloquea manualmente un usuario.
 */
export async function lockUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await lockUserService(req.params.id, req.body?.reason);

    res.status(200).json({
      ok: true,
      data: result.user,
      message: "Usuario bloqueado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /users/:id/unlock
 * Desbloquea un usuario.
 */
export async function unlockUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await unlockUserService(req.params.id);

    res.status(200).json({
      ok: true,
      data: result.user,
      message: "Usuario desbloqueado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /users/:id/reset-password
 * Genera una contraseña temporal.
 */
export async function resetUserPasswordController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await resetUserPasswordService(req.params.id);

    res.status(200).json({
      ok: true,
      data: {
        user: result.user,
        temporaryPassword: result.temporaryPassword
      },
      message: "Contraseña temporal generada correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * DELETE /users/:id
 * Elimina un usuario.
 */
export async function deleteUserController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    await deleteUserService(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Usuario eliminado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}