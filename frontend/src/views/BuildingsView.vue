<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useAuthSession } from "@/composables/useAuthSession";
import { ApiError } from "@/services/http";
import { listCampusOptions, listBuildings, saveBuilding, toggleBuilding, type Building, type CampusOption } from "@/services/infrastructure";

const items = ref<Building[]>([]);
const campuses = ref<CampusOption[]>([]);
const search = ref("");
const estado = ref<"all" | "active" | "inactive">("all");
const page = ref(1);
const pageSize = 10;
const pagination = ref({ page: 1, pageSize, total: 0, totalPages: 0 });
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const formError = ref("");
const editing = ref<Building | null>(null);
const showForm = ref(false);
const confirmTarget = ref<Building | null>(null);
const form = ref({ idCampus: 0, codigoEdificio: "", nombreEdificio: "", direccionEdificio: "" });
const auth = useAuthSession();
const canManage = computed(() => auth.user.value?.permissions.includes("EDIFICIOS_ADMINISTRAR") ?? false);

const message = (value: unknown) => value instanceof ApiError ? value.message : "Ocurrió un error inesperado";

async function load() {
  loading.value = true; error.value = "";
  try { const result = await listBuildings(search.value, page.value, pageSize, estado.value); items.value = result.items; pagination.value = result.pagination; }
  catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
async function loadCampuses() {
  try { campuses.value = (await listCampusOptions()).items; }
  catch (cause) { error.value = message(cause); }
}
function edit(building: Building | null) { if (!canManage.value) return; editing.value = building; formError.value = ""; form.value = { idCampus: building?.idCampus ?? campuses.value.find((item) => item.estadoCampus)?.idCampus ?? 0, codigoEdificio: building?.codigoEdificio ?? "", nombreEdificio: building?.nombreEdificio ?? "", direccionEdificio: building?.direccionEdificio ?? "" }; showForm.value = true; }
async function save() {
  if (!canManage.value) return;
  formError.value = ""; saving.value = true;
  try { const creating = !editing.value; await saveBuilding(editing.value?.idEdificio ?? null, { ...form.value, direccionEdificio: form.value.direccionEdificio || null, ...(editing.value ? { usuarioActualizacion: "backoffice" } : { usuarioRegistro: "backoffice" }) }); showForm.value = false; success.value = creating ? "Edificio creado correctamente." : "Edificio actualizado correctamente."; await load(); }
  catch (cause) { formError.value = message(cause); }
  finally { saving.value = false; }
}
function askToggle(building: Building) { if (canManage.value) confirmTarget.value = building; }
async function toggle() { const target = confirmTarget.value; if (!target) return; confirmTarget.value = null; try { await toggleBuilding(target.idEdificio, !target.estadoEdificio); await load(); } catch (cause) { error.value = message(cause); } }
function changePage(nextPage: number) { page.value = nextPage; void load(); }
watch([search, estado], () => { page.value = 1; void load(); });
onMounted(() => { void Promise.all([load(), loadCampuses()]); });
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración', to: '/' }, { label: 'Accesos' }, { label: 'Edificios' }]" />
  <PageHeader eyebrow="Accesos / Infraestructura" title="Edificios" description="Administración de edificios asociados a un campus." :action-label="canManage ? 'Nuevo edificio' : undefined" @action="edit(null)" />
  <p v-if="!canManage" class="bo-form-note">Consulta de solo lectura. Para crear, editar o cambiar el estado se requiere el permiso EDIFICIOS_ADMINISTRAR.</p>
  <div v-if="success" class="bo-notice bo-notice-success">{{ success }}</div><div v-if="error" class="bo-state bo-state-error">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
  <section class="bo-card">
    <form class="bo-toolbar" @submit.prevent="load"><input v-model="search" placeholder="Buscar por código o nombre..." aria-label="Buscar edificios" /><select v-model="estado" aria-label="Filtrar por estado"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select><button class="bo-btn bo-btn-primary">Filtrar</button></form>
    <div v-if="loading" class="bo-state">Cargando edificios...</div>
    <div v-else-if="!items.length" class="bo-state"><strong>No hay edificios registrados.</strong><span>Ajuste la búsqueda{{ canManage ? ' o cree un nuevo edificio.' : '.' }}</span></div>
    <div v-else class="bo-table-wrap"><table><thead><tr><th>Código</th><th>Edificio</th><th>Campus</th><th>Estado</th><th v-if="canManage">Acciones</th></tr></thead><tbody><tr v-for="item in items" :key="item.idEdificio"><td><strong>{{ item.codigoEdificio }}</strong></td><td>{{ item.nombreEdificio }}</td><td>{{ item.nombreCampus }}</td><td><StatusBadge :active="item.estadoEdificio" /></td><td v-if="canManage"><div class="bo-actions"><button class="bo-action" @click="edit(item)">Editar</button><button class="bo-action" :class="{ danger: item.estadoEdificio }" @click="askToggle(item)">{{ item.estadoEdificio ? "Desactivar" : "Activar" }}</button></div></td></tr></tbody></table></div>
    <footer v-if="!loading" class="bo-pagination"><span>{{ pagination.total }} registros · Página {{ pagination.page }} de {{ Math.max(pagination.totalPages, 1) }}</span><div><button class="bo-page-button" :disabled="page <= 1" @click="changePage(page - 1)">Anterior</button><button class="bo-page-button" :disabled="page >= pagination.totalPages" @click="changePage(page + 1)">Siguiente</button></div></footer>
  </section>
  <div v-if="showForm && canManage" class="bo-modal-backdrop" @click.self="showForm = false"><section class="bo-modal"><header><div><span class="bo-eyebrow">{{ editing ? "Editar registro" : "Nuevo registro" }}</span><h2>{{ editing ? "Editar edificio" : "Crear edificio" }}</h2></div><button class="bo-close" type="button" @click="showForm = false">×</button></header><form class="bo-form" @submit.prevent="save"><div class="bo-form-grid"><label>Campus *<select v-model.number="form.idCampus" required><option :value="0" disabled>Seleccione...</option><option v-for="campus in campuses.filter(item => item.estadoCampus || item.idCampus === form.idCampus)" :key="campus.idCampus" :value="campus.idCampus">{{ campus.codigoCampus }} · {{ campus.nombreCampus }}</option></select></label><label>Código *<input v-model="form.codigoEdificio" maxlength="20" required /></label><label>Nombre *<input v-model="form.nombreEdificio" maxlength="150" required /></label><label class="bo-form-wide">Dirección<input v-model="form.direccionEdificio" maxlength="500" /></label></div><p v-if="formError" class="bo-form-error">{{ formError }}</p><footer><button class="bo-btn" type="button" @click="showForm = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="saving">{{ saving ? "Guardando..." : "Guardar" }}</button></footer></form></section></div>
  <ConfirmDialog :open="Boolean(confirmTarget) && canManage" title="Cambiar estado del edificio" :message="confirmTarget ? `¿Desea ${confirmTarget.estadoEdificio ? 'desactivar' : 'activar'} este edificio? Esta acción puede revertirse posteriormente.` : ''" :confirm-label="confirmTarget?.estadoEdificio ? 'Desactivar' : 'Activar'" @confirm="toggle" @cancel="confirmTarget = null" />
</template>
