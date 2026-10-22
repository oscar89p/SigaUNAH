import type { FastifyPluginAsync } from "fastify";

import type { AuthenticatedRequest } from "../auth/auth-context.js";
import * as service from "./usuarios.service.js";
import { createSchema, idSchema, querySchema, stateSchema, updateSchema } from "./usuarios.types.js";

function context(request: AuthenticatedRequest) {
  return { actorId: request.auth.idUsuario, actorName: request.auth.nombreAcceso, ip: request.ip, agent: request.headers["user-agent"] as string | undefined, permissions: request.auth.permisos };
}

export const usuariosRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/seguridad/usuarios", async (request) => service.list(querySchema.parse(request.query)));
  app.get("/api/v1/seguridad/usuarios/:id", async (request) => service.get(idSchema.parse(request.params).id));
  app.post("/api/v1/seguridad/usuarios", async (request, reply) => reply.status(201).send(await service.create(createSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put("/api/v1/seguridad/usuarios/:id", async (request) => service.update(idSchema.parse(request.params).id, updateSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch("/api/v1/seguridad/usuarios/:id/estado", async (request) => service.state(idSchema.parse(request.params).id, stateSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.get("/api/v1/seguridad/perfiles", async () => service.profiles());
};
