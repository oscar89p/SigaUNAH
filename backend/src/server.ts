import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
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
import { authenticate, can, csrfMatches } from "./modules/auth/auth.service.js";
import type { AuthenticatedRequest } from "./modules/auth/auth-context.js";
import { canSearchBeneficiariesForSolicitud, isAuthManagedRequest, permissionFor } from "./modules/auth/authorization.js";
import { navegacionRoutes } from "./modules/seguridad/navegacion.routes.js";
import { usuariosRoutes } from "./modules/seguridad/usuarios.routes.js";
import { administracionRoutes } from "./modules/seguridad/administracion.routes.js";
import { periodosAcademicosRoutes } from "./modules/periodos-academicos/periodos-academicos.routes.js";
import { monitoreoRoutes } from "./modules/operaciones/monitoreo.routes.js";
import { reportesRoutes } from "./modules/reportes/reportes.routes.js";
import { stringifyJsonSafe } from "./shared/serialization/json.js";

const app = Fastify({ logger: true });

// SQL BIGINT values must cross the HTTP boundary as decimal strings, never as Numbers.
app.addHook("preSerialization", async (_request, _reply, payload) => JSON.parse(stringifyJsonSafe(payload) ?? "null"));

await app.register(cors, {
  origin: env.AUTH_ALLOWED_ORIGINS.split(",").map(value => value.trim()).filter(Boolean),
  methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"] ,
  credentials: true
});
await app.register(cookie);

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
await app.register(authRoutes);

app.addHook("preHandler", async (request) => {
  if (request.url === "/health" || request.url === "/health/database" || (request.url === "/api/v1/auth/login" && request.method === "POST")) return;
  const auth = await authenticate(request.cookies[env.AUTH_SESSION_COOKIE]);
  (request as AuthenticatedRequest).auth = auth;
  // This endpoint performs its own authentication and CSRF validation in auth.routes.ts.
  if (isAuthManagedRequest(request.url, request.method)) return;
  const permission = permissionFor(request.url, request.method);
  if (request.url === "/api/v1/seguridad/mi-navegacion" && request.method === "GET") return;
  if (!permission || (!can(auth, permission) && !canSearchBeneficiariesForSolicitud(request.url, request.method, auth.permisos))) throw new HttpError(403, "No tiene permisos para esta operación");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !csrfMatches(request.cookies[env.AUTH_SESSION_COOKIE], request.headers["x-csrf-token"] as string | undefined)) {
    throw new HttpError(403, "Token CSRF inválido");
  }
});

await app.register(campusRoutes);
await app.register(edificiosRoutes);
await app.register(elevadoresRoutes);
await app.register(dispositivosRoutes);
await app.register(beneficiariosRoutes);
await app.register(solicitudesRoutes);
await app.register(tarjetasRoutes);
await app.register(navegacionRoutes);
await app.register(usuariosRoutes);
await app.register(administracionRoutes);
await app.register(periodosAcademicosRoutes);
await app.register(monitoreoRoutes);
await app.register(reportesRoutes);

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
