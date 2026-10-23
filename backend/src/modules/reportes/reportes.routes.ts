import type { FastifyPluginAsync } from "fastify";
import * as service from "./reportes.service.js";
import { reportQuerySchema } from "./reportes.types.js";

export const reportesRoutes: FastifyPluginAsync = async app => {
  app.get("/api/v1/reportes/opciones", async () => service.options());
  app.get("/api/v1/reportes/resumen", async request => service.summary(reportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/exportar", async (request, reply) => {
    const csv = await service.exportSummary(reportQuerySchema.parse(request.query));
    return reply.header("Content-Type", "text/csv; charset=utf-8").header("Content-Disposition", "attachment; filename=reportes-siga.csv").send(csv);
  });
};
