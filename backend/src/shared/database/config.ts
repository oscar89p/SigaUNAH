import type { config as SqlConfig } from "mssql";

import { env } from "../../config/env.js";

export const databaseConfig: SqlConfig = {
  server: env.DB_SERVER,
  port: env.DB_PORT,
  database: env.DB_DATABASE,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: env.DB_ENCRYPT,
    trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE
  }
};
