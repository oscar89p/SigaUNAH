import type { FastifyPluginAsync } from "fastify";

import * as service from "./solicitudes.service.js";
import { createSchema, idSchema, querySchema, stateSchema, updateSchema } from "./solicitudes.types.js";
import type { AuthenticatedRequest } from "../auth/auth-context.js";

export const solicitudesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/solicitudes", async (request) => service.list(querySchema.parse(request.query)));
  app.get("/api/v1/solicitudes/opciones", async () => service.options());
  app.get("/api/v1/solicitudes/:id", async (request) => service.get(idSchema.parse(request.params).id));
  app.post("/api/v1/solicitudes", async (request, reply) => reply.status(201).send(await service.create(createSchema.parse(request.body), (request as AuthenticatedRequest).auth)));
  app.put("/api/v1/solicitudes/:id", async (request) => service.update(idSchema.parse(request.params).id, updateSchema.parse(request.body)));
  app.patch("/api/v1/solicitudes/:id/estado", async (request) => service.state(idSchema.parse(request.params).id, stateSchema.parse(request.body), (request as AuthenticatedRequest).auth));
};
