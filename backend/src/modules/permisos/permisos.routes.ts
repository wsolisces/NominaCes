// ======================================================
// PATH: backend/src/modules/permisos/permisos.routes.ts
// Rutas HTTP del módulo Permisos
// ======================================================

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";
import { authRequired } from "../login/auth.middleware.js";
import { APP_PERMISSIONS } from "./app.permissions.js";
import { requirePermission } from "./permission.middleware.js";
import * as permisosController from "./permisos.controller.js";

export const permisosRouter = Router();

/**
 * Todas las rutas del módulo Permisos requieren sesión.
 */
permisosRouter.use(authRequired);

/**
 * GET /permisos
 *
 * Lista permisos disponibles.
 */
permisosRouter.get(
  "/",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(permisosController.listPermissions)
);

/**
 * POST /permisos
 *
 * Crea un permiso técnico nuevo.
 */
permisosRouter.post(
  "/",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_CREATE),
  asyncHandler(permisosController.createPermission)
);

/**
 * PATCH /permisos/:permissionKey
 *
 * Edita metadata de un permiso.
 */
permisosRouter.patch(
  "/:permissionKey",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_EDIT),
  asyncHandler(permisosController.updatePermission)
);