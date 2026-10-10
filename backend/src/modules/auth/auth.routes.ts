import type { FastifyPluginAsync } from "fastify";

import * as service from "./auth.service.js";
import { loginSchema } from "./auth.types.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/v1/auth/login", async (request) => service.login(loginSchema.parse(request.body)));
};
