// ======================================================
// PATH: src/pages/Users/users.utils.ts
// Utilidades puras del módulo Usuarios
// ======================================================

/**
 * Responsabilidades:
 * - Normalizar respuestas del backend.
 * - Filtrar, ordenar y formatear usuarios.
 * - Convertir errores técnicos en mensajes entendibles.
 *
 * No debe:
 * - Ejecutar peticiones HTTP.
 * - Leer ni escribir estado de React.
 * - Renderizar JSX.
 */

import type { BadgeVariant } from "../../shared/ui";
import type { UserRoleOption, UserRow } from "./users.types";

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === "object" ? (value as RawRecord) : {};
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return fallback;
}

function asNullableString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "t", "yes", "si", "sí"].includes(normalized);
  }

  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

/**
 * Extrae la propiedad data si el backend responde con envoltura estándar.
 */
export function unwrapBackendData<T = unknown>(payload: unknown): T {
  const root = asRecord(payload);

  if ("data" in root) {
    return root.data as T;
  }

  return payload as T;
}

/**
 * Normaliza un usuario crudo del backend al contrato visual.
 */
export function normalizeUserRow(value: unknown): UserRow {
  const item = asRecord(value);
  const role = asRecord(item.role);

  return {
    id: asString(item.id ?? item.user_id ?? item.userId),
    username: asString(item.username),
    full_name: asString(item.full_name ?? item.fullName ?? item.name),
    role_id: asString(item.role_id ?? item.roleId ?? role.id),
    role_key: asString(item.role_key ?? item.roleKey ?? role.role_key),
    role_name: asString(item.role_name ?? item.roleName ?? role.role_name),
    is_active: asBoolean(item.is_active ?? item.isActive, true),
    is_locked: asBoolean(item.is_locked ?? item.isLocked, false),
    failed_login_attempts: asNumber(
      item.failed_login_attempts ?? item.failedLoginAttempts,
      0
    ),
    locked_reason: asNullableString(item.locked_reason ?? item.lockedReason),
    password_reset_required: asBoolean(
      item.password_reset_required ?? item.passwordResetRequired,
      false
    ),
    created_at: asNullableString(item.created_at ?? item.createdAt),
    updated_at: asNullableString(item.updated_at ?? item.updatedAt)
  };
}

/**
 * Normaliza un rol crudo del backend al contrato del select.
 */
export function normalizeRoleOption(value: unknown): UserRoleOption {
  const item = asRecord(value);

  return {
    id: asString(item.id ?? item.role_id ?? item.roleId),
    role_key: asString(item.role_key ?? item.roleKey),
    role_name: asString(item.role_name ?? item.roleName ?? item.name),
    is_active: asBoolean(item.is_active ?? item.isActive, true)
  };
}

/**
 * Extrae usuarios desde distintas formas posibles de respuesta.
 */
export function extractUsers(payload: unknown): UserRow[] {
  const data = unwrapBackendData(payload);

  if (Array.isArray(data)) {
    return data.map(normalizeUserRow);
  }

  const record = asRecord(data);
  const users = record.users ?? record.items ?? record.rows;

  return Array.isArray(users) ? users.map(normalizeUserRow) : [];
}

/**
 * Extrae roles desde distintas formas posibles de respuesta.
 */
export function extractRoles(payload: unknown): UserRoleOption[] {
  const data = unwrapBackendData(payload);

  if (Array.isArray(data)) {
    return data.map(normalizeRoleOption);
  }

  const record = asRecord(data);
  const roles = record.roles ?? record.items ?? record.rows;

  return Array.isArray(roles) ? roles.map(normalizeRoleOption) : [];
}

/**
 * Extrae resultado de código temporal.
 */
export function extractTemporaryCodeResult(payload: unknown) {
  const data = unwrapBackendData(payload);
  const record = asRecord(data);
  const userRecord = asRecord(record.user ?? record);
  const user = normalizeUserRow(userRecord);

  return {
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name
    },
    temporaryCode: asString(
      record.temporaryCode ?? record.temporary_code ?? record.code
    ),
    expiresAt: asString(record.expiresAt ?? record.expires_at)
  };
}

/**
 * Filtra usuarios por datos visibles.
 */
export function filterUsers(users: UserRow[], search: string): UserRow[] {
  const term = search.trim().toLowerCase();

  if (!term) return users;

  return users.filter((user) => {
    const values = [
      user.username,
      user.full_name,
      user.role_name,
      user.role_key,
      getUserStatusLabel(user)
    ];

    return values.some((value) => value.toLowerCase().includes(term));
  });
}

/**
 * Ordena usuarios priorizando estados que requieren atención.
 */
export function sortUsersForAdmin(users: UserRow[]): UserRow[] {
  return [...users].sort((a, b) => {
    if (a.is_locked !== b.is_locked) return a.is_locked ? -1 : 1;

    if (a.password_reset_required !== b.password_reset_required) {
      return a.password_reset_required ? -1 : 1;
    }

    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;

    return a.username.localeCompare(b.username, "es");
  });
}

/**
 * Devuelve etiqueta principal del estado.
 */
export function getUserStatusLabel(user: UserRow): string {
  if (!user.is_active) return "Inactivo";
  if (user.is_locked) return "Bloqueado";
  if (user.password_reset_required) return "Pendiente clave";
  return "Activo";
}

/**
 * Devuelve variante oficial del Badge reutilizable.
 */
export function getUserStatusVariant(user: UserRow): BadgeVariant {
  if (!user.is_active) return "muted";
  if (user.is_locked) return "danger";
  if (user.password_reset_required) return "warning";
  return "success";
}

/**
 * Formatea fechas para vista administrativa.
 */
export function formatDateTime(value: string | null): string {
  if (!value) return "Sin registro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

/**
 * Convierte errores técnicos en mensaje para usuario.
 */
export function getFriendlyError(error: unknown): string {
  const record = asRecord(error);
  const status = asNumber(record.status, -1);
  const message = asString(record.message);

  if (status === 0) {
    return "No fue posible conectar con el servidor.";
  }

  if (status === 401) {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }

  if (status === 403) {
    return "No tienes permisos para administrar usuarios.";
  }

  if (message) {
    return message;
  }

  return "No fue posible completar la operación.";
}