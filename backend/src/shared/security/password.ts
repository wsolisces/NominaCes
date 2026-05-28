// ======================================================
// PATH: backend\src\shared\security\password.ts
// Utilidades para contraseña: hash, comparación y validación
// ======================================================

import bcrypt from "bcrypt";
import { env } from "../../config/env.js";

/**
 * Genera hash bcrypt para una contraseña.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto claro contra un hash bcrypt.
 */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Valida reglas mínimas de seguridad para contraseñas nuevas.
 *
 * Reglas:
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 símbolo
 */
export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener mínimo 8 caracteres.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una mayúscula.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una minúscula.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un número.");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un símbolo.");
  }

  return errors;
}

/**
 * Normaliza username para que el login no distinga mayúsculas/minúsculas.
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}