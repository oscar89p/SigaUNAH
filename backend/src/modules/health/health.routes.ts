import type { FastifyPluginAsync } from "fastify";

import { getDatabaseHealth } from "./health.service.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    status: "ok",
    service: "siga-unah-api"
  }));

  app.get("/health/database", async () => getDatabaseHealth());
};
