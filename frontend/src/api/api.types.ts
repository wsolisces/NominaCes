// ======================================================
// PATH: src/api/api.types.ts
// Tipos genéricos para comunicación con backend
// ======================================================

/**
 * Métodos HTTP permitidos por el cliente central.
 *
 * Mantenerlos aquí evita strings sueltos en todo el frontend.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Estructura estándar esperada del backend.
 *
 * Tu backend normalmente responde:
 * {
 *   ok: true,
 *   data: ...
 * }
 *
 * o:
 * {
 *   ok: false,
 *   error: {
 *     code: "...",
 *     message: "..."
 *   }
 * }
 */
export type ApiEnvelope<TData = unknown> = {
  ok: boolean;
  data?: TData;
  error?: ApiErrorBody;
  message?: string;
};

/**
 * Estructura estándar de error enviada por backend.
 */
export type ApiErrorBody = {
  code?: string;
  message?: string;
  details?: unknown;
};

/**
 * Opciones reutilizables para cada request.
 */
export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;

  /**
   * Cuando sea true, no agrega Content-Type JSON.
   * Útil después para FormData / archivos.
   */
  skipJsonContentType?: boolean;
};

/**
 * Error normalizado del frontend.
 *
 * En vez de manejar errores de fetch sueltos,
 * toda la app puede leer status, code y message.
 */
export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  payload?: unknown;

  constructor(params: {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
    payload?: unknown;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    this.payload = params.payload;
  }
}