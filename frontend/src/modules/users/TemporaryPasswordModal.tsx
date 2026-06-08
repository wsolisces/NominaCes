// ======================================================
// PATH: src/modules/usuarios/components/TemporaryPasswordModal.tsx
// Modal para mostrar código temporal de contraseña
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el código temporal generado para crear o restablecer contraseña.
 * - Permitir copiar el código al portapapeles.
 * - Usar estilos propios del módulo de usuarios.
 *
 * No debe:
 * - Solicitar nuevos códigos.
 * - Guardar el código en localStorage.
 * - Mostrar hashes ni información sensible adicional.
 */

import { useMemo, useState } from "react";

import type { UserTemporaryCodeResult } from "./users.types";

export type TemporaryPasswordModalProps = {
  result: UserTemporaryCodeResult | null;
  onClose: () => void;
};

/**
 * Lee propiedades flexibles del resultado del backend.
 * Esto evita romper la pantalla si el backend usa nombres distintos.
 */
function readResultValue(
  result: UserTemporaryCodeResult,
  keys: string[]
): string {
  const record = result as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }

  return "";
}

/**
 * Obtiene el código temporal desde posibles nombres del contrato.
 */
function getTemporaryCode(result: UserTemporaryCodeResult): string {
  return readResultValue(result, [
    "temporaryCode",
    "temporary_code",
    "resetCode",
    "reset_code",
    "code",
    "password"
  ]);
}

/**
 * Obtiene el usuario relacionado desde posibles nombres del contrato.
 */
function getRelatedUsername(result: UserTemporaryCodeResult): string {
  return readResultValue(result, [
    "username",
    "userName",
    "user_name"
  ]);
}

/**
 * Obtiene la expiración desde posibles nombres del contrato.
 */
function getExpiration(result: UserTemporaryCodeResult): string {
  return readResultValue(result, [
    "expiresAt",
    "expires_at",
    "expiration",
    "expires"
  ]);
}

/**
 * Modal que presenta el código temporal.
 */
export function TemporaryPasswordModal({
  result,
  onClose
}: TemporaryPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => {
    return result ? getTemporaryCode(result) : "";
  }, [result]);

  const username = useMemo(() => {
    return result ? getRelatedUsername(result) : "";
  }, [result]);

  const expiresAt = useMemo(() => {
    return result ? getExpiration(result) : "";
  }, [result]);

  async function handleCopy(): Promise<void> {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!result) return null;

  return (
    <div className="users-modal-backdrop" role="presentation">
      <section
        className="users-modal users-modal--sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="temporary-password-title"
      >
        <header className="users-modal-header">
          <div>
            <p>Contraseña</p>
            <h2 id="temporary-password-title">Código temporal</h2>
          </div>

          <button
            type="button"
            className="users-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="users-modal-body">
          <div className="users-temporary">
            <p className="users-temporary__text">
              Comparte este código únicamente con el usuario autorizado. El
              usuario deberá crear una nueva contraseña al iniciar sesión.
            </p>

            {username && (
              <div className="users-temporary__meta">
                <span>Usuario</span>
                <strong>{username}</strong>
              </div>
            )}

            <div className="users-temporary__code" aria-label="Código temporal">
              {code || "Código no disponible"}
            </div>

            {expiresAt && (
              <div className="users-temporary__meta">
                <span>Expira</span>
                <strong>{expiresAt}</strong>
              </div>
            )}
          </div>
        </div>

        <footer className="users-modal-footer">
          <button
            type="button"
            className="users-button users-button--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            type="button"
            className="users-button users-button--primary"
            onClick={() => void handleCopy()}
            disabled={!code}
          >
            {copied ? "Copiado" : "Copiar código"}
          </button>
        </footer>
      </section>
    </div>
  );
}