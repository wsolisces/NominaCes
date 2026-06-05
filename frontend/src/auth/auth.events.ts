// ======================================================
// PATH: src/auth/auth.events.ts
// Eventos globales relacionados con autenticación
// ======================================================

export const AUTH_SESSION_EXPIRED_EVENT =
  "nominaces:auth-session-expired";

/**
 * Notifica a la aplicación que la sesión actual dejó de ser válida.
 */
export function notifySessionExpired(): void {
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EXPIRED_EVENT)
  );
}