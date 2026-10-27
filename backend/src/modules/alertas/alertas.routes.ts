import type { FastifyPluginAsync } from "fastify";

import * as service from "./alertas.service.js";
import { alertQuerySchema } from "./alertas.types.js";

export const alertasRoutes: FastifyPluginAsync = async app => {
  app.get("/api/v1/alertas/resumen", async () => service.summary());
  app.get("/api/v1/alertas/solicitudes-pendientes", async request => service.listPending(alertQuerySchema.parse(request.query)));
  app.get("/api/v1/alertas/aprobadas-sin-asignacion", async request => service.listApprovedWithoutAssignment(alertQuerySchema.parse(request.query)));
  app.get("/api/v1/alertas/asignaciones-proximas", async request => service.listUpcoming(alertQuerySchema.parse(request.query)));
  app.get("/api/v1/alertas/asignaciones-vencidas", async request => service.listExpired(alertQuerySchema.parse(request.query)));
  app.get("/api/v1/alertas/inconsistencias", async request => service.listInconsistencies(alertQuerySchema.parse(request.query)));
};
