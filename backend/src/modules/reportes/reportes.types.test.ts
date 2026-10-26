import { describe, expect, it } from "vitest";
import { assignmentReportQuerySchema, beneficiaryReportQuerySchema, cardReportQuerySchema, historyReportQuerySchema, reportQuerySchema, requestReportQuerySchema } from "./reportes.types.js";

describe("report query contracts", () => {
  it("defaults to all records and accepts applicable filters", () => {
    expect(reportQuerySchema.parse({})).toEqual({ estado: "all" });
    expect(reportQuerySchema.parse({ idCampus: "2", idEdificio: "3", idTipoBeneficiario: "4", desde: "2026-01-01", hasta: "2026-01-31" })).toMatchObject({ idCampus: 2, idEdificio: 3, idTipoBeneficiario: 4 });
  });

  it("rejects invalid dates and states", () => {
    expect(reportQuerySchema.safeParse({ desde: "2026-02-01", hasta: "2026-01-01" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ estado: "unknown" }).success).toBe(false);
  });

  it("validates detailed report filters and defaults", () => {
    expect(beneficiaryReportQuerySchema.parse({ idTipoCondicion: "4", page: "2" })).toMatchObject({ page: 2, pageSize: 10, estado: "all", idTipoCondicion: 4 });
    expect(requestReportQuerySchema.parse({ codigoEstadoSolicitud: "APROBADA", idBeneficiario: "42", sinAsignacion: "true" })).toMatchObject({ codigoEstadoSolicitud: "APROBADA", idBeneficiario: 42n, sinAsignacion: true });
    expect(cardReportQuerySchema.parse({ disponibilidad: "available", idTipoTarjeta: "3" })).toMatchObject({ disponibilidad: "available", idTipoTarjeta: 3 });
    expect(assignmentReportQuerySchema.parse({ estado: "proximas", proximasDias: "15" })).toMatchObject({ estado: "proximas", proximasDias: 15 });
    expect(historyReportQuerySchema.parse({ tipoMovimiento: "tarjeta", desde: "2026-01-01", hasta: "2026-01-31" })).toMatchObject({ tipoMovimiento: "tarjeta" });
  });

  it("rejects invalid detailed report filters", () => {
    expect(beneficiaryReportQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(requestReportQuerySchema.safeParse({ hasta: "2026-01-01", desde: "2026-02-01" }).success).toBe(false);
    expect(cardReportQuerySchema.safeParse({ disponibilidad: "unknown" }).success).toBe(false);
    expect(assignmentReportQuerySchema.safeParse({ proximasDias: 0 }).success).toBe(false);
    expect(historyReportQuerySchema.safeParse({ tipoMovimiento: "unknown" }).success).toBe(false);
  });
});
