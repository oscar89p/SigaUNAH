import { getDatabasePool } from "../../shared/database/pool.js";

interface DatabaseHealthRow {
  databaseName: string;
  serverDate: Date;
}

export async function queryDatabaseHealth(): Promise<DatabaseHealthRow> {
  const pool = await getDatabasePool();
  const result = await pool.request().query<DatabaseHealthRow>(`
    SELECT
      DB_NAME() AS databaseName,
      GETDATE() AS serverDate;
  `);
  const health = result.recordset[0];

  if (!health) {
    throw new Error("SQL Server returned no health information");
  }

  return health;
}
