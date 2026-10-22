import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import * as authService from "./auth.service.js";
import { authRoutes } from "./auth.routes.js";

let app: FastifyInstance;
let sessionActive = true;
const sessionValue = "test-session-cookie";
const authContext = { idUsuario: 7, nombreAcceso: "prueba", nombreUsuario: "Usuario Prueba", perfiles: [], permisos: [] };

beforeEach(async () => {
  sessionActive = true;
  vi.spyOn(authService, "authenticate").mockImplementation(async (rawSession) => {
    if (!rawSession || !sessionActive) throw new HttpError(401, "La sesión no es válida");
    return authContext;
  });
  vi.spyOn(authService, "csrfMatches").mockImplementation((rawSession, token) => rawSession === sessionValue && token === "csrf-valido");
  vi.spyOn(authService, "logout").mockImplementation(async () => { sessionActive = false; });

  app = Fastify();
  await app.register(cookie);
  await app.register(authRoutes);
  await app.ready();
});

afterEach(async () => {
  await app.close();
  vi.restoreAllMocks();
});

describe("authentication routes logout", () => {
  it("logs out, clears the session cookie, and rejects the old cookie on /me", async () => {
    const response = await app.inject({
      method: "POST", url: "/api/v1/auth/logout",
      headers: { cookie: `${env.AUTH_SESSION_COOKIE}=${sessionValue}`, "x-csrf-token": "csrf-valido" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ authenticated: false });
    expect(authService.logout).toHaveBeenCalledWith(sessionValue);
    const setCookie = response.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie ?? "";
    expect(cookieHeader).toContain(`${env.AUTH_SESSION_COOKIE}=`);
    expect(cookieHeader).toMatch(/Max-Age=0/i);
    expect(cookieHeader).toMatch(/Path=\//i);
    expect(cookieHeader).toMatch(/HttpOnly/i);
    expect(cookieHeader).toMatch(/SameSite=Strict/i);
    expect(cookieHeader.toLowerCase().includes("; secure")).toBe(env.AUTH_COOKIE_SECURE);

    const me = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie: `${env.AUTH_SESSION_COOKIE}=${sessionValue}` } });
    expect(me.statusCode).toBe(401);
  });

  it("still rejects logout with an invalid CSRF token and leaves the session active", async () => {
    const response = await app.inject({
      method: "POST", url: "/api/v1/auth/logout",
      headers: { cookie: `${env.AUTH_SESSION_COOKIE}=${sessionValue}`, "x-csrf-token": "incorrecto" }
    });

    expect(response.statusCode).toBe(403);
    expect(authService.logout).not.toHaveBeenCalled();
    const me = await app.inject({ method: "GET", url: "/api/v1/auth/me", headers: { cookie: `${env.AUTH_SESSION_COOKIE}=${sessionValue}` } });
    expect(me.statusCode).toBe(200);
  });
});
