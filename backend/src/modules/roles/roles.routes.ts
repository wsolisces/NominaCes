// ======================================================
// PATH: backend/src/modules/roles/roles.routes.ts
// Rutas HTTP del módulo Roles
// ======================================================

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";
import { authRequired } from "../login/auth.middleware.js";
import { APP_PERMISSIONS } from "../permisos/app.permissions.js";
import { requirePermission } from "../permisos/permission.middleware.js";
import * as rolesController from "./roles.controller.js";

export const rolesRoutes = Router();

/**
 * Todas las rutas de Roles requieren sesión válida.
 */
rolesRoutes.use(authRequired);

/**
 * GET /roles
 *
 * Lista roles disponibles para mantenimiento y selects.
 */
rolesRoutes.get(
  "/",
  requirePermission(APP_PERMISSIONS.ROLES_VIEW),
  asyncHandler(rolesController.listRoles)
);

/**
 * GET /roles/:id
 *
 * Consulta detalle de un rol específico.
 */
rolesRoutes.get(
  "/:id",
  requirePermission(APP_PERMISSIONS.ROLES_VIEW),
  asyncHandler(rolesController.getRole)
);

/**
 * POST /roles
 *
 * Crea un nuevo rol con permisos.
 */
rolesRoutes.post(
  "/",
  requirePermission(APP_PERMISSIONS.ROLES_CREATE),
  asyncHandler(rolesController.createRole)
);

/**
 * PATCH /roles/:id
 *
 * Edita nombre, descripción y permisos de un rol.
 */
rolesRoutes.patch(
  "/:id",
  requirePermission(APP_PERMISSIONS.ROLES_EDIT),
  asyncHandler(rolesController.updateRole)
);

/**
 * POST /roles/:id/deactivate
 *
 * Desactiva un rol.
 */
rolesRoutes.post(
  "/:id/deactivate",
  requirePermission(APP_PERMISSIONS.ROLES_EDIT),
  asyncHandler(rolesController.deactivateRole)
);

/**
 * POST /roles/:id/activate
 *
 * Activa un rol.
 */
rolesRoutes.post(
  "/:id/activate",
  requirePermission(APP_PERMISSIONS.ROLES_EDIT),
  asyncHandler(rolesController.activateRole)
);