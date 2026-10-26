import type { FastifyPluginAsync } from "fastify";
import * as service from "./reportes.service.js";
import { assignmentReportQuerySchema, beneficiaryReportQuerySchema, cardReportQuerySchema, historyReportQuerySchema, reportExportFormatSchema, reportExportParamsSchema, reportQuerySchema, requestReportQuerySchema } from "./reportes.types.js";

export const reportesRoutes: FastifyPluginAsync = async app => {
  app.get("/api/v1/reportes/opciones", async () => service.options());
  app.get("/api/v1/reportes/resumen", async request => service.summary(reportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/beneficiarios", async request => service.beneficiaries(beneficiaryReportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/solicitudes", async request => service.requests(requestReportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/tarjetas", async request => service.cards(cardReportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/asignaciones", async request => service.assignments(assignmentReportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/historial", async request => service.history(historyReportQuerySchema.parse(request.query)));
  app.get("/api/v1/reportes/:tipo/exportar", async (request, reply) => {
    const { tipo } = reportExportParamsSchema.parse(request.params);
    const rawQuery = request.query as Record<string, unknown>;
    const { formato } = reportExportFormatSchema.parse({ formato: rawQuery.formato });
    const filters = { ...rawQuery };
    delete filters.formato;
    const query = tipo === "beneficiarios" ? beneficiaryReportQuerySchema.parse(filters)
      : tipo === "solicitudes" ? requestReportQuerySchema.parse(filters)
        : tipo === "tarjetas" ? cardReportQuerySchema.parse(filters)
          : tipo === "asignaciones" ? assignmentReportQuerySchema.parse(filters)
            : historyReportQuerySchema.parse(filters);
    const result = await service.exportDetailed(tipo, formato, query);
    return reply.header("Content-Type", result.contentType).header("Content-Disposition", `attachment; filename="${result.fileName}"`).header("Content-Length", result.content.length).send(result.content);
  });
  app.get("/api/v1/reportes/exportar", async (request, reply) => {
    const csv = await service.exportSummary(reportQuerySchema.parse(request.query));
    return reply.header("Content-Type", "text/csv; charset=utf-8").header("Content-Disposition", "attachment; filename=reportes-siga.csv").send(csv);
  });
};
