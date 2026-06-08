// ======================================================
// PATH: src/modules/roles/roles.routes.ts
// Rutas del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Declarar endpoints HTTP para roles.
 * - Conectar rutas con controladores.
 *
 * No debe:
 * - Ejecutar SQL.
 * - Contener reglas de negocio.
 * - Formatear respuestas manualmente.
 */

import { Router } from "express";

import {
  changeRoleStatusController,
  createRoleController,
  getRoleAuditController,
  getRoleDetailController,
  listRolesController,
  updateRoleController,
} from "./roles.controller.js";

export const rolesRouter = Router();

rolesRouter.get("/", listRolesController);
rolesRouter.get("/:id", getRoleDetailController);
rolesRouter.get("/:id/audit", getRoleAuditController);

rolesRouter.post("/", createRoleController);

rolesRouter.put("/:id", updateRoleController);

rolesRouter.patch("/:id/status", changeRoleStatusController);