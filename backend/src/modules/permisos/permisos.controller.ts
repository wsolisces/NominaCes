// ======================================================
// PATH: backend/src/modules/permisos/permisos.controller.ts
// Controladores HTTP del módulo Permisos
// ======================================================

/**
 * Responsabilidades:
 * - Recibir peticiones HTTP del módulo Permisos.
 * - Validar body con Zod.
 * - Pasar datos normalizados al service.
 * - Responder usando helpers HTTP compartidos.
 *
 * No debe:
 * - Ejecutar SQL.
 * - Aplicar reglas de negocio.
 * - Decidir estructura visual del frontend.
 */

import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../../shared/errors/AppError.js";
import { ok } from "../../shared/http/responses.js";

import * as permisosService from "./permisos.service.js";

/**
 * Schema para editar permisos.
 *
 * Reglas:
 * - permissionKey viene por URL.
 * - Solo se editan datos descriptivos y estado.
 */
const updatePermissionSchema = z.object({
  permissionName: z.string().min(1, "El nombre del permiso es obligatorio.").optional(),
  moduleKey: z.string().min(1, "El módulo es obligatorio.").optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

/**
 * Normaliza un parámetro de ruta de Express.
 *
 * Express/TypeScript puede tipar params como string | string[].
 * El sistema espera un único string para permissionKey.
 */
function getRouteParamAsString(
  value: string | string[] | undefined,
  paramName: string
): string {
  if (Array.isArray(value)) {
    const firstValue = value[0]?.trim();

    if (firstValue) {
      return firstValue;
    }
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  throw new AppError({
    statusCode: 400,
    code: "VALIDATION_ERROR",
    message: `El parámetro ${paramName} es obligatorio.`
  });
}

/**
 * Obtiene el id numérico del usuario autenticado.
 *
 * req.auth lo agrega authRequired.
 * Algunas implementaciones tipan el id como string aunque venga de BD.
 */
function getAuthUserId(req: Request): number | null {
  const rawUserId = req.auth?.user.id ?? null;

  if (rawUserId === null || rawUserId === undefined) {
    return null;
  }

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

/**
 * GET /permisos
 *
 * Lista permisos disponibles.
 */
export async function listPermissions(
  _req: Request,
  res: Response
): Promise<void> {
  const permissions = await permisosService.listPermissions();
  ok(res, permissions);
}

/**
 * GET /permisos/:permissionKey
 *
 * Consulta detalle de un permiso.
 */
export async function getPermission(
  req: Request,
  res: Response
): Promise<void> {
  const permissionKey = getRouteParamAsString(
    req.params.permissionKey,
    "permissionKey"
  );

  const permission = await permisosService.getPermissionByKey(permissionKey);

  ok(res, permission);
}

/**
 * PATCH /permisos/:permissionKey
 *
 * Edita metadata de un permiso.
 */
export async function updatePermission(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = updatePermissionSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos para editar permiso.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const permissionKey = getRouteParamAsString(
    req.params.permissionKey,
    "permissionKey"
  );

  const permission = await permisosService.updatePermission({
    permissionKey,
    ...parsed.data,
    changedByUserId: getAuthUserId(req)
  });

  ok(res, permission, "Permiso actualizado correctamente.");
}

/**
 * GET /permisos/:permissionKey/audit
 *
 * Lista auditoría de un permiso.
 */
export async function listPermissionAudit(
  req: Request,
  res: Response
): Promise<void> {
  const permissionKey = getRouteParamAsString(
    req.params.permissionKey,
    "permissionKey"
  );

  const audit = await permisosService.listPermissionAudit(permissionKey);

  ok(res, audit);
}