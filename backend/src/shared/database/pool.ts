import sql, { type ConnectionPool } from "mssql";

import { databaseConfig } from "./config.js";
import { HttpError } from "../errors/http-error.js";

let pool: ConnectionPool | undefined;
let connectionPromise: Promise<ConnectionPool> | undefined;

export async function getDatabasePool(): Promise<ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }

  if (!connectionPromise) {
    const newPool = new sql.ConnectionPool(databaseConfig);
    pool = newPool;

    newPool.on("error", () => {
      console.error("SQL Server connection pool error");
    });

    connectionPromise = newPool.connect().catch(async (error: unknown) => {
      if (pool === newPool) {
        pool = undefined;
      }

      await newPool.close().catch(() => undefined);
      throw new HttpError(503, "Database service unavailable", { cause: error });
    });

    connectionPromise.finally(() => {
      connectionPromise = undefined;
    }).catch(() => undefined);
  }

  return connectionPromise;
}

export async function closeDatabasePool(): Promise<void> {
  if (connectionPromise) {
    await connectionPromise.catch(() => undefined);
  }

  const activePool = pool;
  pool = undefined;

  if (activePool?.connected || activePool?.connecting) {
    await activePool.close();
  }
}
