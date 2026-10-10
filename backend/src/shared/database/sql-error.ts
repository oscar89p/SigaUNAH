import { HttpError } from "../errors/http-error.js";

export function mapSqlError(error: unknown): never {
  const errorName = error instanceof Error ? error.name : "";
  const errorMessage = error instanceof Error ? error.message : "";

  if (errorName === "ConnectionError" || errorMessage.startsWith("Failed to connect")) {
    throw new HttpError(503, "Database service unavailable", { cause: error });
  }

  const number = typeof error === "object" && error !== null && "number" in error
    ? (error as { number?: number }).number
    : undefined;

  if (number === 2627 || number === 2601) {
    throw new HttpError(409, "El registro ya existe con esos datos", { cause: error });
  }

  if (number === 547) {
    throw new HttpError(400, "La relación indicada no existe o no puede modificarse", { cause: error });
  }

  throw error;
}
