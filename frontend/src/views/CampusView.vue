<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import CampusForm from "@/components/CampusForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { ApiError } from "@/services/http";
import { createCampus, listCampus, updateCampus, updateCampusState } from "@/services/campus";
import type { Campus, Paginated } from "@/types/access";

const result = ref<Paginated<Campus>>({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
const search = ref("");
const page = ref(1);
const loading = ref(false);
const error = ref("");
const formError = ref("");
const editing = ref<Campus | null>(null);
const showForm = ref(false);
const saving = ref(false);
const success = ref("");
const confirmTarget = ref<Campus | null>(null);

function message(errorValue: unknown) { return errorValue instanceof ApiError ? errorValue.message : "Ocurrió un error inesperado"; }
async function load() {
  loading.value = true; error.value = "";
  try { result.value = await listCampus({ page: page.value, pageSize: 10, search: search.value, sortDirection: "asc" }); }
  catch (errorValue) { error.value = message(errorValue); }
  finally { loading.value = false; }
}
function openNew() { editing.value = null; formError.value = ""; showForm.value = true; }
function openEdit(campus: Campus) { editing.value = campus; formError.value = ""; showForm.value = true; }
async function save(data: { codigoCampus: string; nombreCampus: string }) {
  saving.value = true; formError.value = "";
  try {
    if (editing.value) await updateCampus(editing.value.idCampus, { ...data, usuarioActualizacion: "backoffice" });
    else await createCampus({ ...data, usuarioRegistro: "backoffice" });
    showForm.value = false; success.value = editing.value ? "Campus actualizado correctamente." : "Campus creado correctamente."; await load();
  } catch (errorValue) { formError.value = message(errorValue); }
  finally { saving.value = false; }
}
async function toggle(campus: Campus) {
  confirmTarget.value = campus;
}
async function toggleConfirmed() {
  const campus = confirmTarget.value; if (!campus) return; confirmTarget.value = null;
  try { await updateCampusState(campus.idCampus, !campus.estadoCampus, "backoffice"); success.value = `Campus ${campus.estadoCampus ? "desactivado" : "activado"} correctamente.`; await load(); }
  catch (errorValue) { error.value = message(errorValue); }
}
watch(search, () => { page.value = 1; void load(); });
onMounted(() => void load());
</script>

<template>
    <AppBreadcrumb :items="[{ label: 'Administración', to: '/' }, { label: 'Accesos' }, { label: 'Campus' }]" />
    <PageHeader eyebrow="Accesos / Infraestructura" title="Campus" description="Administración de campus disponibles para la infraestructura SIGA." action-label="Nuevo campus" @action="openNew" />
    <div v-if="success" class="bo-notice bo-notice-success">{{ success }}</div><div v-if="error" class="bo-state bo-state-error">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
    <section class="bo-card">
      <form class="bo-toolbar" @submit.prevent="load"><input v-model="search" placeholder="Buscar por código o nombre..." aria-label="Buscar campus" /><button class="bo-btn bo-btn-primary" type="submit">Filtrar</button></form>
      <div v-if="loading" class="bo-state">Cargando campus...</div>
      <div v-else-if="!result.items.length" class="bo-state"><strong>No hay registros para mostrar.</strong><span>Ajuste la búsqueda o cree un nuevo campus.</span></div>
      <div v-else class="bo-table-wrap"><table><thead><tr><th>Código</th><th>Campus</th><th>Estado</th><th>Actualización</th><th>Acciones</th></tr></thead><tbody>
        <tr v-for="campus in result.items" :key="campus.idCampus"><td><strong>{{ campus.codigoCampus }}</strong></td><td>{{ campus.nombreCampus }}</td><td><StatusBadge :active="campus.estadoCampus" /></td><td>{{ campus.fechaActualizacion ? new Date(campus.fechaActualizacion).toLocaleDateString() : new Date(campus.fechaRegistro).toLocaleDateString() }}</td><td><div class="bo-actions"><button class="bo-action" @click="openEdit(campus)">Editar</button><button class="bo-action" :class="{ danger: campus.estadoCampus }" @click="toggle(campus)">{{ campus.estadoCampus ? "Desactivar" : "Activar" }}</button></div></td></tr>
      </tbody></table></div>
      <footer v-if="!loading" class="bo-pagination"><span>{{ result.pagination.total }} registros · Página {{ result.pagination.page }} de {{ Math.max(result.pagination.totalPages, 1) }}</span><div><button class="bo-page-button" :disabled="page <= 1" @click="page--; load()">Anterior</button><button class="bo-page-button" :disabled="page >= result.pagination.totalPages" @click="page++; load()">Siguiente</button></div></footer>
    </section>
    <div v-if="showForm" class="bo-modal-backdrop"><section class="bo-modal"><header><div><span class="bo-eyebrow">{{ editing ? "Editar registro" : "Nuevo registro" }}</span><h2>{{ editing ? "Editar campus" : "Crear campus" }}</h2></div><button class="bo-close" type="button" aria-label="Cerrar" @click="showForm = false">×</button></header><CampusForm :campus="editing" :saving="saving" :error="formError" @save="save" @cancel="showForm = false" /></section></div>
    <ConfirmDialog :open="Boolean(confirmTarget)" title="Cambiar estado del campus" :message="confirmTarget ? `¿Desea ${confirmTarget.estadoCampus ? 'desactivar' : 'activar'} este campus? Esta acción puede revertirse posteriormente.` : ''" :confirm-label="confirmTarget?.estadoCampus ? 'Desactivar' : 'Activar'" @confirm="toggleConfirmed" @cancel="confirmTarget = null" />
</template>
