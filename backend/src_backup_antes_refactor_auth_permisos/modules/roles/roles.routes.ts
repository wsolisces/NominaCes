// ======================================================
// PATH: backend/src/modules/roles/roles.routes.ts
// Rutas HTTP del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Registrar endpoints del módulo Roles.
 * - Exigir sesión activa antes de acceder al módulo.
 * - Validar permisos por operación.
 * - Delegar la lógica a controllers.
 *
 * No debe:
 * - Validar cookies manualmente.
 * - Consultar base de datos.
 * - Contener reglas de negocio.
 * - Construir respuestas HTTP directamente.
 */

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";
import { authRequired, requirePermission } from "../login/auth.middleware.js";
import { APP_PERMISSIONS } from "../login/login.permissions.js";
import * as rolesController from "./roles.controller.js";

export const rolesRoutes = Router();

/**
 * Todas las rutas de Roles requieren sesión válida.
 *
 * La autenticación real vive en login.middleware.ts.
 * No se valida la cookie manualmente aquí para evitar duplicar seguridad.
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