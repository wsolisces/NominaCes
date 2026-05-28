// ======================================================
// PATH: backend\src\seeds\seedAdminUser.ts
// Seed inicial para crear el usuario administrador
// ======================================================

import { db, closeDatabaseConnection } from "../config/db.js";
import { hashPassword, normalizeUsername } from "../shared/security/password.js";

const ADMIN_USERNAME = "wsolis";
const ADMIN_FULL_NAME = "Wendy Solis";
const ADMIN_PASSWORD = "Nomina@2026";
const ADMIN_ROLE_KEY = "ADMINISTRADOR";

/**
 * Crea o actualiza el primer usuario administrador.
 *
 * Importante:
 * - La contraseña se guarda con bcrypt.
 * - No se inserta password_hash manual desde SQL.
 * - Si el usuario ya existe, se actualiza para poder recuperar acceso inicial.
 */
async function seedAdminUser(): Promise<void> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const roleResult = await client.query<{ id: string }>(
      `
      SELECT id
      FROM app_role
      WHERE role_key = $1
      LIMIT 1
      `,
      [ADMIN_ROLE_KEY]
    );

    const role = roleResult.rows[0];

    if (!role) {
      throw new Error(`No existe el rol inicial ${ADMIN_ROLE_KEY}.`);
    }

    const usernameNormalized = normalizeUsername(ADMIN_USERNAME);
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    const existingUserResult = await client.query<{
      id: string;
      username: string;
      username_normalized: string;
      full_name: string;
      role_id: string;
      is_active: boolean;
      is_locked: boolean;
      failed_login_attempts: number;
      password_reset_required: boolean;
    }>(
      `
      SELECT
        id,
        username,
        username_normalized,
        full_name,
        role_id,
        is_active,
        is_locked,
        failed_login_attempts,
        password_reset_required
      FROM app_user
      WHERE username_normalized = $1
      LIMIT 1
      `,
      [usernameNormalized]
    );

    const existingUser = existingUserResult.rows[0];

    if (existingUser) {
      await client.query(
        `
        UPDATE app_user
        SET
          username = $1,
          username_normalized = $2,
          password_hash = $3,
          full_name = $4,
          role_id = $5,
          is_active = TRUE,
          is_locked = FALSE,
          failed_login_attempts = 0,
          last_failed_login_at = NULL,
          locked_at = NULL,
          locked_reason = NULL,
          password_reset_required = FALSE,
          password_reset_code_hash = NULL,
          password_reset_expires_at = NULL,
          password_changed_at = NOW()
        WHERE id = $6
        `,
        [
          ADMIN_USERNAME,
          usernameNormalized,
          passwordHash,
          ADMIN_FULL_NAME,
          role.id,
          existingUser.id
        ]
      );

      await client.query(
        `
        INSERT INTO app_user_audit (
          user_id,
          action,
          old_data,
          new_data,
          changed_by_user_id
        )
        VALUES (
          $1::bigint,
          'SEED_ADMIN_UPDATE',
          $2::jsonb,
          jsonb_build_object(
            'username', $3::text,
            'username_normalized', $4::text,
            'full_name', $5::text,
            'role_key', $6::text,
            'is_active', true,
            'is_locked', false,
            'password_reset_required', false
          ),
          NULL
        )
        `,
        [
          existingUser.id,
          JSON.stringify({
            username: existingUser.username,
            username_normalized: existingUser.username_normalized,
            full_name: existingUser.full_name,
            role_id: existingUser.role_id,
            is_active: existingUser.is_active,
            is_locked: existingUser.is_locked,
            failed_login_attempts: existingUser.failed_login_attempts,
            password_reset_required: existingUser.password_reset_required
          }),
          ADMIN_USERNAME,
          usernameNormalized,
          ADMIN_FULL_NAME,
          ADMIN_ROLE_KEY
        ]
      );

      console.log(`[SEED] Usuario administrador actualizado: ${ADMIN_USERNAME}`);
    } else {
      const insertedUserResult = await client.query<{ id: string }>(
        `
        INSERT INTO app_user (
          username,
          username_normalized,
          password_hash,
          full_name,
          role_id,
          is_active,
          is_locked,
          failed_login_attempts,
          password_reset_required,
          password_changed_at
        )
        VALUES (
          $1::text,
          $2::text,
          $3::text,
          $4::text,
          $5::bigint,
          TRUE,
          FALSE,
          0,
          FALSE,
          NOW()
        )
        RETURNING id
        `,
        [
          ADMIN_USERNAME,
          usernameNormalized,
          passwordHash,
          ADMIN_FULL_NAME,
          role.id
        ]
      );

      const insertedUser = insertedUserResult.rows[0];

      await client.query(
        `
        INSERT INTO app_user_audit (
          user_id,
          action,
          old_data,
          new_data,
          changed_by_user_id
        )
        VALUES (
          $1::bigint,
          'SEED_ADMIN_CREATE',
          NULL,
          jsonb_build_object(
            'username', $2::text,
            'username_normalized', $3::text,
            'full_name', $4::text,
            'role_key', $5::text,
            'is_active', true,
            'is_locked', false,
            'password_reset_required', false
          ),
          NULL
        )
        `,
        [
          insertedUser.id,
          ADMIN_USERNAME,
          usernameNormalized,
          ADMIN_FULL_NAME,
          ADMIN_ROLE_KEY
        ]
      );

      console.log(`[SEED] Usuario administrador creado: ${ADMIN_USERNAME}`);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[SEED] Error creando usuario administrador.");
    throw error;
  } finally {
    client.release();
  }
}

seedAdminUser()
  .then(async () => {
    await closeDatabaseConnection();
    console.log("[SEED] Finalizado correctamente.");
  })
  .catch(async (error) => {
    await closeDatabaseConnection();
    console.error(error);
    process.exit(1);
  });