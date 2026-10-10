<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "@/services/http";
import { login } from "@/services/auth";
import { useAuthSession } from "@/composables/useAuthSession";

const router = useRouter();
const route = useRoute();
const session = useAuthSession();
const usuario = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function ingresar() {
  error.value = "";
  usuario.value = usuario.value.trim();
  if (!usuario.value || !password.value) {
    error.value = "Ingrese su usuario y contraseña.";
    return;
  }
  loading.value = true;
  try {
    session.login(await login(usuario.value, password.value));
    password.value = "";
    const redirect = typeof route.query.redirect === "string" && route.query.redirect.startsWith("/") ? route.query.redirect : "/";
    await router.replace(redirect);
  } catch (cause) {
    error.value = cause instanceof ApiError && cause.status === 401 ? "Las credenciales no son válidas." : "No fue posible iniciar sesión.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page" aria-labelledby="login-title">
    <section class="login-card">
      <div class="login-brand"><span class="login-mark">SU</span><div><span>Universidad Nacional Autónoma de Honduras</span><strong>SIGA UNAH</strong></div></div>
      <div class="login-heading"><p class="login-eyebrow">BackOffice institucional</p><h1 id="login-title">Ingresar al sistema</h1><p>Sistema de Gestión de Accesos a Ascensores</p></div>
      <form class="login-form" @submit.prevent="ingresar">
        <label for="usuario">Usuario</label><input id="usuario" v-model="usuario" name="usuario" type="text" maxlength="90" autocomplete="username" required :disabled="loading" />
        <label for="password">Contraseña</label><input id="password" v-model="password" name="password" type="password" autocomplete="current-password" required :disabled="loading" />
        <p v-if="error" class="login-error" role="alert">{{ error }}</p>
        <button type="submit" :disabled="loading">{{ loading ? "Iniciando sesión..." : "Iniciar sesión" }}</button>
      </form>
      <p class="login-note">Acceso protegido · Entorno de demostración</p>
    </section>
  </main>
</template>
