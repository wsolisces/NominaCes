// ======================================================
// PATH: backend\src\shared\types\express.d.ts
// Extensión de tipos de Express para req.auth
// ======================================================

import type { AuthenticatedUser } from "../../modules/login/login.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sessionId: string;
        user: AuthenticatedUser;
        fortiaToken: string;
      };
    }
  }
}

export {};