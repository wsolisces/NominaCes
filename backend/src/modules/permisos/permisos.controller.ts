// ======================================================
// PATH: backend/src/modules/permisos/permisos.controller.ts
// Controladores HTTP del módulo Permisos
// ======================================================

import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../../shared/errors/AppError.js";
import { created, ok } from "../../shared/http/responses.js";
import * as permisosService from "./permisos.service.js";

/**
 * Schema para crear permisos.
 *
 * Responsabilidades:
 * - Validar datos mínimos antes de llegar al service.
 * - Evitar que payloads incompletos entren a reglas de negocio.
 *
 * No debe:
 * - Consultar BD.
 * - Normalizar claves técnicas.
 * - Aplicar permisos de autorización.
 */
const createPermissionSchema = z.object({
  permissionKey: z.string().min(1, "La clave del permiso es obligatoria."),
  permissionName: z.string().min(1, "El nombre del permiso es obligatorio."),
  moduleKey: z.string().min(1, "El módulo es obligatorio."),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

/**
 * Schema para editar permisos.
 *
 * Reglas:
 * - permissionKey viene por URL.
 * - Solo se editan datos descriptivos y estado.
 */
const updatePermissionSchema = z.object({
  permissionName: z.string().min(1).optional(),
  moduleKey: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});

/**
 * Normaliza un parámetro de ruta de Express.
 *
 * Express/TypeScript puede tipar params como string | string[].
 * El sistema espera un único string para permissionKey.
 *
 * No debe:
 * - Aplicar reglas de negocio del permiso.
 * - Consultar base de datos.
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
 * POST /permisos
 *
 * Crea un permiso técnico nuevo.
 */
export async function createPermission(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createPermissionSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Datos inválidos para crear permiso.",
      details: parsed.error.flatten().fieldErrors
    });
  }

  const permission = await permisosService.createPermission(parsed.data);

  created(res, permission, "Permiso creado correctamente.");
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
    ...parsed.data
  });

  ok(res, permission, "Permiso actualizado correctamente.");
}