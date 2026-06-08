// ======================================================
// PATH: backend/src/modules/permisos/permisos.controller.ts
// Controlador HTTP del módulo de permisos
// ======================================================

/**
 * Responsabilidades:
 * - Recibir solicitudes HTTP del catálogo de permisos.
 * - Normalizar parámetros provenientes de Express.
 * - Delegar reglas de negocio al service.
 * - Responder con un formato consistente.
 *
 * No debe:
 * - Ejecutar SQL directamente.
 * - Crear conexiones a PostgreSQL.
 * - Duplicar validaciones profundas del service.
 */

import type { Request, Response } from "express";

import {
  activatePermissionService,
  createPermissionService,
  deactivatePermissionService,
  deletePermissionService,
  getPermissionByIdService,
  listPermissionsService,
  updatePermissionService
} from "./permisos.service.js";

import { PermissionDomainError } from "./permisos.types.js";

function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  const normalized = asString(value);

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
}

function sendError(res: Response, error: unknown): void {
  if (error instanceof PermissionDomainError) {
    res.status(error.statusCode).json({
      ok: false,
      code: error.code,
      message: error.message
    });

    return;
  }

  console.error("[permisos.controller] Error no controlado:", error);

  res.status(500).json({
    ok: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocurrió un error interno al procesar la solicitud."
  });
}

/**
 * GET /permisos
 * Lista permisos con filtros opcionales.
 */
export async function listPermissionsController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permissions = await listPermissionsService({
      search: asString(req.query.search),
      module_key: asString(req.query.module_key),
      is_active: asBoolean(req.query.is_active)
    });

    res.status(200).json({
      ok: true,
      data: permissions
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /permisos/:id
 * Obtiene un permiso por id.
 */
export async function getPermissionByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const permission = await getPermissionByIdService(req.params.id);

    res.status(200).json({
      ok: true,
      data: permission
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /permisos
 * Crea un permiso.
 */
export async function createPermissionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await createPermissionService(req.body);

    res.status(201).json({
      ok: true,
      data: result.permission,
      message: "Permiso creado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PUT /permisos/:id
 * Actualiza un permiso.
 */
export async function updatePermissionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await updatePermissionService(req.params.id, req.body);

    res.status(200).json({
      ok: true,
      data: result.permission,
      message: "Permiso actualizado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /permisos/:id/activate
 * Activa un permiso.
 */
export async function activatePermissionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await activatePermissionService(req.params.id);

    res.status(200).json({
      ok: true,
      data: result.permission,
      message: "Permiso activado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /permisos/:id/deactivate
 * Desactiva un permiso.
 */
export async function deactivatePermissionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await deactivatePermissionService(req.params.id);

    res.status(200).json({
      ok: true,
      data: result.permission,
      message: "Permiso desactivado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * DELETE /permisos/:id
 * Elimina un permiso.
 */
export async function deletePermissionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    await deletePermissionService(req.params.id);

    res.status(200).json({
      ok: true,
      message: "Permiso eliminado correctamente."
    });
  } catch (error) {
    sendError(res, error);
  }
}