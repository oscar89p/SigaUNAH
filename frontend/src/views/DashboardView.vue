<script setup lang="ts">
import { onMounted, ref } from "vue";

import { getHealth } from "@/services/health";

type ApiStatus = "Comprobando..." | "Disponible" | "No disponible";

const apiStatus = ref<ApiStatus>("Comprobando...");

onMounted(async () => {
  try {
    const health = await getHealth();
    apiStatus.value = health.status === "ok" ? "Disponible" : "No disponible";
  } catch {
    apiStatus.value = "No disponible";
  }
});
</script>

<template>
  <main class="dashboard">
    <section class="dashboard__panel">
      <p class="dashboard__institution">Universidad Nacional Autónoma de Honduras</p>
      <h1>SIGA UNAH</h1>
      <p class="dashboard__subtitle">Sistema de Gestión de Accesos a Ascensores</p>

      <div class="dashboard__status">
        <h2>Dashboard</h2>
        <p>
          Estado API:
          <strong :class="{ available: apiStatus === 'Disponible' }">{{ apiStatus }}</strong>
        </p>
      </div>
    </section>
  </main>
</template>
