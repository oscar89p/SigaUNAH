<script setup lang="ts">
import { useAuthSession } from "@/composables/useAuthSession";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import PageHeader from "@/components/PageHeader.vue";

const session = useAuthSession();
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Mi Cuenta' }, { label: 'Mi Tarjeta' }]" />
  <PageHeader eyebrow="Mi Cuenta" title="Mi Tarjeta" description="Consulta personal de tarjeta y permisos de acceso asociados a su cuenta." />
  <section class="bo-card my-card-status">
    <div class="my-card-status__icon" aria-hidden="true">i</div>
    <div>
      <h2>Vinculación pendiente</h2>
      <p>La cuenta <strong>{{ session.user.value?.displayName ?? "autenticada" }}</strong> no tiene una vinculación de beneficiario verificada en el modelo actual.</p>
      <p class="bo-form-note">Por seguridad, no se muestran tarjetas ni accesos mediante coincidencias de nombre, correo, identidad o identificadores no relacionados.</p>
    </div>
  </section>
  <section class="my-card-sections" aria-label="Información personal de tarjeta">
    <article class="bo-card my-card-panel"><h2>Tarjeta asignada</h2><p>No disponible hasta establecer una relación usuario-beneficiario verificable.</p></article>
    <article class="bo-card my-card-panel"><h2>Accesos autorizados</h2><p>No disponible hasta establecer una relación usuario-beneficiario verificable.</p></article>
    <article class="bo-card my-card-panel"><h2>Historial personal</h2><p>No se consulta historial para evitar exponer registros de otros beneficiarios.</p></article>
  </section>
</template>

<style scoped>
.my-card-status { display: flex; align-items: flex-start; gap: 14px; padding: 20px; border-left: 4px solid var(--bo-blue); }.my-card-status__icon { display: grid; width: 28px; height: 28px; flex: 0 0 28px; place-items: center; border-radius: 50%; color: #fff; background: var(--bo-blue); font-weight: 800; }.my-card-status h2 { margin: 0 0 7px; color: var(--bo-dark); font-size: 17px; }.my-card-status p { margin: 0 0 6px; color: var(--bo-text); font-size: 13px; line-height: 1.5; }.my-card-sections { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }.my-card-panel { min-height: 150px; padding: 18px; }.my-card-panel h2 { margin: 0 0 12px; color: var(--bo-dark); font-size: 15px; }.my-card-panel p { margin: 0; color: var(--bo-muted); font-size: 12px; line-height: 1.5; }
@media (max-width: 800px) { .my-card-sections { grid-template-columns: 1fr; } }
</style>
