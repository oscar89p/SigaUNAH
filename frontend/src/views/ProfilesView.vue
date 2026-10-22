<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { createAdminProfile, getAdminProfile, listAdminProfiles, setAdminProfileState, updateAdminProfile, type Profile } from "@/services/administracion";

const items = ref<Profile[]>([]); const search = ref(""); const estado = ref("all"); const page = ref(1);
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 }); const loading = ref(false); const saving = ref(false); const error = ref(""); const success = ref("");
const editing = ref<Profile | null>(null); const showForm = ref(false); const confirmTarget = ref<Profile | null>(null);
const form = ref({ codigoPerfil: "", nombrePerfil: "", descripcionPerfil: "" });
const viewing = ref<Profile | null>(null); const detailLoading = ref(false); const detailError = ref("");
const message = (value: unknown) => value instanceof Error ? value.message : "Ocurrió un error inesperado";
async function load() { loading.value = true; error.value = ""; try { const result = await listAdminProfiles({ page: page.value, pageSize: 10, search: search.value, estado: estado.value }); items.value = result.items; pagination.value = result.pagination; } catch (e) { error.value = message(e); } finally { loading.value = false; } }
function edit(item: Profile | null) { editing.value = item; form.value = { codigoPerfil: item?.codigoPerfil ?? "", nombrePerfil: item?.nombrePerfil ?? "", descripcionPerfil: item?.descripcionPerfil ?? "" }; showForm.value = true; }
async function saveProfile() { saving.value = true; error.value = ""; try { const payload = { ...form.value, descripcionPerfil: form.value.descripcionPerfil || null }; if (editing.value) await updateAdminProfile(editing.value.idPerfil, payload); else await createAdminProfile(payload); showForm.value = false; success.value = "Perfil guardado correctamente."; await load(); } catch (e) { error.value = message(e); } finally { saving.value = false; } }
async function openDetail(item: Profile) { viewing.value = item; detailLoading.value = true; detailError.value = ""; try { viewing.value = await getAdminProfile(item.idPerfil); } catch (e) { detailError.value = message(e); } finally { detailLoading.value = false; } }
function askToggle(item: Profile) { confirmTarget.value = item; }
async function toggle() { const item = confirmTarget.value; confirmTarget.value = null; if (!item) return; try { await setAdminProfileState(item.idPerfil, !item.estadoPerfil); success.value = `Perfil ${item.estadoPerfil ? "desactivado" : "activado"}.`; await load(); } catch (e) { error.value = message(e); } }
function changePage(value: number) { page.value = value; void load(); }
watch([search, estado], () => { page.value = 1; void load(); }); onMounted(() => void load());
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración' }, { label: 'Perfiles' }]" />
  <PageHeader eyebrow="Administración" title="Perfiles" description="Administre perfiles, usuarios y privilegios asignados." action-label="Nuevo perfil" @action="edit(null)" />
  <div v-if="success" class="bo-notice bo-notice-success" role="status">{{ success }}</div><div v-if="error" class="bo-state bo-state-error" role="alert">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
  <section class="bo-card"><form class="bo-toolbar" @submit.prevent="load"><input v-model="search" placeholder="Buscar código, nombre o descripción..." aria-label="Buscar perfiles" /><select v-model="estado" aria-label="Estado"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select><button class="bo-btn bo-btn-primary">Buscar</button></form>
    <div v-if="loading" class="bo-state" role="status">Cargando perfiles...</div><div v-else-if="!items.length" class="bo-state"><strong>No hay perfiles.</strong><span>Pruebe otro filtro o cree un perfil.</span></div>
    <div v-else class="bo-table-wrap bo-profile-table"><table><thead><tr><th>Perfil</th><th>Usuarios</th><th>Permisos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody><tr v-for="item in items" :key="item.idPerfil"><td class="bo-profile-name"><strong>{{ item.nombrePerfil }}</strong><small>{{ item.codigoPerfil }} · {{ item.descripcionPerfil || 'Sin descripción' }}</small></td><td>{{ item.usuarios }}</td><td>{{ item.permisos }}</td><td><StatusBadge :active="item.estadoPerfil" /></td><td><div class="bo-actions bo-profile-actions"><RouterLink class="bo-action" :to="`/administracion/perfiles/${item.idPerfil}/configuracion`">Configurar</RouterLink><button class="bo-action" @click="openDetail(item)">Ver</button><button class="bo-action" @click="edit(item)">Editar</button><button class="bo-action" :class="{ danger: item.estadoPerfil }" @click="askToggle(item)">{{ item.estadoPerfil ? 'Desactivar' : 'Activar' }}</button></div></td></tr></tbody></table></div>
    <footer class="bo-pagination"><span>{{ pagination.total }} perfiles · Página {{ pagination.page }} de {{ Math.max(pagination.totalPages, 1) }}</span><div><button class="bo-page-button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Anterior</button><button class="bo-page-button" :disabled="page >= pagination.totalPages || loading" @click="changePage(page + 1)">Siguiente</button></div></footer>
  </section>
  <div v-if="showForm" class="bo-modal-backdrop" @click.self="showForm = false"><section class="bo-modal"><header><div><span class="bo-eyebrow">Administración de perfiles</span><h2>{{ editing ? 'Editar perfil' : 'Crear perfil' }}</h2></div><button class="bo-close" type="button" aria-label="Cerrar" @click="showForm = false">×</button></header><form class="bo-form" @submit.prevent="saveProfile"><label>Código *<input v-model="form.codigoPerfil" maxlength="30" pattern="[A-Za-z0-9_-]+" required /></label><label>Nombre *<input v-model="form.nombrePerfil" maxlength="100" required /></label><label>Descripción<textarea v-model="form.descripcionPerfil" maxlength="500" rows="3" /></label><footer class="bo-form-actions"><button class="bo-btn" type="button" @click="showForm = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="saving">{{ saving ? 'Guardando...' : 'Guardar' }}</button></footer></form></section></div>
  <div v-if="viewing" class="bo-modal-backdrop" @click.self="viewing = null"><section class="bo-modal bo-profile-detail" role="dialog" aria-modal="true"><header><div><span class="bo-eyebrow">Consulta de perfil</span><h2>{{ viewing.nombrePerfil }}</h2></div><button class="bo-close" type="button" aria-label="Cerrar" @click="viewing = null">×</button></header><div v-if="detailLoading" class="bo-state">Cargando perfil...</div><p v-else-if="detailError" class="bo-form-error" role="alert">{{ detailError }}</p><dl v-else class="bo-profile-detail-grid"><dt>Código</dt><dd>{{ viewing.codigoPerfil }}</dd><dt>Descripción</dt><dd>{{ viewing.descripcionPerfil || 'Sin descripción' }}</dd><dt>Estado</dt><dd>{{ viewing.estadoPerfil ? 'Activo' : 'Inactivo' }}</dd><dt>Usuarios asociados</dt><dd>{{ viewing.usuarios }}</dd><dt>Permisos asignados</dt><dd>{{ viewing.permisos }}</dd><dt>Fecha de registro</dt><dd>{{ new Date(viewing.fechaRegistro).toLocaleString() }}</dd></dl></section></div>
  <ConfirmDialog :open="Boolean(confirmTarget)" title="Cambiar estado del perfil" :message="confirmTarget ? `¿Desea ${confirmTarget.estadoPerfil ? 'desactivar' : 'activar'} el perfil ${confirmTarget.nombrePerfil}?` : ''" :confirm-label="confirmTarget?.estadoPerfil ? 'Desactivar' : 'Activar'" @confirm="toggle" @cancel="confirmTarget = null" />
</template>

<style scoped>
.bo-profile-table table { min-width: 0; table-layout: fixed; }
.bo-profile-table th:nth-child(1) { width: 30%; }
.bo-profile-table th:nth-child(2), .bo-profile-table th:nth-child(3) { width: 8%; }
.bo-profile-table th:nth-child(4) { width: 12%; }
.bo-profile-table th:nth-child(5) { width: 42%; }
.bo-profile-table th, .bo-profile-table td { padding: 10px 9px; white-space: normal; }
.bo-profile-name strong, .bo-profile-name small { display: block; }
.bo-profile-name small { margin-top: 4px; color: var(--bo-muted); line-height: 1.35; overflow-wrap: anywhere; }
.bo-profile-actions { flex-wrap: wrap; }
.bo-profile-actions .bo-action { white-space: nowrap; text-decoration: none; }
.bo-profile-detail-grid { display: grid; grid-template-columns: 150px minmax(0,1fr); margin: 0; font-size: 12px; }
.bo-profile-detail-grid dt, .bo-profile-detail-grid dd { min-width: 0; margin: 0; padding: 10px; border-bottom: 1px solid var(--bo-line); overflow-wrap: anywhere; }
.bo-profile-detail-grid dt { color: var(--bo-muted); font-weight: 700; }
@media (max-width: 900px) { .bo-profile-table th:nth-child(1) { width: 25%; }.bo-profile-table th:nth-child(5) { width: 47%; } }
@media (max-width: 680px) { .bo-profile-table table { min-width: 650px; }.bo-profile-table th, .bo-profile-table td { padding: 9px 6px; }.bo-profile-actions { gap: 4px; }.bo-profile-actions .bo-action { padding: 5px 6px; font-size: 10px; } }
</style>
