import { describe, expect, it } from "vitest";
import { inputSchema, querySchema } from "./periodos-academicos.types.js";

const validPeriod = {
  codigoPeriodoAcademico: "2026-1",
  nombrePeriodoAcademico: "Primer período académico 2026",
  fechaInicioPeriodoAcademico: "2026-01-15",
  fechaFinPeriodoAcademico: "2026-06-30",
  estadoPeriodoAcademico: true
};

describe("academic period contracts", () => {
  it("accepts a valid period and defaults administrative state", () => {
    const result = inputSchema.parse({ ...validPeriod, estadoPeriodoAcademico: undefined });
    expect(result.estadoPeriodoAcademico).toBe(true);
  });

  it("rejects a period whose final date precedes its start date", () => {
    expect(inputSchema.safeParse({ ...validPeriod, fechaFinPeriodoAcademico: "2025-12-31" }).success).toBe(false);
  });

  it("preserves paginated list defaults", () => {
    const query = querySchema.parse({});
    expect(query.page).toBe(1);
    expect(query.pageSize).toBe(10);
    expect(query.estado).toBe("all");
  });
});
