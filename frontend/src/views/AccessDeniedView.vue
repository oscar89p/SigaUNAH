<template>
  <section class="bo-card access-denied">
    <p class="bo-eyebrow">Seguridad</p>
    <h1>Acceso no autorizado</h1>
    <p>Su usuario no tiene una opción de navegación o permiso válido para esta ruta.</p>
    <RouterLink class="bo-btn bo-btn-primary" to="/inicio">Ir al inicio</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>
