import type { FastifyPluginAsync } from "fastify";

import type { AuthenticatedRequest } from "../auth/auth-context.js";
import * as repository from "./administracion.repository.js";
import { auditQuerySchema, catalogQuerySchema, catalogSchema, catalogValueQuerySchema, catalogValueSchema, createPermissionSchema, idSchema, idsBodySchema, navigationQuerySchema, navigationSchema, parameterQuerySchema, parameterSchema, parameterValueAdminSchema, parameterValueQuerySchema, parameterValueSchema, permissionQuerySchema, profileQuerySchema, profileSchema, stateSchema, updatePermissionSchema } from "./administracion.types.js";

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
  app.get(`${base}/configuracion/parametros`, async request => repository.listParameterAdmin(parameterQuerySchema.parse(request.query)));
  app.post(`${base}/configuracion/parametros`, async (request, reply) => reply.status(201).send(await repository.createParameter(parameterSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/configuracion/parametros/:id`, async request => repository.updateParameterAdmin(profileId(request.params), parameterSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/configuracion/parametros/:id/estado`, async request => repository.setParameterState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));
  app.get(`${base}/configuracion/valores`, async request => repository.listParameterValues(parameterValueQuerySchema.parse(request.query)));
  app.post(`${base}/configuracion/valores`, async (request, reply) => reply.status(201).send(await repository.createParameterValue(parameterValueAdminSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/configuracion/valores/:id`, async request => repository.updateParameterValue(profileId(request.params), parameterValueAdminSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/configuracion/valores/:id/estado`, async request => repository.setParameterValueState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));
  app.get(`${base}/configuracion/catalogos`, async request => repository.listCatalogs(catalogQuerySchema.parse(request.query)));
  app.post(`${base}/configuracion/catalogos`, async (request, reply) => reply.status(201).send(await repository.createCatalog(catalogSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/configuracion/catalogos/:id`, async request => repository.updateCatalog(profileId(request.params), catalogSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/configuracion/catalogos/:id/estado`, async request => repository.setCatalogState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));
  app.get(`${base}/configuracion/catalogos/valores`, async request => repository.listCatalogValues(catalogValueQuerySchema.parse(request.query)));
  app.post(`${base}/configuracion/catalogos/valores`, async (request, reply) => reply.status(201).send(await repository.createCatalogValue(catalogValueSchema.parse(request.body), context(request as AuthenticatedRequest))));
  app.put(`${base}/configuracion/catalogos/valores/:id`, async request => repository.updateCatalogValue(profileId(request.params), catalogValueSchema.parse(request.body), context(request as AuthenticatedRequest)));
  app.patch(`${base}/configuracion/catalogos/valores/:id/estado`, async request => repository.setCatalogValueState(profileId(request.params), stateSchema.parse(request.body).estado, context(request as AuthenticatedRequest)));

  app.get(`${base}/auditoria`, async request => repository.listAudit(auditQuerySchema.parse(request.query)));
  app.get(`${base}/auditoria/:source/:id`, async request => {
    const params = request.params as { source: string; id: string };
    return repository.auditDetail(params.source, idSchema.parse({ id: params.id }).id);
  });
};
