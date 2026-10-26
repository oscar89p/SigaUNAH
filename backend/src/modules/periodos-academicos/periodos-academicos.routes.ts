import type { FastifyPluginAsync } from "fastify";
import type { AuthenticatedRequest } from "../auth/auth-context.js";
import * as repository from "./periodos-academicos.repository.js";
import { idSchema, inputSchema, querySchema, stateSchema } from "./periodos-academicos.types.js";

function actor(request: AuthenticatedRequest) { return { actorId: request.auth.idUsuario, actorName: request.auth.nombreAcceso, ip: request.ip, agent: request.headers["user-agent"] as string | undefined }; }
export const periodosAcademicosRoutes: FastifyPluginAsync = async app => {
  const base = "/api/v1/seguridad/admin/configuracion/periodos-academicos";
  app.get(base, async request => repository.list(querySchema.parse(request.query)));
  app.get(`${base}/:id`, async request => repository.find(idSchema.parse(request.params).id));
  app.post(base, async (request, reply) => reply.status(201).send(await repository.create(inputSchema.parse(request.body), actor(request as AuthenticatedRequest))));
  app.put(`${base}/:id`, async request => repository.update(idSchema.parse(request.params).id, inputSchema.parse(request.body), actor(request as AuthenticatedRequest)));
  app.patch(`${base}/:id/estado`, async request => repository.setState(idSchema.parse(request.params).id, stateSchema.parse(request.body).estado, actor(request as AuthenticatedRequest)));
};
