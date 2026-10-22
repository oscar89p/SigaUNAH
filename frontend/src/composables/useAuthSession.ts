import { computed, ref } from "vue";
import type { AuthSession } from "@/types/auth";
import { get, post } from "@/services/http";
import { setCsrfToken } from "@/services/csrf";
import { useNavigation } from "@/composables/useNavigation";

const session = ref<AuthSession | null>(null);
let restored = false;

export function useAuthSession() {
  async function restore(): Promise<AuthSession | null> {
    if (restored) return session.value;
    restored = true;
    try {
      session.value = await get<AuthSession>("/api/v1/auth/me");
      setCsrfToken(session.value.csrfToken);
    } catch {
      session.value = null;
      setCsrfToken(null);
      useNavigation().clear();
    }
    return session.value;
  }
  function login(value: AuthSession) { session.value = value; setCsrfToken(value.csrfToken); useNavigation().clear(); }
  function expire() { session.value = null; setCsrfToken(null); useNavigation().clear(); }
  async function logout() { await post<{ authenticated: false }>("/api/v1/auth/logout", {}); session.value = null; setCsrfToken(null); useNavigation().clear(); }
  return { session, user: computed(() => session.value?.user ?? null), isAuthenticated: computed(() => session.value !== null), restore, login, expire, logout };
}
