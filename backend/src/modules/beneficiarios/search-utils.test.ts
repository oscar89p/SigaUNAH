import { describe, expect, it } from "vitest";
import { beneficiaryLikeParameter, escapeLikePattern, normalizeBeneficiarySearch } from "./search-utils.js";

describe("beneficiary search normalization", () => {
  it("collapses surrounding and repeated spaces", () => {
    expect(normalizeBeneficiarySearch("  José   Álvarez  ")).toBe("José Álvarez");
  });

  it("escapes LIKE metacharacters without changing apostrophes or hyphens", () => {
    expect(escapeLikePattern("O'Neil_%-[x]\\test")).toBe("O'Neil\\_\\%-\\[x]\\\\test");
    expect(beneficiaryLikeParameter(" Jose ")).toBe("%Jose%");
  });
});
