// ======================================================
// PATH: backend/src/modules/roles/roles.controller.ts
// Controladores HTTP del módulo Roles
// ======================================================

/**
 * Responsabilidades:
 * - Leer parámetros y body de Express.
 * - Validar parámetros básicos de las rutas.
 * - Llamar al service del módulo.
 * - Responder usando el formato estándar del backend.
 *
 * No debe:
 * - Ejecutar consultas SQL.
 * - Validar cookies o permisos.
 * - Aplicar reglas de negocio complejas.
 * - Repetir try/catch; eso lo realiza asyncHandler.
 */

import type { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError.js";
import { created, ok } from "../../shared/http/responses.js";

import * as rolesService from "./roles.service.js";

/**
 * Obtiene y valida el id del rol recibido en params.
 */
function getRoleIdParam(req: Request): number {
  const rawId = req.params.id;

  const normalizedId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const id = Number(normalizedId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "El id del rol es inválido."
    });
  }

  return id;
}

/**
 * GET /roles
 *
 * Lista todos los roles.
 */
export async function listRoles(
  _req: Request,
  res: Response
): Promise<void> {
  const roles = await rolesService.listRoles();

  ok(res, {
    roles
  });
}

/**
 * GET /roles/:id
 *
 * Consulta el detalle de un rol.
 */
export async function getRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.getRole(
    getRoleIdParam(req)
  );

  if (!role) {
    throw new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Rol no encontrado."
    });
  }

  ok(res, {
    role
  });
}

/**
 * POST /roles
 *
 * Crea un rol nuevo.
 */
export async function createRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.createRole(req.body);

  created(
    res,
    {
      role
    },
    "Rol creado correctamente."
  );
}

/**
 * PATCH /roles/:id
 *
 * Modifica un rol existente.
 */
export async function updateRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.updateRole(
    getRoleIdParam(req),
    req.body
  );

  ok(
    res,
    {
      role
    },
    "Rol actualizado correctamente."
  );
}

/**
 * POST /roles/:id/deactivate
 *
 * Desactiva un rol.
 */
export async function deactivateRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.deactivateRole(
    getRoleIdParam(req)
  );

  ok(
    res,
    {
      role
    },
    "Rol desactivado correctamente."
  );
}

/**
 * POST /roles/:id/activate
 *
 * Activa un rol.
 */
export async function activateRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.activateRole(
    getRoleIdParam(req)
  );

  ok(
    res,
    {
      role
    },
    "Rol activado correctamente."
  );
}

/**
 * DELETE /roles/:id
 *
 * Elimina permanentemente un rol sin usuarios asignados.
 */
export async function deleteRole(
  req: Request,
  res: Response
): Promise<void> {
  const role = await rolesService.deleteRole(
    getRoleIdParam(req)
  );

  ok(
    res,
    {
      role
    },
    "Rol eliminado correctamente."
  );
}