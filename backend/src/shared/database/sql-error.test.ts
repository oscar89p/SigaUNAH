import { describe, expect, it } from "vitest";
import { mapSqlError } from "./sql-error.js";
import { HttpError } from "../errors/http-error.js";

describe("SQL error mapping", () => {
  it.each([2601, 2627])("maps unique constraint %s to HTTP 409", (number) => {
    try { mapSqlError({ number }); } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(409);
    }
  });

  it("does not convert unexpected errors into duplicate errors", () => {
    const unexpected = new Error("audit service failure");
    expect(() => mapSqlError(unexpected)).toThrow(unexpected);
  });
});
