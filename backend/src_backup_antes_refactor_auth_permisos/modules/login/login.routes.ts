// ======================================================
// PATH: backend\src\modules\login\login.routes.ts
// Rutas HTTP del módulo Login
// ======================================================

import { Router } from "express";

import { asyncHandler } from "../../shared/errors/asyncHandler.js";
import { authRequired } from "./auth.middleware.js";
import * as loginController from "./login.controller.js";

export const loginRouter = Router();

/**
 * POST /login
 *
 * Inicia sesión.
 */
loginRouter.post("/", asyncHandler(loginController.login));

/**
 * POST /login/create-password
 *
 * Permite crear contraseña con código temporal.
 */
loginRouter.post(
  "/create-password",
  asyncHandler(loginController.createPassword)
);

/**
 * GET /login/me
 *
 * Devuelve usuario autenticado actual.
 */
loginRouter.get("/me", authRequired, asyncHandler(loginController.me));

/**
 * POST /login/logout
 *
 * Cierra sesión manualmente.
 */
loginRouter.post("/logout", asyncHandler(loginController.logout));