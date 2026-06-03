// ======================================================
// PATH: backend\src\shared\security\crypto.ts
// Utilidades de cifrado para datos sensibles de sesión
// ======================================================

import crypto from "crypto";
import { env } from "../../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * Genera una llave de 32 bytes a partir de SESSION_ENCRYPTION_KEY.
 *
 * Nota:
 * - La variable del .env no se usa directamente como llave binaria.
 * - Se deriva con SHA-256 para garantizar longitud compatible con AES-256.
 */
function getEncryptionKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(env.SESSION_ENCRYPTION_KEY)
    .digest();
}

/**
 * Cifra texto sensible.
 *
 * Formato devuelto:
 * iv:authTag:encrypted
 */
export function encryptText(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64")
  ].join(":");
}

/**
 * Descifra texto generado por encryptText.
 */
export function decryptText(encryptedText: string): string {
  const [ivBase64, authTagBase64, encryptedBase64] = encryptedText.split(":");

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Texto cifrado inválido.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

/**
 * Genera token seguro para cookie de sesión.
 */
export function generateSecureToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Genera hash SHA-256 para guardar tokens/códigos sin texto claro.
 */
export function sha256Hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Genera código temporal numérico de 6 dígitos.
 */
export function generateSixDigitCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}