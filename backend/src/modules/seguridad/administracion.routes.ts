import type { FastifyPluginAsync } from "fastify";

import type { AuthenticatedRequest } from "../auth/auth-context.js";
import * as repository from "./administracion.repository.js";
import { auditQuerySchema, createPermissionSchema, idSchema, idsBodySchema, navigationQuerySchema, navigationSchema, parameterValueSchema, permissionQuerySchema, profileQuerySchema, profileSchema, stateSchema, updatePermissionSchema } from "./administracion.types.js";

function context(request: AuthenticatedRequest) {
  return { actorId: request.auth.idUsuario, actorName: request.auth.nombreAcceso, ip: request.ip, agent: request.headers["user-agent"] as string | undefined };
}
function profileId(params: unknown) { return idSchema.parse({ id: (params as { id: unknown }).id }).id; }

export const administracionRoutes: FastifyPluginAsync = async app => {
  const base = "/api/v1/seguridad/admin";
  app.get(`${base}/perfiles`, async request => repository.listProfiles(profileQuerySchema.parse(request.query)));
  app.get(`${base}/perfiles/:id`, async request => repository.getProfile(profileId(request.params)));
  app.post(`${base}/perfiles`, async (request, reply) => reply.status(201).send(await repository.createProfile(profileSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/perfiles/:id`, async request => repository.updateProfile(profileId(request.params), profileSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/perfiles/:id/estado`, async request => repository.setProfileState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));
  app.get(`${base}/perfiles/:id/usuarios`, async request => repository.usersForProfile(profileId(request.params), profileQuerySchema.parse(request.query)));
  app.get(`${base}/perfiles/:id/permisos`, async request => repository.permissionIdsForProfile(profileId(request.params)));
  app.put(`${base}/perfiles/:id/permisos`, async request => {
    const auth = (request as AuthenticatedRequest).auth;
    return repository.setProfilePermissions(profileId(request.params), idsBodySchema.parse(request.body).ids, auth.permisos, context(request as AuthenticatedRequest));
  });
  app.get(`${base}/perfiles/:id/navegaciones`, async request => repository.navigationIdsForProfile(profileId(request.params)));
  app.put(`${base}/perfiles/:id/navegaciones`, async request => repository.setProfileNavigation(profileId(request.params), idsBodySchema.parse(request.body).ids, context(request as AuthenticatedRequest)));

  app.get(`${base}/permisos`, async request => repository.listPermissions(permissionQuerySchema.parse(request.query)));
  app.post(`${base}/permisos`, async (request, reply) => reply.status(201).send(await repository.createPermission(createPermissionSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/permisos/:id`, async request => repository.updatePermission(profileId(request.params), updatePermissionSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/permisos/:id/estado`, async request => repository.setPermissionState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));
  app.get(`${base}/permisos/:id/perfiles`, async request => repository.profilesForPermission(profileId(request.params)));

  app.get(`${base}/navegaciones`, async request => repository.listNavigation(navigationQuerySchema.parse(request.query)));
  app.post(`${base}/navegaciones`, async (request, reply) => reply.status(201).send(await repository.createNavigation(navigationSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/navegaciones/:id`, async request => repository.updateNavigation(profileId(request.params), navigationSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/navegaciones/:id/estado`, async request => repository.setNavigationState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));

  app.get(`${base}/configuracion`, async () => repository.listParameters());
  app.put(`${base}/configuracion/:id`, async request => repository.updateParameter(profileId(request.params), parameterValueSchema.parse(request.body).valor, context(request as AuthenticatedRequest)));

  app.get(`${base}/auditoria`, async request => repository.listAudit(auditQuerySchema.parse(request.query)));
  app.get(`${base}/auditoria/:source/:id`, async request => {
    const params = request.params as { source: string; id: string };
    return repository.auditDetail(params.source, idSchema.parse({ id: params.id }).id);
  });
};
