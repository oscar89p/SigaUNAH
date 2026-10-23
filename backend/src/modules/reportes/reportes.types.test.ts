import { describe, expect, it } from "vitest";
import { reportQuerySchema } from "./reportes.types.js";

describe("report query contracts", () => {
  it("defaults to all records and accepts applicable filters", () => {
    expect(reportQuerySchema.parse({})).toEqual({ estado: "all" });
    expect(reportQuerySchema.parse({ idCampus: "2", idEdificio: "3", idTipoBeneficiario: "4", desde: "2026-01-01", hasta: "2026-01-31" })).toMatchObject({ idCampus: 2, idEdificio: 3, idTipoBeneficiario: 4 });
  });

  it("rejects invalid dates and states", () => {
    expect(reportQuerySchema.safeParse({ desde: "2026-02-01", hasta: "2026-01-01" }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ estado: "unknown" }).success).toBe(false);
  });
});
