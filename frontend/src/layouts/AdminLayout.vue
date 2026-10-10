<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useRouter } from "vue-router";
import { useAuthSession } from "@/composables/useAuthSession";

const router = useRouter();
const auth = useAuthSession();
const userMenuOpen = ref(false);

const accessItems = [
  { label: "Campus", to: "/campus" },
  { label: "Edificios", to: "/edificios" },
  { label: "Elevadores", to: "/elevadores" },
  { label: "Dispositivos", to: "/dispositivos" }
];

const disabledSections = [
  { title: "Administración", items: ["Seguridad", "Configuración", "Catálogos"] },
  { title: "Auditoría", items: [] }
];

function logout() {
  userMenuOpen.value = false;
  auth.logout();
  void router.replace("/login");
}
</script>

<template>
  <div class="bo-layout">
    <aside class="bo-sidebar">
      <RouterLink class="bo-brand" to="/">
        <span><strong>SIGA UNAH</strong><small>BackOffice</small></span>
      </RouterLink>
      <nav>
        <div class="bo-nav-section">
          <RouterLink to="/"><span class="bo-nav-mark" />Dashboard</RouterLink>
        </div>
        <div class="bo-nav-section">
          <h2>Accesos / Infraestructura</h2>
          <RouterLink v-for="item in accessItems" :key="item.to" :to="item.to">
            <span class="bo-nav-mark" />{{ item.label }}
          </RouterLink>
        </div>
        <div class="bo-nav-section">
          <h2>Operación</h2>
          <RouterLink to="/beneficiarios"><span class="bo-nav-mark" />Beneficiarios</RouterLink>
          <RouterLink to="/solicitudes"><span class="bo-nav-mark" />Solicitudes</RouterLink>
          <RouterLink to="/tarjetas"><span class="bo-nav-mark" />Tarjetas</RouterLink>
          <span class="bo-nav-disabled"><span class="bo-nav-mark" />Operaciones</span>
        </div>
        <div v-for="section in disabledSections" :key="section.title" class="bo-nav-section">
          <h2>{{ section.title }}</h2>
          <span v-for="item in section.items" :key="item" class="bo-nav-disabled"><span class="bo-nav-mark" />{{ item }}</span>
        </div>
      </nav>
    </aside>
    <div class="bo-main">
      <header class="bo-topbar">
        <span>Sistema de Gestión de Accesos a Ascensores</span>
        <div class="bo-user"><span class="bo-connected">Conectado</span><button class="bo-avatar-button" type="button" :aria-expanded="userMenuOpen" aria-label="Abrir menú de usuario" @click="userMenuOpen = !userMenuOpen"><b>{{ auth.user.value?.initials ?? "SU" }}</b></button><div v-if="userMenuOpen" class="bo-user-menu"><strong>{{ auth.user.value?.displayName }}</strong><span>{{ auth.user.value?.username }}</span><button type="button" @click="logout">Cerrar sesión</button></div></div>
      </header>
      <main class="bo-content"><RouterView /></main>
    </div>
  </div>
</template>
