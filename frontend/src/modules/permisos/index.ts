// ======================================================
// PATH: src/modules/permisos/index.ts
// Exportaciones públicas del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Centralizar exportaciones del módulo.
 * - Evitar imports largos desde router o layout.
 *
 * No debe:
 * - Ejecutar lógica de negocio.
 * - Renderizar componentes por sí mismo.
 */

export { default as PermisosPage } from "./PermisosPage";

export type {
  PermissionAuditDto,
  PermissionDto,
  PermissionFormState,
  PermissionsSummary,
  UpdatePermissionPayload
} from "./permisos.types";