// ======================================================
// PATH: backend/src/modules/roles/roles.routes.ts
// Módulo: Roles
// Archivo: Routes
// ------------------------------------------------------
// Define endpoints del módulo.
//
// Temporalmente valida por cookie porque el login sí entrega
// Set-Cookie y las pruebas manuales lo reutilizan.
// ======================================================

import { Router, type NextFunction, type Request, type Response } from "express";
import {
  activateRoleController,
  createRoleController,
  deactivateRoleController,
  getRoleController,
  listRolesController,
  updateRoleController,
} from "./roles.controller.js";

/**
 * Middleware mínimo de autenticación para pruebas manuales.
 */
function requireAuthCookie(req: Request, res: Response, next: NextFunction): void {
  const cookie = req.headers.cookie;

  if (!cookie) {
    res.status(401).json({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Sesión requerida",
      },
    });
    return;
  }

  next();
}

export const rolesRoutes = Router();

rolesRoutes.use(requireAuthCookie);

rolesRoutes.get("/", listRolesController);
rolesRoutes.get("/:id", getRoleController);

rolesRoutes.post("/", createRoleController);
rolesRoutes.patch("/:id", updateRoleController);

rolesRoutes.post("/:id/deactivate", deactivateRoleController);
rolesRoutes.post("/:id/activate", activateRoleController);