import argon2 from "argon2";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import * as repository from "./auth.repository.js";
import type { AuthContext } from "./auth-context.js";
import type { LoginRequest } from "./auth.types.js";

const sessionCookieSeconds = env.AUTH_SESSION_MAX_HOURS * 60 * 60;
const hashSession = (value: string) => createHash("sha256").update(value).digest("hex");

function initials(name: string, username: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
  return (words[0] ?? username).slice(0, 2).toUpperCase();
}

export function cookieOptions(httpOnly: boolean, maxAge: number) {
  return { httpOnly, secure: env.AUTH_COOKIE_SECURE, sameSite: "strict" as const, path: "/", maxAge };
}

export function csrfTokenForSession(rawSession: string): string {
  return createHmac("sha256", rawSession).update("siga-unah-csrf").digest("hex");
}

export interface LoginHttpContext {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  setCookie: (name: string, value: string, options: object) => unknown;
}

export async function login(data: LoginRequest, request: LoginHttpContext) {
  const user = await repository.findUser(data.usuario);
  const userAgent = request.headers?.["user-agent"];
  const common = { ip: request.ip, agent: typeof userAgent === "string" ? userAgent : undefined };
  if (!user || user.tipoAutenticacion !== "LOCAL" || !user.claveHash || !user.estadoUsuario) {
    await repository.recordAttempt(data.usuario, user?.idUsuario ?? null, false, "CREDENCIALES_INVALIDAS", common.ip, common.agent);
    throw new HttpError(401, "Las credenciales no son válidas");
  }
  if (user.fechaBloqueo && user.fechaBloqueo > new Date()) {
    await repository.recordAttempt(data.usuario, user.idUsuario, false, "USUARIO_BLOQUEADO", common.ip, common.agent);
    throw new HttpError(423, "El acceso está temporalmente bloqueado");
  }
  let valid = false;
  try { valid = await argon2.verify(user.claveHash, data.password); } catch { valid = false; }
  if (!valid) {
    await repository.registerFailure(user.idUsuario);
    await repository.recordAttempt(data.usuario, user.idUsuario, false, "CREDENCIALES_INVALIDAS", common.ip, common.agent);
    throw new HttpError(401, "Las credenciales no son válidas");
  }
  await repository.registerSuccess(user.idUsuario);
  await repository.recordAttempt(data.usuario, user.idUsuario, true, "AUTENTICACION_EXITOSA", common.ip, common.agent);
  const rawSession = randomBytes(48).toString("base64url");
  const now = new Date();
  await repository.createSession({ idUsuario: user.idUsuario, identificadorSesion: hashSession(rawSession), inicio: now, expiracion: new Date(now.getTime() + env.AUTH_SESSION_IDLE_MINUTES * 60_000), ip: common.ip, agent: common.agent });
  request.setCookie(env.AUTH_SESSION_COOKIE, rawSession, cookieOptions(true, sessionCookieSeconds));
  const access = await repository.loadAccess(user.idUsuario);
  return { authenticated: true as const, csrfToken: csrfTokenForSession(rawSession), user: { username: user.nombreAcceso, displayName: user.nombreUsuario, initials: initials(user.nombreUsuario, user.nombreAcceso), profiles: [...new Set(access.map(x => x.codigoPerfil))], permissions: [...new Set(access.map(x => x.codigoPermiso))] } };
}

export async function authenticate(rawSession: string | undefined): Promise<AuthContext> {
  if (!rawSession) throw new HttpError(401, "Autenticación requerida");
  const session = await repository.findSession(hashSession(rawSession));
  if (!session || !session.estadoUsuario) throw new HttpError(401, "La sesión no es válida");
  const now = Date.now();
  if (!isSessionValid(session.fechaInicio, session.fechaExpiracion, now)) {
    await repository.closeSession(hashSession(rawSession));
    throw new HttpError(401, "La sesión expiró");
  }
  await repository.touchSession(session.idSesionUsuario, new Date(Math.min(session.fechaInicio.getTime() + env.AUTH_SESSION_MAX_HOURS * 3_600_000, now + env.AUTH_SESSION_IDLE_MINUTES * 60_000)));
  const access = await repository.loadAccess(session.idUsuario);
  return { idUsuario: session.idUsuario, nombreAcceso: session.nombreAcceso, nombreUsuario: session.nombreUsuario, perfiles: [...new Set(access.map(x => x.codigoPerfil))], permisos: [...new Set(access.map(x => x.codigoPermiso))] };
}

export function csrfMatches(rawSession: string | undefined, header: string | undefined) {
  if (!rawSession || !header) return false;
  const expected = csrfTokenForSession(rawSession);
  if (expected.length !== header.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}

export function can(context: AuthContext, permission: string) { return context.permisos.includes(permission); }
export function isSessionValid(start: Date, expiration: Date, now = Date.now()) {
  return start.getTime() + env.AUTH_SESSION_MAX_HOURS * 3_600_000 > now && expiration.getTime() > now;
}
export const sessionIdentifier = (raw: string) => hashSession(raw);

export async function logout(rawSession: string | undefined) {
  if (rawSession) await repository.closeSession(hashSession(rawSession));
}
