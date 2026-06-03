// ======================================================
// PATH: frontend/src/pages/Users/components/TemporaryPasswordModal.tsx
// Modal para mostrar código temporal de contraseña
// ======================================================

/**
 * Responsabilidades:
 * - Mostrar el código temporal generado para crear o restablecer contraseña.
 * - Permitir copiar el código al portapapeles.
 * - Usar Modal y Button reutilizables.
 *
 * No debe:
 * - Solicitar nuevos códigos.
 * - Guardar el código en localStorage.
 * - Mostrar hashes ni información sensible adicional.
 */

import { useMemo, useState } from "react";

import { Button, Modal } from "../../../shared/ui";
import type { UserTemporaryCodeResult } from "../users.types";

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

  return (
    <Modal
      open={Boolean(result)}
      title="Código temporal"
      eyebrow="Contraseña"
      size="sm"
      onClose={onClose}
      footer={
        <div className="users-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={() => void handleCopy()}
            disabled={!code}
          >
            {copied ? "Copiado" : "Copiar código"}
          </Button>
        </div>
      }
    >
      <div className="users-temporary">
        <p className="users-temporary__text">
          Comparte este código únicamente con el usuario autorizado. El usuario
          deberá crear una nueva contraseña al iniciar sesión.
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
    </Modal>
  );
}