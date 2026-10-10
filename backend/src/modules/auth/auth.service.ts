import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { LoginRequest } from "./auth.types.js";

function initials(displayName: string, username: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const first = words.at(0) ?? username;
  const last = words.at(-1) ?? first;
  if (words.length >= 2) return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  return first.slice(0, 2).toUpperCase();
}

export function login(data: LoginRequest) {
  if (data.usuario !== env.DEMO_USER || data.password !== env.DEMO_PASSWORD) {
    throw new HttpError(401, "Las credenciales no son válidas");
  }

  return {
    authenticated: true,
    user: {
      username: env.DEMO_USER,
      displayName: env.DEMO_DISPLAY_NAME,
      initials: initials(env.DEMO_DISPLAY_NAME, env.DEMO_USER)
    }
  };
}
