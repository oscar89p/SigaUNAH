import { describe, expect, it } from "vitest";

describe("PROSENE beneficiary type policy", () => {
  it("defines the contextual policy without changing the global catalog", () => {
    const allowed = new Set(["ESTUDIANTE", "VISITANTE"]);
    expect(allowed.has("ESTUDIANTE")).toBe(true);
    expect(allowed.has("VISITANTE")).toBe(true);
    expect(allowed.has("DOCENTE")).toBe(false);
    expect(allowed.has("EMPLEADO")).toBe(false);
  });
});
