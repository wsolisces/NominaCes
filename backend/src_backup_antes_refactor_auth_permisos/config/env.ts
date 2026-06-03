// ======================================================
// PATH: backend\src\config\env.ts
// ======================================================

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Variables de entorno centralizadas.
 *
 * Regla del proyecto:
 * - Ningún módulo debe leer process.env directamente.
 * - Todo debe pasar por este archivo.
 * - Si una URL de Fortia cambia, se actualiza solo en .env.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(4002),

  DB_HOST: z.string().min(1, "DB_HOST es obligatorio."),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1, "DB_NAME es obligatorio."),
  DB_USER: z.string().min(1, "DB_USER es obligatorio."),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD es obligatorio."),

  FRONTEND_ORIGIN: z.string().min(1, "FRONTEND_ORIGIN es obligatorio."),

  SESSION_COOKIE_NAME: z
    .string()
    .min(1, "SESSION_COOKIE_NAME es obligatorio.")
    .default("nominaces_session"),

  SESSION_TTL_MINUTES: z.coerce.number().default(25),

  SESSION_ENCRYPTION_KEY: z
    .string()
    .min(32, "SESSION_ENCRYPTION_KEY debe tener mínimo 32 caracteres."),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  FORTIA_AUTH_URL: z.string().min(1, "FORTIA_AUTH_URL es obligatorio."),
  FORTIA_BUSINESS: z.string().min(1, "FORTIA_BUSINESS es obligatorio."),
  FORTIA_COST_CENTER: z.string().min(1, "FORTIA_COST_CENTER es obligatorio."),
  FORTIA_DEPARTMENT: z.string().min(1, "FORTIA_DEPARTMENT es obligatorio."),
  FORTIA_WORK_STATION: z.string().min(1, "FORTIA_WORK_STATION es obligatorio."),
  FORTIA_EMPLOYEES_V2: z.string().min(1, "FORTIA_EMPLOYEES_V2 es obligatorio."),
  FORTIA_RECEIPT_DETAILS_V1: z.string().min(1, "FORTIA_RECEIPT_DETAILS_V1 es obligatorio."),
  FORTIA_PAYROLL_V2: z.string().min(1, "FORTIA_PAYROLL_V2 es obligatorio."),

  FORTIA_USERNAME: z.string().min(1, "FORTIA_USERNAME es obligatorio."),
  FORTIA_PASSWORD: z.string().min(1, "FORTIA_PASSWORD es obligatorio.")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Error en variables de entorno:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

/**
 * URLs disponibles de Fortia.
 *
 * Los módulos no deben escribir URLs manualmente.
 * Deben usar estas llaves para mantener todo centralizado.
 */
export const fortiaUrls = {
  auth: env.FORTIA_AUTH_URL,
  business: env.FORTIA_BUSINESS,
  costCenter: env.FORTIA_COST_CENTER,
  department: env.FORTIA_DEPARTMENT,
  workStation: env.FORTIA_WORK_STATION,
  employeesV2: env.FORTIA_EMPLOYEES_V2,
  receiptDetailsV1: env.FORTIA_RECEIPT_DETAILS_V1,
  payrollV2: env.FORTIA_PAYROLL_V2
} as const;

export type FortiaUrlKey = keyof typeof fortiaUrls;