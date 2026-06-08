// ======================================================
// PATH: backend/src/modules/roles/roles.controller.ts
// Controlador del módulo de roles
// ======================================================

/**
 * Responsabilidades:
 * - Recibir peticiones HTTP del módulo de roles.
 * - Delegar reglas de negocio al servicio.
 * - Responder con formato JSON consistente.
 *
 * No debe:
 * - Ejecutar SQL.
 * - Contener reglas de protección de SOPORTE.
 * - Manipular directamente la base de datos.
 */

import type { Request, Response } from "express";

import {
  changeRoleStatusService,
  createRoleService,
  getRoleAuditService,
  getRoleDetailService,
  listRolesService,
  updateRoleService,
} from "./roles.service.js";

/**
 * Obtiene el usuario actor desde middlewares de autenticación.
 */
function getActorUserId(request: Request): string | null {
  const requestWithUser = request as Request & {
    user?: { id?: string | number };
    authUser?: { id?: string | number };
  };

  const id = requestWithUser.user?.id ?? requestWithUser.authUser?.id;

  return id === undefined || id === null ? null : String(id);
}


/**
 * Obtiene un parámetro de ruta como string simple.
 */
function getRouteParam(
  request: Request,
  paramName: string
): string {
  const value = request.params[paramName];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

/**
 * Responde errores de forma consistente.
 */
function handleControllerError(response: Response, error: unknown): void {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  const message =
    error instanceof Error ? error.message : "Error interno del servidor.";

  response.status(statusCode).json({
    ok: false,
    message,
  });
}

/**
 * Lista roles.
 */
export async function listRolesController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const roles = await listRolesService({
      search: String(request.query.search ?? ""),
      status: request.query.status as never,
    });

    response.json({
      ok: true,
      data: roles,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}

/**
 * Obtiene detalle de rol.
 */
export async function getRoleDetailController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const role = await getRoleDetailService(getRouteParam(request, "id"));

    response.json({
      ok: true,
      data: role,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}

/**
 * Crea rol.
 */
export async function createRoleController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const role = await createRoleService(request.body, getActorUserId(request));

    response.status(201).json({
      ok: true,
      data: role,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}

/**
 * Actualiza rol.
 */
export async function updateRoleController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const role = await updateRoleService(
      getRouteParam(request, "id"),
      request.body,
      getActorUserId(request)
    );

    response.json({
      ok: true,
      data: role,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}

/**
 * Cambia estado de rol.
 */
export async function changeRoleStatusController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const role = await changeRoleStatusService(
      getRouteParam(request, "id"),
      request.body,
      getActorUserId(request)
    );

    response.json({
      ok: true,
      data: role,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}

/**
 * Obtiene auditoría de rol.
 */
export async function getRoleAuditController(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const audit = await getRoleAuditService(getRouteParam(request, "id"));

    response.json({
      ok: true,
      data: audit,
    });
  } catch (error) {
    handleControllerError(response, error);
  }
}