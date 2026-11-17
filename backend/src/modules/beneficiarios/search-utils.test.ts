import { describe, expect, it } from "vitest";
import { beneficiaryLikeExpression, beneficiaryLikeParameter, escapeLikePattern, likeExpression, likePattern, normalizeBeneficiarySearch, normalizeSearchTerm } from "./search-utils.js";

describe("beneficiary search normalization", () => {
  it("collapses surrounding and repeated spaces", () => {
    expect(normalizeBeneficiarySearch("  José   Álvarez  ")).toBe("José Álvarez");
  });

  it("escapes LIKE metacharacters without changing apostrophes or hyphens", () => {
    expect(escapeLikePattern("O'Neil_%-[x]\\test")).toBe("O'Neil\\_\\%-\\[x]\\\\test");
    expect(beneficiaryLikeParameter(" Jose ")).toBe("%Jose%");
  });

  it("produces an empty pattern for empty or whitespace-only input", () => {
    expect(likePattern("")).toBe("");
    expect(likePattern("   ")).toBe("");
  });

  it.each([
    ["Jose", "%Jose%"],
    ["Álvarez", "%Álvarez%"],
    ["Ñ", "%Ñ%"],
    ["Ana-María", "%Ana-María%"],
    ["O'Neil", "%O'Neil%"],
    ["%", "%\\%%"],
    ["_", "%\\_%"],
    ["\\", "%\\\\%"]
  ])("builds a literal partial-search pattern for %s", (term, expected) => {
    expect(likePattern(term)).toBe(expected);
  });

  it("accounts for worst-case expansion of a 150-character search term", () => {
    expect(likePattern("%".repeat(150))).toHaveLength(302);
  });

  it("uses accent-insensitive collation only when requested", () => {
    expect(likeExpression("p.nombre", true)).toContain("p.nombre COLLATE Modern_Spanish_CI_AI LIKE @search");
    expect(likeExpression("t.codigo")).toBe("t.codigo LIKE @search ESCAPE N'\\'");
    expect(beneficiaryLikeExpression("p.nombre")).toContain("Modern_Spanish_CI_AI");
    expect(normalizeSearchTerm("  Ana   María ")).toBe("Ana María");
  });
});
