// ======================================================
// PATH: backend/src/integrations/fortia/fortia.types.ts
// Tipos de la integración con Fortia
// ======================================================

/**
 * Resultado normalizado de autenticación contra Fortia.
 *
 * Responsabilidades:
 * - Representar el token JWT devuelto por Fortia.
 * - Evitar que el módulo login conozca detalles internos de la respuesta Fortia.
 *
 * No debe:
 * - Contener tipos de usuario interno.
 * - Contener tipos de sesión NominaCes.
 */
export type FortiaAuthResult = {
  token: string;
};