import type { FastifyPluginAsync } from "fastify";

import * as service from "./beneficiarios.service.js";
import { conditionIdsSchema, conditionQuerySchema, conditionSchema, createSchema, idSchema, querySchema, searchSchema, stateSchema, updateSchema } from "./beneficiarios.types.js";

export const beneficiariosRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/beneficiarios", async (request) => service.list(querySchema.parse(request.query)));
  app.get("/api/v1/beneficiarios/busqueda", async (request) => service.search(searchSchema.parse(request.query)));
  app.get("/api/v1/beneficiarios/opciones", async () => service.options());
  app.get("/api/v1/beneficiarios/condiciones/opciones", async () => service.conditionOptions());
  app.get("/api/v1/beneficiarios/:id/condiciones", async (request) => { const params = idSchema.parse(request.params); return service.conditions(params.id, conditionQuerySchema.parse(request.query)); });
  app.post("/api/v1/beneficiarios/:id/condiciones", async (request, reply) => { const params = idSchema.parse(request.params); return reply.status(201).send(await service.createCondition(params.id, conditionSchema.parse(request.body), (request as import("../auth/auth-context.js").AuthenticatedRequest).auth)); });
  app.put("/api/v1/beneficiarios/:id/condiciones/:idCondicion", async request => { const params = conditionIdsSchema.parse(request.params); return service.updateCondition(params.id, params.idCondicion, conditionSchema.parse(request.body), (request as import("../auth/auth-context.js").AuthenticatedRequest).auth); });
  app.patch("/api/v1/beneficiarios/:id/condiciones/:idCondicion/estado", async request => { const params = conditionIdsSchema.parse(request.params); return service.conditionState(params.id, params.idCondicion, stateSchema.parse(request.body).estadoBeneficiario, (request as import("../auth/auth-context.js").AuthenticatedRequest).auth); });
  app.get("/api/v1/beneficiarios/:id", async (request) => service.get(idSchema.parse(request.params).id));
  app.post("/api/v1/beneficiarios", async (request, reply) => reply.status(201).send(await service.create(createSchema.parse(request.body))));
  app.put("/api/v1/beneficiarios/:id", async (request) => service.update(idSchema.parse(request.params).id, updateSchema.parse(request.body)));
  app.patch("/api/v1/beneficiarios/:id/estado", async (request) => service.state(idSchema.parse(request.params).id, stateSchema.parse(request.body)));
};
