// ======================================================
// PATH: backend/src/modules/users/users.routes.ts
// Rutas HTTP del módulo de usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Definir endpoints del catálogo de usuarios.
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
  activateUserController,
  createUserController,
  deactivateUserController,
  deleteUserController,
  getUserByIdController,
  listUsersController,
  lockUserController,
  resetUserPasswordController,
  unlockUserController,
  updateUserController
} from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get("/", listUsersController);
usersRouter.get("/:id", getUserByIdController);
usersRouter.post("/", createUserController);
usersRouter.put("/:id", updateUserController);
usersRouter.patch("/:id/activate", activateUserController);
usersRouter.patch("/:id/deactivate", deactivateUserController);
usersRouter.patch("/:id/lock", lockUserController);
usersRouter.patch("/:id/unlock", unlockUserController);
usersRouter.patch("/:id/reset-password", resetUserPasswordController);
usersRouter.delete("/:id", deleteUserController);