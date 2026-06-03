// ======================================================
// PATH: backend\src\index.ts
// Punto de entrada del backend NominaCes
// ======================================================

import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/db.js";

/**
 * Arranque controlado del backend.
 *
 * Primero valida conexión a PostgreSQL.
 * Si la BD no responde, el servidor no levanta.
 */
async function bootstrap(): Promise<void> {
  try {
    await checkDatabaseConnection();

    app.listen(env.PORT, () => {
      console.log(`[API] NominaCes backend escuchando en puerto ${env.PORT}`);
      console.log(`[API] Health: http://localhost:${env.PORT}/health`);
      console.log(`[API] Login:  http://localhost:${env.PORT}/login`);
    });
  } catch (error) {
    console.error("[BOOTSTRAP_ERROR] No se pudo iniciar el backend.");
    console.error(error);
    process.exit(1);
  }
}

void bootstrap();