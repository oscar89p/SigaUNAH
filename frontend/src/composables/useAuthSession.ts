import { computed, ref } from "vue";
import type { AuthSession } from "@/types/auth";

export const AUTH_SESSION_KEY = "siga-unah.auth-session";
const session = ref<AuthSession | null>(null);
let restored = false;

function validSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthSession>;
  return candidate.authenticated === true && Boolean(candidate.user?.username) && Boolean(candidate.user?.displayName) && Boolean(candidate.user?.initials);
}

export function useAuthSession() {
  function restore(): AuthSession | null {
    if (restored) return session.value;
    restored = true;
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      session.value = validSession(parsed) ? parsed : null;
      if (!session.value && raw) sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      session.value = null;
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    }
    return session.value;
  }

  function login(value: AuthSession): void {
    session.value = value;
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(value));
  }

  function logout(): void {
    session.value = null;
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }

  return { session, user: computed(() => session.value?.user ?? null), isAuthenticated: computed(() => session.value !== null), restore, login, logout };
}
