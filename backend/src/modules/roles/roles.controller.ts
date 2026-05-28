// ======================================================
// PATH: backend/src/modules/roles/roles.controller.ts
// Módulo: Roles
// Archivo: Controller
// ------------------------------------------------------
// Conecta Express con el service.
//
// Responsabilidades:
// - Leer params/body.
// - Llamar service.
// - Responder JSON con el formato esperado.
// ======================================================

import type { Request, Response } from "express";
import {
  activateRole,
  createRole,
  deactivateRole,
  getRole,
  listRoles,
  updateRole,
} from "./roles.service.js";

type HttpError = Error & {
  statusCode?: number;
  code?: string;
};

function getIdParam(req: Request): number {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw Object.assign(new Error("ID inválido"), {
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  }

  return id;
}

function sendError(res: Response, error: unknown): void {
  const err = error as HttpError;

  res.status(err.statusCode ?? 500).json({
    ok: false,
    error: {
      code: err.code ?? "INTERNAL_ERROR",
      message: err.message || "Error interno del servidor",
    },
  });
}

/**
 * GET /roles
 */
export async function listRolesController(_req: Request, res: Response): Promise<void> {
  try {
    const roles = await listRoles();

    res.status(200).json({
      ok: true,
      data: {
        roles,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * GET /roles/:id
 */
export async function getRoleController(req: Request, res: Response): Promise<void> {
  try {
    const role = await getRole(getIdParam(req));

    if (!role) {
      res.status(404).json({
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "Rol no encontrado",
        },
      });
      return;
    }

    res.status(200).json({
      ok: true,
      data: {
        role,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /roles
 */
export async function createRoleController(req: Request, res: Response): Promise<void> {
  try {
    const role = await createRole(req.body);

    res.status(201).json({
      ok: true,
      data: {
        role,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * PATCH /roles/:id
 */
export async function updateRoleController(req: Request, res: Response): Promise<void> {
  try {
    const role = await updateRole(getIdParam(req), req.body);

    res.status(200).json({
      ok: true,
      data: {
        role,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /roles/:id/deactivate
 */
export async function deactivateRoleController(req: Request, res: Response): Promise<void> {
  try {
    const role = await deactivateRole(getIdParam(req));

    res.status(200).json({
      ok: true,
      data: {
        role,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

/**
 * POST /roles/:id/activate
 */
export async function activateRoleController(req: Request, res: Response): Promise<void> {
  try {
    const role = await activateRole(getIdParam(req));

    res.status(200).json({
      ok: true,
      data: {
        role,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}