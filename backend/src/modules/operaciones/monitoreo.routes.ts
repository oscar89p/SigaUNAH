import type { FastifyPluginAsync } from "fastify";
import * as service from "./monitoreo.service.js";
import { accessQuerySchema, incidentQuerySchema } from "./monitoreo.types.js";

export const monitoreoRoutes: FastifyPluginAsync = async app => {
  app.get("/api/v1/operaciones/monitoreo/accesos", async request => service.listAccessEvents(accessQuerySchema.parse(request.query)));
  app.get("/api/v1/operaciones/monitoreo/incidentes", async request => service.listIncidents(incidentQuerySchema.parse(request.query)));
};
