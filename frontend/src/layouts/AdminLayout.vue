<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useRouter } from "vue-router";
import { useAuthSession } from "@/composables/useAuthSession";
import { useNavigation } from "@/composables/useNavigation";
import NavigationMenuNode from "@/components/NavigationMenuNode.vue";
import type { NavigationItem } from "@/types/navigation";

const router = useRouter();
const auth = useAuthSession();
const navigation = useNavigation();
const userMenuOpen = ref(false);
const logoutError = ref("");
const userMenuRef = ref<HTMLElement | null>(null);
const accountNavigationCodes = new Set(["MI_CUENTA", "MI_INFORMACION", "MI_TARJETA"]);
function visibleSidebarItems(items: NavigationItem[]): NavigationItem[] {
  return items.filter(item => !accountNavigationCodes.has(item.codigoNavegacion)).map(item => ({ ...item, children: visibleSidebarItems(item.children) }));
}
const sidebarItems = computed(() => visibleSidebarItems(navigation.items.value));

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
function closeUserMenuOnOutside(event: MouseEvent) { if (userMenuOpen.value && userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) userMenuOpen.value = false; }
function closeUserMenuOnEscape(event: KeyboardEvent) { if (event.key === "Escape") userMenuOpen.value = false; }
onMounted(() => { document.addEventListener("click", closeUserMenuOnOutside); document.addEventListener("keydown", closeUserMenuOnEscape); });
onUnmounted(() => { document.removeEventListener("click", closeUserMenuOnOutside); document.removeEventListener("keydown", closeUserMenuOnEscape); });
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
           <NavigationMenuNode v-for="section in sidebarItems" :key="section.idNavegacion" :item="section" />
           <div v-if="sidebarItems.length === 0" class="bo-nav-section"><span class="bo-nav-disabled">No hay opciones asignadas</span></div>
        </template>
      </nav>
    </aside>
    <div class="bo-main">
      <header class="bo-topbar">
         <span>Sistema de Gestión de Accesos a Ascensores</span>
          <div ref="userMenuRef" class="bo-user"><span class="bo-connected">Conectado</span><button class="bo-avatar-button" type="button" :aria-expanded="userMenuOpen" aria-haspopup="menu" aria-controls="bo-user-menu" aria-label="Abrir menú de usuario" @click="userMenuOpen = !userMenuOpen"><b>{{ auth.user.value?.initials ?? "SU" }}</b></button><div v-if="userMenuOpen" id="bo-user-menu" class="bo-user-menu" role="menu"><strong>{{ auth.user.value?.displayName }}</strong><span>{{ auth.user.value?.username }}</span><RouterLink class="bo-user-menu-link" role="menuitem" to="/mi-cuenta/informacion" @click="userMenuOpen = false">Mi Información</RouterLink><RouterLink class="bo-user-menu-link" role="menuitem" to="/mi-cuenta/tarjeta" @click="userMenuOpen = false">Mi Tarjeta</RouterLink><div class="bo-user-menu-separator" role="separator" /><p v-if="logoutError" class="bo-state-error" role="alert">{{ logoutError }}</p><button type="button" role="menuitem" @click="logout">Cerrar sesión</button></div></div>
      </header>
      <main class="bo-content"><RouterView /></main>
    </div>
  </div>
</template>
