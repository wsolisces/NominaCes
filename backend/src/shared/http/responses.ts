// ======================================================
// PATH: backend\src\shared\http\responses.ts
// Formato estándar de respuestas HTTP del backend
// ======================================================

import type { Response } from "express";
import { AppError } from "../errors/AppError.js";

/**
 * Respuesta estándar para operaciones exitosas.
 *
 * Todo endpoint exitoso debe responder con este formato:
 *
 * {
 *   ok: true,
 *   data: ...
 * }
 *
 * Opcionalmente puede incluir:
 *
 * {
 *   ok: true,
 *   data: ...,
 *   message: "Guardado correctamente."
 * }
 */
export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
  message?: string;
};

/**
 * Respuesta estándar para errores.
 *
 * Todo error controlado o inesperado debe responder con este formato:
 *
 * {
 *   ok: false,
 *   error: {
 *     code: "UNAUTHORIZED",
 *     message: "Sesión expirada."
 *   }
 * }
 *
 * Opcionalmente puede incluir details para validaciones o diagnósticos.
 */
export type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Envía respuesta exitosa con status 200 por default.
 *
 * Uso:
 *
 * ok(res, user);
 *
 * Respuesta:
 *
 * {
 *   ok: true,
 *   data: user
 * }
 */
export function ok<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response<ApiSuccessResponse<T>> {
  return res.status(statusCode).json({
    ok: true,
    data,
    ...(message ? { message } : {})
  });
}

/**
 * Envía respuesta exitosa de creación con status 201.
 *
 * Uso recomendado para:
 * - crear usuario
 * - crear rol
 * - crear catálogo
 */
export function created<T>(
  res: Response,
  data: T,
  message?: string
): Response<ApiSuccessResponse<T>> {
  return ok(res, data, message, 201);
}

/**
 * Envía respuesta sin contenido con status 204.
 *
 * Uso recomendado para:
 * - logout exitoso sin necesidad de regresar datos
 * - eliminación lógica
 * - acciones donde solo importa que se completó
 */
export function noContent(res: Response): Response {
  return res.status(204).send();
}

/**
 * Convierte errores del backend al formato estándar de respuesta.
 *
 * Si el error es AppError:
 * - respeta su statusCode
 * - respeta su code
 * - respeta su message
 * - agrega details si existen
 *
 * Si el error NO es AppError:
 * - lo registra en consola
 * - responde INTERNAL_ERROR
 * - no expone detalles técnicos al frontend
 *
 * Esto evita mostrar al usuario errores internos de PostgreSQL, Node,
 * stack traces o información sensible.
 */
export function handleError(
  error: unknown,
  res: Response
): Response<ApiErrorResponse> {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {})
      }
    });
  }

  console.error("[UNHANDLED_ERROR]", error);

  return res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error interno."
    }
  });
}