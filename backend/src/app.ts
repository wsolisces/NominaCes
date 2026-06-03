// ======================================================
// PATH: backend/src/app.ts
// Configuración principal de Express
// ======================================================

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";

import { env, isProduction } from "./config/env.js";
import { handleError, ok } from "./shared/http/responses.js";

import { loginRouter } from "./modules/login/login.routes.js";
import { permisosRouter } from "./modules/permisos/permisos.routes.js";
import { rolesRoutes } from "./modules/roles/roles.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const app = express();

/**
 * Orígenes permitidos para CORS.
 *
 * Responsabilidades:
 * - Permitir el frontend configurado en .env.
 * - Permitir puertos locales usados por Vite.
 *
 * No debe:
 * - Permitir cualquier origen en producción.
 * - Duplicar configuración CORS en módulos.
 */
const allowedOrigins = Array.from(
  new Set(
    [
      env.FRONTEND_ORIGIN,
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174"
    ].filter(Boolean)
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

/**
 * Health check del backend.
 */
app.get("/health", (_req: Request, res: Response) => {
  ok(res, {
    service: "NominaCes Backend",
    status: "OK",
    environment: env.NODE_ENV,
    secureCookies: isProduction,
    allowedOrigins
  });
});

/**
 * Rutas oficiales del backend.
 *
 * Regla:
 * - Todas las rutas funcionales deben vivir bajo /api.
 * - Cada módulo registra sus propias rutas.
 */
app.use("/api/login", loginRouter);
app.use("/api/permisos", permisosRouter);
app.use("/api/roles", rolesRoutes);
app.use("/api/users", usersRouter);

/**
 * Middleware 404.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
    }
  });
});

/**
 * Middleware global de errores.
 */
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): Response => {
    return handleError(error, res);
  }
);