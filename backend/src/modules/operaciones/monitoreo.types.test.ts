import { describe, expect, it } from "vitest";
import { accessQuerySchema, incidentQuerySchema } from "./monitoreo.types.js";

describe("operational monitoring query contracts", () => {
  it("defaults to descending paginated access-event queries", () => {
    expect(accessQuerySchema.parse({}).pageSize).toBe(10);
    expect(accessQuerySchema.parse({ page: 2, pageSize: 50 }).page).toBe(2);
    expect(accessQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it("validates date ranges and incident resolution filters", () => {
    expect(incidentQuerySchema.parse({ resuelto: "open" }).resuelto).toBe("open");
    expect(incidentQuerySchema.safeParse({ desde: "2026-05-03", hasta: "2026-05-02" }).success).toBe(false);
    expect(incidentQuerySchema.safeParse({ resuelto: "maybe" }).success).toBe(false);
  });
});
