// ======================================================
// PATH: backend\src\config\db.ts
// Archivo de conexión a PostgreSQL
// ======================================================

import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

/**
 * Pool central de PostgreSQL.
 *
 * Regla del proyecto:
 * - Ningún módulo debe crear conexiones directas.
 * - Todos los repositorios deben usar este pool.
 */
export const db = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

/**
 * Valida conexión inicial a la base de datos.
 * Se usa al arrancar el backend.
 */
export async function checkDatabaseConnection(): Promise<void> {
  const result = await db.query<{ now: Date }>("SELECT NOW() AS now");
  console.log(`[DB] Conexión OK: ${result.rows[0]?.now}`);
}

/**
 * Cierra el pool.
 * Útil para seeds, scripts o apagado controlado.
 */
export async function closeDatabaseConnection(): Promise<void> {
  await db.end();
}