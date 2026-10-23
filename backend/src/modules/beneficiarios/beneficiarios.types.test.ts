import { describe, expect, it } from "vitest";
import { conditionIdsSchema, conditionQuerySchema, conditionSchema } from "./beneficiarios.types.js";

describe("beneficiary condition contracts", () => {
  it("validates pagination, positive identifiers and date ranges", () => {
    expect(conditionQuerySchema.parse({}).pageSize).toBe(10);
    expect(conditionIdsSchema.safeParse({ id: "10", idCondicion: "20" }).success).toBe(true);
    expect(conditionSchema.safeParse({ idTipoCondicion: 1, fechaInicio: "2026-02-01", fechaFinEstimada: "2026-01-01" }).success).toBe(false);
  });

  it("requires a positive catalog type", () => {
    expect(conditionSchema.safeParse({ idTipoCondicion: 0 }).success).toBe(false);
  });
});
