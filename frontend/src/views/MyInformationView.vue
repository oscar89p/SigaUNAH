<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import PageHeader from "@/components/PageHeader.vue";
import { ApiError } from "@/services/http";
import { getMyInformation, type PersonalInformation } from "@/services/usuarios";

const information = ref<PersonalInformation | null>(null); const loading = ref(true); const error = ref("");
const message = (cause: unknown) => cause instanceof ApiError ? cause.message : "No fue posible cargar su información.";
async function load() { loading.value = true; error.value = ""; try { information.value = await getMyInformation(); } catch (cause) { information.value = null; error.value = message(cause); } finally { loading.value = false; } }
function date(value: string | null) { return value ? new Date(value).toLocaleString("es-HN") : "No disponible"; }
onMounted(() => void load());
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Mi Cuenta' }, { label: 'Mi Información' }]" />
  <PageHeader eyebrow="Mi Cuenta" title="Mi Información" description="Consulta de la información asociada a su cuenta SIGA UNAH." />
  <div v-if="loading" class="bo-state">Cargando su información...</div>
  <div v-else-if="error" class="bo-state bo-state-error"><strong>{{ error }}</strong><button class="bo-btn" @click="load">Reintentar</button></div>
  <div v-else-if="!information" class="bo-state">No hay información disponible para su cuenta.</div>
  <div v-else class="my-information-grid">
    <section class="bo-card my-information-card"><h2>Información general</h2><dl><dt>Nombre</dt><dd>{{ information.nombreUsuario }}</dd><dt>Correo electrónico</dt><dd>{{ information.correoElectronico }}</dd></dl></section>
    <section class="bo-card my-information-card"><h2>Información institucional</h2><dl><dt>Identificador institucional</dt><dd>{{ information.identificadorInstitucional || "No registrado" }}</dd><dt>Tipo de autenticación</dt><dd>{{ information.tipoAutenticacion }}</dd></dl></section>
    <section class="bo-card my-information-card"><h2>Información de la cuenta</h2><dl><dt>Nombre de acceso</dt><dd>{{ information.nombreAcceso }}</dd><dt>Estado</dt><dd>{{ information.estadoUsuario ? "Activa" : "Inactiva" }}</dd><dt>Último acceso</dt><dd>{{ date(information.ultimoAcceso) }}</dd></dl></section>
  </div>
</template>
