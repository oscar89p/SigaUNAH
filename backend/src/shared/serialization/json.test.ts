import { describe, expect, it } from "vitest";
import { stringifyJsonSafe } from "./json.js";

describe("safe JSON serialization", () => {
  it("serializes bigint values as decimal strings without precision loss", () => {
    const value = stringifyJsonSafe({ idTarjeta: 9007199254740993123n, nested: { idAsignacion: 42n } });
    expect(value).toBe('{"idTarjeta":"9007199254740993123","nested":{"idAsignacion":"42"}}');
  });

  it("keeps null audit payloads as SQL null", () => {
    expect(stringifyJsonSafe(null)).toBeNull();
  });
});
