// ======================================================
// PATH: backend/src/modules/permisos/permisos.routes.ts
// Rutas HTTP del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Definir endpoints del catálogo de permisos.
 * - Conectar rutas Express con sus controladores.
 * - Mantener el módulo aislado y reutilizable.
 *
 * No debe:
 * - Ejecutar SQL.
 * - Contener reglas de negocio.
 * - Responder directamente solicitudes HTTP.
 */

import { Router } from "express";

import {
  activatePermissionController,
  createPermissionController,
  deactivatePermissionController,
  deletePermissionController,
  getPermissionByIdController,
  listPermissionsController,
  updatePermissionController
} from "./permisos.controller.js";

export const permisosRouter = Router();

permisosRouter.get("/", listPermissionsController);
permisosRouter.get("/:id", getPermissionByIdController);
permisosRouter.post("/", createPermissionController);
permisosRouter.put("/:id", updatePermissionController);
permisosRouter.patch("/:id/activate", activatePermissionController);
permisosRouter.patch("/:id/deactivate", deactivatePermissionController);
permisosRouter.delete("/:id", deletePermissionController);