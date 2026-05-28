// ======================================================
// PATH: backend\src\shared\errors\AppError.ts
// Error controlado para respuestas HTTP del backend
// ======================================================

/**
 * Códigos internos de error usados por el backend.
 *
 * Estos códigos NO son códigos HTTP.
 * Son claves estables para que el frontend pueda identificar el tipo de error
 * sin depender exactamente del texto del mensaje.
 *
 * Ejemplos:
 * - UNAUTHORIZED: login inválido o sesión expirada.
 * - FORBIDDEN: el usuario sí tiene sesión, pero no tiene permiso.
 * - VALIDATION_ERROR: faltan datos o algún dato no cumple reglas.
 */
export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

/**
 * AppError representa un error esperado/controlado del sistema.
 *
 * Se usa cuando queremos responder al frontend con:
 * - status HTTP específico
 * - código interno
 * - mensaje claro
 * - detalles opcionales
 *
 * Ejemplo:
 *
 * throw new AppError({
 *   statusCode: 401,
 *   code: "UNAUTHORIZED",
 *   message: "Usuario o contraseña incorrectos."
 * });
 *
 * Ventaja:
 * En lugar de regresar errores técnicos de Node/PostgreSQL,
 * regresamos respuestas limpias y consistentes.
 */
export class AppError extends Error {
  /**
   * Código HTTP que se enviará al frontend.
   *
   * Ejemplos:
   * - 400: solicitud incorrecta
   * - 401: no autenticado
   * - 403: sin permiso
   * - 404: no encontrado
   * - 409: conflicto de datos
   * - 500: error interno
   */
  public readonly statusCode: number;

  /**
   * Código interno estable para que el frontend pueda reaccionar.
   */
  public readonly code: AppErrorCode;

  /**
   * Información adicional opcional.
   *
   * Ejemplo:
   * - errores de validación
   * - campos faltantes
   * - lista de reglas incumplidas
   */
  public readonly details?: unknown;

  constructor(params: {
    statusCode: number;
    code: AppErrorCode;
    message: string;
    details?: unknown;
  }) {
    super(params.message);

    this.name = "AppError";
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.details = params.details;
  }
}