import type { FastifyPluginAsync } from "fastify";

import type { AuthenticatedRequest } from "../auth/auth-context.js";
import * as service from "./navegacion.service.js";

export const navegacionRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/seguridad/mi-navegacion", async (request) => {
    const { idUsuario } = (request as AuthenticatedRequest).auth;
    return service.getForUser(idUsuario);
  });
};
