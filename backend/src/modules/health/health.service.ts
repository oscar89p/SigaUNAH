import { HttpError } from "../../shared/errors/http-error.js";
import { queryDatabaseHealth } from "./health.repository.js";

interface DatabaseHealth {
  status: "ok";
  database: string;
  serverDate: string;
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const health = await queryDatabaseHealth();

    return {
      status: "ok",
      database: health.databaseName,
      serverDate: health.serverDate.toISOString()
    };
  } catch (error) {
    throw new HttpError(503, "Database service unavailable", { cause: error });
  }
}
