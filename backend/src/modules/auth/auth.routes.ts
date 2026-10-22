import type { FastifyPluginAsync } from "fastify";

import { loginSchema } from "./auth.types.js";
import { env } from "../../config/env.js";
import { authenticate, cookieOptions, csrfMatches, csrfTokenForSession, login, logout } from "./auth.service.js";
import { HttpError } from "../../shared/errors/http-error.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/v1/auth/login", async (request, reply) => login(loginSchema.parse(request.body), {
    ip: request.ip,
    headers: request.headers,
    setCookie: reply.setCookie.bind(reply)
  }));
  app.get("/api/v1/auth/me", async (request) => {
    const rawSession = request.cookies[env.AUTH_SESSION_COOKIE];
    const auth = await authenticate(rawSession);
    return { authenticated: true as const, csrfToken: rawSession ? csrfTokenForSession(rawSession) : "", user: { username: auth.nombreAcceso, displayName: auth.nombreUsuario, initials: auth.nombreUsuario.split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase(), profiles: auth.perfiles, permissions: auth.permisos } };
  });
  app.post("/api/v1/auth/logout", async (request, reply) => {
    const rawSession = request.cookies[env.AUTH_SESSION_COOKIE];
    await authenticate(rawSession);
    if (!csrfMatches(rawSession, request.headers["x-csrf-token"] as string | undefined)) throw new HttpError(403, "Token CSRF inválido");
    await logout(rawSession);
    reply.clearCookie(env.AUTH_SESSION_COOKIE, cookieOptions(true, 0));
    return { authenticated: false };
  });
};
