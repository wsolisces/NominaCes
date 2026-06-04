// ======================================================
// PATH: backend/src/modules/permisos/permisos.routes.ts
// Rutas HTTP del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Declarar endpoints del catálogo controlado de permisos.
 * - Aplicar autenticación y autorización por permiso.
 * - Conectar rutas Express con controladores.
 *
 * No debe:
 * - Crear permisos técnicos desde API.
 * - Eliminar permisos técnicos.
 * - Ejecutar SQL directamente.
 */

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
 * GET /permisos/:permissionKey/audit
 *
 * Lista auditoría del permiso.
 *
 * Debe ir antes de /:permissionKey para evitar conflicto de rutas.
 */
permisosRouter.get(
  "/:permissionKey/audit",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(permisosController.listPermissionAudit)
);

/**
 * GET /permisos/:permissionKey
 *
 * Consulta detalle de un permiso.
 */
permisosRouter.get(
  "/:permissionKey",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_VIEW),
  asyncHandler(permisosController.getPermission)
);

/**
 * PATCH /permisos/:permissionKey
 *
 * Edita metadata de un permiso controlado.
 */
permisosRouter.patch(
  "/:permissionKey",
  requirePermission(APP_PERMISSIONS.PERMISSIONS_EDIT),
  asyncHandler(permisosController.updatePermission)
);