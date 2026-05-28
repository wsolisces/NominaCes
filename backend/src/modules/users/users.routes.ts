// ======================================================
// PATH: backend\src\modules\users\users.routes.ts
// Rutas HTTP del módulo Users
// ======================================================

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";
import { authRequired, requirePermission } from "../login/login.middleware.js";
import { APP_PERMISSIONS } from "../login/login.permissions.js";
import * as usersController from "./users.controller.js";

export const usersRouter = Router();

/**
 * Todas las rutas de Users requieren sesión.
 */
usersRouter.use(authRequired);

/**
 * GET /users
 *
 * Lista usuarios.
 */
usersRouter.get(
  "/",
  requirePermission(APP_PERMISSIONS.USERS_VIEW),
  asyncHandler(usersController.listUsers)
);

/**
 * POST /users
 *
 * Crea usuario nuevo.
 */
usersRouter.post(
  "/",
  requirePermission(APP_PERMISSIONS.USERS_CREATE),
  asyncHandler(usersController.createUser)
);

/**
 * PATCH /users/:userId
 *
 * Edita usuario.
 */
usersRouter.patch(
  "/:userId",
  requirePermission(APP_PERMISSIONS.USERS_EDIT),
  asyncHandler(usersController.updateUser)
);

/**
 * POST /users/:userId/activate
 *
 * Activa usuario.
 */
usersRouter.post(
  "/:userId/activate",
  requirePermission(APP_PERMISSIONS.USERS_EDIT),
  asyncHandler(usersController.activateUser)
);

/**
 * POST /users/:userId/deactivate
 *
 * Desactiva usuario.
 */
usersRouter.post(
  "/:userId/deactivate",
  requirePermission(APP_PERMISSIONS.USERS_EDIT),
  asyncHandler(usersController.deactivateUser)
);

/**
 * POST /users/:userId/unlock
 *
 * Desbloquea usuario.
 */
usersRouter.post(
  "/:userId/unlock",
  requirePermission(APP_PERMISSIONS.USERS_EDIT),
  asyncHandler(usersController.unlockUser)
);

/**
 * POST /users/:userId/reset-password
 *
 * Genera código temporal para crear nueva contraseña.
 */
usersRouter.post(
  "/:userId/reset-password",
  requirePermission(APP_PERMISSIONS.USERS_EDIT),
  asyncHandler(usersController.resetPassword)
);