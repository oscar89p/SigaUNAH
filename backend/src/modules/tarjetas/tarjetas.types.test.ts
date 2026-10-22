import { describe, expect, it } from "vitest";
import { availabilityDiagnosticsQuery } from "./tarjetas.repository.js";
import { assignmentQuerySchema, createAssignmentSchema, querySchema, renewAssignmentSchema, returnAssignmentSchema } from "./tarjetas.types.js";

describe("tarjetas assignment contracts", () => {
  it("accepts bigint identifiers encoded by HTTP as strings", () => {
    const result = createAssignmentSchema.safeParse({ idSolicitud: "10", idBeneficiario: "20", idTarjeta: "30", idTipoVigencia: 1, idEstadoAsignacion: 2, fechaInicioVigencia: "2026-01-01" });
    expect(result.success).toBe(true);
  });

  it("does not invent filters and defaults history to false", () => {
    expect(assignmentQuerySchema.parse({}).historial).toBe(false);
    expect(assignmentQuerySchema.safeParse({ idTarjeta: 0 }).success).toBe(false);
  });

  it("accepts the backend card-list state filter", () => {
    expect(querySchema.parse({ estado: "active" }).estado).toBe("active");
    expect(querySchema.safeParse({ estado: "unknown" }).success).toBe(false);
  });

  it("requires a reason when renewing an assignment", () => {
    expect(renewAssignmentSchema.safeParse({ fechaInicioVigencia: "2026-01-01", motivoCambio: "" , usuario: "operator" }).success).toBe(false);
  });

  it("requires the target assignment state and reason when returning a card", () => {
    expect(returnAssignmentSchema.safeParse({ idEstadoAsignacionNuevo: 4, motivoCambio: "Devolución autorizada", usuario: "operator" }).success).toBe(true);
    expect(returnAssignmentSchema.safeParse({ idEstadoAsignacionNuevo: 4, motivoCambio: "", usuario: "operator" }).success).toBe(false);
  });

  it("keeps EXISTS outside aggregate expressions in the SQL Server diagnostic query", () => {
    const aggregateExpressions = availabilityDiagnosticsQuery.match(/SUM\s*\(CASE[\s\S]*?END\)/gi) ?? [];
    expect(aggregateExpressions.length).toBeGreaterThan(0);
    expect(aggregateExpressions.some(expression => /EXISTS|NOT\s+EXISTS/i.test(expression))).toBe(false);
    expect(availabilityDiagnosticsQuery).toContain("tieneAsignacionVigente");
  });
});
