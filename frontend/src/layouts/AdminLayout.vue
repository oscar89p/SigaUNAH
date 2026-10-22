<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useRouter } from "vue-router";
import { useAuthSession } from "@/composables/useAuthSession";
import { useNavigation } from "@/composables/useNavigation";
import NavigationMenuNode from "@/components/NavigationMenuNode.vue";

const router = useRouter();
const auth = useAuthSession();
const navigation = useNavigation();
const userMenuOpen = ref(false);
const logoutError = ref("");

void navigation.load();

async function logout() {
  userMenuOpen.value = false;
  logoutError.value = "";
  try {
    await auth.logout();
    await router.replace("/login");
  } catch {
    logoutError.value = "No fue posible cerrar la sesión. Verifique la conexión e inténtelo nuevamente.";
    userMenuOpen.value = true;
  }
}
</script>

<template>
  <div class="bo-layout">
    <aside class="bo-sidebar">
       <RouterLink class="bo-brand" to="/inicio">
         <img src="/assets/img/unah-escudo.png" alt="Escudo de la UNAH" />
         <span><strong>SIGA UNAH</strong><small>BackOffice</small></span>
       </RouterLink>
      <nav>
        <div v-if="navigation.loading.value" class="bo-nav-section"><span class="bo-nav-disabled">Cargando navegación...</span></div>
        <div v-else-if="navigation.error.value" class="bo-nav-section"><span class="bo-nav-disabled">Sesión expirada o menú no disponible</span></div>
        <template v-else>
          <NavigationMenuNode v-for="section in navigation.items.value" :key="section.idNavegacion" :item="section" />
          <div v-if="navigation.items.value.length === 0" class="bo-nav-section"><span class="bo-nav-disabled">No hay opciones asignadas</span></div>
        </template>
      </nav>
    </aside>
    <div class="bo-main">
      <header class="bo-topbar">
        <span>Sistema de Gestión de Accesos a Ascensores</span>
         <div class="bo-user"><span class="bo-connected">Conectado</span><button class="bo-avatar-button" type="button" :aria-expanded="userMenuOpen" aria-label="Abrir menú de usuario" @click="userMenuOpen = !userMenuOpen"><b>{{ auth.user.value?.initials ?? "SU" }}</b></button><div v-if="userMenuOpen" class="bo-user-menu"><strong>{{ auth.user.value?.displayName }}</strong><span>{{ auth.user.value?.username }}</span><p v-if="logoutError" class="bo-state-error" role="alert">{{ logoutError }}</p><button type="button" @click="logout">Cerrar sesión</button></div></div>
      </header>
      <main class="bo-content"><RouterView /></main>
    </div>
  </div>
</template>
