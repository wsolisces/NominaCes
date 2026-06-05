// ======================================================
// PATH: backend/src/modules/roles/roles.routes.ts
// Rutas HTTP del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Declarar los endpoints del módulo Roles.
 * - Aplicar autenticación.
 * - Aplicar autorización por permiso.
 * - Conectar rutas con controladores.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Aplicar reglas de negocio.
 * - Construir respuestas manualmente.
 */

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";

import { authRequired } from "../login/auth.middleware.js";

import { APP_PERMISSIONS } from "../permisos/app.permissions.js";
import { requirePermission } from "../permisos/permission.middleware.js";

import * as rolesController from "./roles.controller.js";

export const rolesRoutes = Router();

/**
 * Todas las rutas del módulo requieren sesión válida.
 */
rolesRoutes.use(authRequired);

/**
 * GET /roles
 *
 * Lista todos los roles.
 */
rolesRoutes.get(
  "/",
  requirePermission(APP_PERMISSIONS.ROLES_VIEW),
  asyncHandler(rolesController.listRoles)
);

/**
 * GET /roles/:id
 *
 * Consulta el detalle de un rol.
 */
rolesRoutes.get(
  "/:id",
  requirePermission(APP_PERMISSIONS.ROLES_VIEW),
  asyncHandler(rolesController.getRole)
);

/**
 * POST /roles
 *
 * Crea un rol nuevo.
 */
rolesRoutes.post(
  "/",
  requirePermission(APP_PERMISSIONS.ROLES_CREATE),
  asyncHandler(rolesController.createRole)
);

/**
 * PATCH /roles/:id
 *
 * Modifica nombre, descripción o permisos.
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

/**
 * DELETE /roles/:id
 *
 * Elimina permanentemente un rol sin usuarios asignados.
 *
 * Actualmente utiliza ROLES_EDIT porque ROLES_DELETE todavía
 * no está registrado en el catálogo central de permisos.
 */
rolesRoutes.delete(
  "/:id",
  requirePermission(APP_PERMISSIONS.ROLES_DELETE),
  asyncHandler(rolesController.deleteRole)
);