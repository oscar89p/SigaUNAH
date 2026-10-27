import { describe, expect, it } from "vitest";

import { classifyPendingPriority } from "./alertas.types.js";

describe("classifyPendingPriority", () => {
  it.each([[2, "INFORMATIVA"], [3, "MEDIA"], [7, "MEDIA"], [8, "ALTA"]] as const)("clasifica %s días como %s", (days, expected) => {
    expect(classifyPendingPriority(days, 3, 7)).toBe(expected);
  });
});
