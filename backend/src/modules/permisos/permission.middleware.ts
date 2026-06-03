// ======================================================
// PATH: backend/src/modules/permisos/permission.middleware.ts
// Middleware de autorización por permisos
// ======================================================

import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError.js";
import type { AppPermission } from "./app.permissions.js";

/**
 * Middleware de autorización por permiso.
 *
 * Responsabilidades:
 * - Validar que exista req.auth.
 * - Validar que el usuario autenticado tenga el permiso requerido.
 * - Bloquear la petición con 403 cuando el usuario no tenga permiso.
 *
 * Reglas:
 * - Siempre debe usarse después de authRequired.
 * - El permiso debe venir del catálogo APP_PERMISSIONS.
 *
 * No debe:
 * - Leer cookies.
 * - Validar sesiones.
 * - Consultar usuarios desde BD.
 * - Crear, editar o eliminar permisos.
 */
export function requirePermission(permission: AppPermission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.auth) {
        throw new AppError({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "Sesión requerida."
        });
      }

      const userPermissions = req.auth.user.permissions ?? [];
      const hasPermission = userPermissions.includes(permission);

      if (!hasPermission) {
        throw new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "No tienes permiso para esta acción."
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}