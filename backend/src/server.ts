import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";

import { env } from "./config/env.js";
import { campusRoutes } from "./modules/campus/campus.routes.js";
import { edificiosRoutes } from "./modules/edificios/edificios.routes.js";
import { elevadoresRoutes } from "./modules/elevadores/elevadores.routes.js";
import { dispositivosRoutes } from "./modules/dispositivos/dispositivos.routes.js";
import { beneficiariosRoutes } from "./modules/beneficiarios/beneficiarios.routes.js";
import { solicitudesRoutes } from "./modules/solicitudes/solicitudes.routes.js";
import { tarjetasRoutes } from "./modules/tarjetas/tarjetas.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { closeDatabasePool } from "./shared/database/pool.js";
import { HttpError } from "./shared/errors/http-error.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
});

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, "Request failed");

  if (error instanceof ZodError) {
    return reply.status(400).send({
      status: "error",
      message: "Los datos enviados no son válidos",
      issues: error.issues.map((issue) => ({ path: issue.path, message: issue.message }))
    });
  }

  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({
      status: "error",
      message: error.message
    });
  }

  return reply.status(500).send({
    status: "error",
    message: "Internal server error"
  });
});

await app.register(healthRoutes);
await app.register(campusRoutes);
await app.register(edificiosRoutes);
await app.register(elevadoresRoutes);
await app.register(dispositivosRoutes);
await app.register(beneficiariosRoutes);
await app.register(solicitudesRoutes);
await app.register(tarjetasRoutes);
await app.register(authRoutes);

app.addHook("onClose", async () => {
  await closeDatabasePool();
});

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  app.log.info({ signal }, "Shutting down server");

  try {
    await app.close();
  } catch (error) {
    app.log.error(error, "Error while shutting down server");
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
