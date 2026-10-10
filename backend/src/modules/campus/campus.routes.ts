import type { FastifyPluginAsync } from "fastify";

import * as service from "./campus.service.js";
import { campusCreateSchema, campusIdSchema, campusQuerySchema, campusStateSchema, campusUpdateSchema } from "./campus.types.js";

export const campusRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/campus", async (request) => {
    return service.list(campusQuerySchema.parse(request.query));
  });

  app.get("/api/v1/campus/:id", async (request) => {
    const { id } = campusIdSchema.parse(request.params);
    return service.get(id);
  });

  app.post("/api/v1/campus", async (request, reply) => {
    const campus = await service.create(campusCreateSchema.parse(request.body));
    return reply.status(201).send(campus);
  });

  app.put("/api/v1/campus/:id", async (request) => {
    const { id } = campusIdSchema.parse(request.params);
    return service.update(id, campusUpdateSchema.parse(request.body));
  });

  app.patch("/api/v1/campus/:id/estado", async (request) => {
    const { id } = campusIdSchema.parse(request.params);
    return service.updateState(id, campusStateSchema.parse(request.body));
  });
};
