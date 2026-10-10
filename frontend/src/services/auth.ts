import { post } from "./http";
import type { AuthSession } from "@/types/auth";

export function login(usuario: string, password: string): Promise<AuthSession> {
  return post<AuthSession>("/api/v1/auth/login", { usuario, password });
}
