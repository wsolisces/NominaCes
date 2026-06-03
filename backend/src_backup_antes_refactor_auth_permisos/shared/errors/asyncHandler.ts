// ======================================================
// PATH: backend\src\shared\errors\asyncHandler.ts
// Wrapper reutilizable para controladores async de Express
// ======================================================

import type { NextFunction, Request, Response } from "express";

/**
 * Envuelve controladores async para evitar repetir try/catch.
 *
 * Problema:
 * Express no captura automáticamente todos los errores lanzados dentro
 * de funciones async si no se pasan a next(error).
 *
 * Sin asyncHandler, cada controlador tendría que escribirse así:
 *
 * export async function login(req, res, next) {
 *   try {
 *     const result = await service.login(req.body);
 *     res.json(result);
 *   } catch (error) {
 *     next(error);
 *   }
 * }
 *
 * Con asyncHandler, el controlador puede mantenerse limpio:
 *
 * router.post("/login", asyncHandler(loginController.login));
 *
 * Si ocurre cualquier error dentro del controlador:
 * - AppError
 * - error de validación
 * - error de base de datos
 * - error inesperado
 *
 * asyncHandler lo envía automáticamente al middleware general de errores.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}