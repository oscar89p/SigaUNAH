<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAuthSession } from "@/composables/useAuthSession";
import { ApiError } from "@/services/http";
import { changeSolicitudState, createSolicitud, getSolicitudOptions, listSolicitudes, updateSolicitud, type Solicitud, type SolicitudOptions, type SolicitudPayload, type SolicitudUpdatePayload } from "@/services/solicitudes";

const auth = useAuthSession();
const canCreate = computed(() => auth.user.value?.permissions.includes("SOLICITUDES_REGISTRAR") ?? false);
const canModify = computed(() => auth.user.value?.permissions.includes("SOLICITUDES_MODIFICAR") ?? false);
const canManageState = computed(() => auth.user.value?.permissions.includes("SOLICITUDES_GESTIONAR") ?? false);
const items = ref<Solicitud[]>([]);
const options = ref<SolicitudOptions>({ beneficiarios: [], tiposSolicitud: [], tiposVigencia: [], estadosSolicitud: [], periodos: [] });
const search = ref(""); const statusFilter = ref(""); const page = ref(1);
const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
const loading = ref(false); const saving = ref(false); const error = ref(""); const formError = ref(""); const success = ref("");
const editing = ref<Solicitud | null>(null); const showForm = ref(false);
const form = ref({ codigoSolicitud: "", idBeneficiario: 0, idPeriodoAcademico: null as number | null, idTipoSolicitud: null as number | null, idTipoVigencia: 0, idEstadoSolicitud: 0, fechaInicioSolicitada: "", fechaFinSolicitada: "", motivoSolicitud: "", origenSolicitud: "BACKOFFICE" });
const stateTarget = ref<Solicitud | null>(null); const showStateForm = ref(false); const confirmState = ref(false);
const nextStateId = ref(0); const stateReason = ref("");
const nextStateName = computed(() => options.value.estadosSolicitud.find(item => item.idTipoValor === nextStateId.value)?.nombreTipoValor ?? "estado seleccionado");
const message = (cause: unknown) => cause instanceof ApiError ? cause.message : "Ocurrió un error inesperado";

async function load() {
  loading.value = true; error.value = "";
  try {
    const result = await listSolicitudes(search.value, page.value, statusFilter.value ? Number(statusFilter.value) : undefined);
    items.value = result.items; pagination.value = result.pagination;
  } catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
async function loadOptions() { try { options.value = await getSolicitudOptions(); } catch (cause) { error.value = message(cause); } }
function edit(item: Solicitud | null) {
  if (item ? !canModify.value : !canCreate.value) return;
  editing.value = item; formError.value = "";
  form.value = {
    codigoSolicitud: item?.codigoSolicitud ?? "", idBeneficiario: item?.idBeneficiario ?? 0,
    idPeriodoAcademico: item?.idPeriodoAcademico ?? null, idTipoSolicitud: item?.idTipoSolicitud ?? null,
    idTipoVigencia: item?.idTipoVigencia ?? 0, idEstadoSolicitud: item?.idEstadoSolicitud ?? options.value.estadosSolicitud[0]?.idTipoValor ?? 0,
    fechaInicioSolicitada: item?.fechaInicioSolicitada?.slice(0, 10) ?? "", fechaFinSolicitada: item?.fechaFinSolicitada?.slice(0, 10) ?? "",
    motivoSolicitud: item?.motivoSolicitud ?? "", origenSolicitud: item?.origenSolicitud ?? "BACKOFFICE"
  };
  showForm.value = true;
}
function payload(): SolicitudPayload {
  return {
    codigoSolicitud: form.value.codigoSolicitud, idBeneficiario: form.value.idBeneficiario,
    idPeriodoAcademico: form.value.idPeriodoAcademico, idTipoSolicitud: form.value.idTipoSolicitud,
    idTipoVigencia: form.value.idTipoVigencia, idEstadoSolicitud: form.value.idEstadoSolicitud,
    fechaInicioSolicitada: form.value.fechaInicioSolicitada ? new Date(`${form.value.fechaInicioSolicitada}T00:00:00`) : null,
    fechaFinSolicitada: form.value.fechaFinSolicitada ? new Date(`${form.value.fechaFinSolicitada}T00:00:00`) : null,
    motivoSolicitud: form.value.motivoSolicitud || null, origenSolicitud: form.value.origenSolicitud
  };
}
function updatePayload(): SolicitudUpdatePayload {
  const data = payload();
  return {
    codigoSolicitud: data.codigoSolicitud, idBeneficiario: data.idBeneficiario,
    idPeriodoAcademico: data.idPeriodoAcademico, idTipoSolicitud: data.idTipoSolicitud,
    idTipoVigencia: data.idTipoVigencia, fechaInicioSolicitada: data.fechaInicioSolicitada,
    fechaFinSolicitada: data.fechaFinSolicitada, motivoSolicitud: data.motivoSolicitud, origenSolicitud: data.origenSolicitud
  };
}
async function save() {
  const permitted = editing.value ? canModify.value : canCreate.value;
  if (!permitted) return;
  formError.value = ""; saving.value = true;
  try {
    const id = editing.value?.idSolicitud;
    if (id) await updateSolicitud(id, updatePayload()); else await createSolicitud(payload());
    showForm.value = false; success.value = id ? "Solicitud actualizada correctamente." : "Solicitud creada correctamente."; await load();
  } catch (cause) { formError.value = message(cause); }
  finally { saving.value = false; }
}
function openStateChange(item: Solicitud) {
  if (!canManageState.value) return;
  stateTarget.value = item; nextStateId.value = 0; stateReason.value = ""; formError.value = ""; showStateForm.value = true;
}
function confirmStateChange() {
  if (!stateTarget.value || !nextStateId.value || nextStateId.value === stateTarget.value.idEstadoSolicitud) {
    formError.value = "Seleccione un estado distinto al actual."; return;
  }
  showStateForm.value = false; confirmState.value = true;
}
async function applyStateChange() {
  const item = stateTarget.value;
  if (!item || !canManageState.value) return;
  confirmState.value = false; saving.value = true; error.value = "";
  const actor = auth.user.value?.username ?? "backoffice";
  try {
    await changeSolicitudState(item.idSolicitud, nextStateId.value, stateReason.value.trim() || null, actor);
    stateTarget.value = null; success.value = `Estado de solicitud ${item.codigoSolicitud} cambiado a ${nextStateName.value}.`; await load();
  } catch (cause) { error.value = message(cause); }
  finally { saving.value = false; }
}
function changePage(nextPage: number) { page.value = nextPage; void load(); }
watch([search, statusFilter], () => { page.value = 1; void load(); });
onMounted(() => { void Promise.all([load(), loadOptions()]); });
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración', to: '/' }, { label: 'Operación' }, { label: 'Solicitudes' }]" />
  <PageHeader eyebrow="Operación" title="Solicitudes" description="Gestión de solicitudes de acceso vinculadas a beneficiarios reales." :action-label="canCreate ? 'Nueva solicitud' : undefined" @action="edit(null)" />
  <p v-if="!canCreate && !canModify && !canManageState" class="bo-form-note">Consulta de solo lectura. Los cambios requieren permisos separados de registro, modificación o gestión de estado.</p>
  <div v-if="success" class="bo-notice bo-notice-success" role="status">{{ success }}</div><div v-if="error" class="bo-state bo-state-error" role="alert">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
  <section class="bo-card">
    <form class="bo-toolbar" @submit.prevent="load"><input v-model="search" placeholder="Buscar por código, beneficiario o cuenta..." aria-label="Buscar solicitudes" /><select v-model="statusFilter" aria-label="Filtrar por estado"><option value="">Todos los estados</option><option v-for="item in options.estadosSolicitud" :key="item.idTipoValor" :value="String(item.idTipoValor)">{{ item.nombreTipoValor }}</option></select><button class="bo-btn bo-btn-primary">Filtrar</button></form>
    <div v-if="loading" class="bo-state" role="status">Cargando solicitudes...</div><div v-else-if="!items.length" class="bo-state"><strong>No hay solicitudes registradas.</strong><span>Ajuste la búsqueda{{ canCreate ? ' o cree una nueva solicitud.' : '.' }}</span></div>
     <div v-else class="bo-table-wrap"><table><thead><tr><th>Código</th><th>Beneficiario</th><th>Tipo</th><th>Fecha</th><th>Vigencia</th><th>Estado</th><th v-if="canModify || canManageState">Acciones</th></tr></thead><tbody><tr v-for="item in items" :key="item.idSolicitud"><td><strong>{{ item.codigoSolicitud }}</strong></td><td><span class="solicitud-beneficiario"><strong>{{ item.nombreBeneficiario }}</strong><small v-if="item.numeroIdentificacion">{{ item.numeroIdentificacion }}</small></span></td><td>{{ item.nombreTipoSolicitud ?? "-" }}</td><td>{{ new Date(item.fechaSolicitud).toLocaleDateString("es-HN") }}</td><td>{{ item.nombreTipoVigencia }}</td><td>{{ item.nombreEstadoSolicitud }}</td><td v-if="canModify || canManageState"><div class="bo-actions"><button v-if="canModify" class="bo-action" @click="edit(item)">Editar</button><button v-if="canManageState" class="bo-action" @click="openStateChange(item)">Cambiar estado</button></div></td></tr></tbody></table></div>
    <footer class="bo-pagination"><span>{{ pagination.total }} registros · Página {{ pagination.page }} de {{ Math.max(pagination.totalPages, 1) }}</span><div><button class="bo-page-button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Anterior</button><button class="bo-page-button" :disabled="page >= pagination.totalPages || loading" @click="changePage(page + 1)">Siguiente</button></div></footer>
  </section>
  <div v-if="showForm && (canCreate || canModify)" class="bo-modal-backdrop" @click.self="showForm = false"><section class="bo-modal"><header><div><span class="bo-eyebrow">{{ editing ? "Editar registro" : "Nuevo registro" }}</span><h2>{{ editing ? "Editar solicitud" : "Crear solicitud" }}</h2></div><button class="bo-close" type="button" @click="showForm = false">×</button></header><form class="bo-form" @submit.prevent="save"><div class="bo-form-grid"><label>Código de solicitud *<input v-model="form.codigoSolicitud" maxlength="30" required /></label><label>Beneficiario *<select v-model.number="form.idBeneficiario" required><option :value="0" disabled>Seleccione...</option><option v-for="item in options.beneficiarios" :key="item.idBeneficiario" :value="item.idBeneficiario">{{ item.nombreBeneficiario }} · {{ item.numeroCuenta ?? "Sin cuenta" }}</option></select></label><label>Tipo de solicitud<select v-model="form.idTipoSolicitud"><option :value="null">Sin tipo</option><option v-for="item in options.tiposSolicitud" :key="item.idTipoSolicitud" :value="item.idTipoSolicitud">{{ item.nombreTipoSolicitud }}</option></select></label><label>Período académico<select v-model="form.idPeriodoAcademico"><option :value="null">Sin período</option><option v-for="item in options.periodos" :key="item.idPeriodoAcademico" :value="item.idPeriodoAcademico">{{ item.codigoPeriodoAcademico }} · {{ item.nombrePeriodoAcademico }}</option></select></label><label>Tipo de vigencia *<select v-model.number="form.idTipoVigencia" required><option :value="0" disabled>Seleccione...</option><option v-for="item in options.tiposVigencia" :key="item.idTipoValor" :value="item.idTipoValor">{{ item.nombreTipoValor }}</option></select></label><label>Estado inicial *<select v-model.number="form.idEstadoSolicitud" required :disabled="Boolean(editing)"><option :value="0" disabled>Seleccione...</option><option v-for="item in options.estadosSolicitud" :key="item.idTipoValor" :value="item.idTipoValor">{{ item.nombreTipoValor }}</option></select><small v-if="editing">Los cambios de estado deben hacerse mediante “Cambiar estado” para conservar el historial.</small></label><label>Inicio solicitado<input v-model="form.fechaInicioSolicitada" type="date" /></label><label>Fin solicitado<input v-model="form.fechaFinSolicitada" type="date" :min="form.fechaInicioSolicitada || undefined" /></label><label>Origen *<input v-model="form.origenSolicitud" maxlength="30" required /></label><label class="bo-form-wide">Motivo<textarea v-model="form.motivoSolicitud" maxlength="1500" rows="3" /></label></div><p v-if="formError" class="bo-form-error" role="alert">{{ formError }}</p><footer><button class="bo-btn" type="button" @click="showForm = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="saving || (editing ? !canModify : !canCreate)">{{ saving ? "Guardando..." : "Guardar" }}</button></footer></form></section></div>
  <div v-if="showStateForm && stateTarget" class="bo-modal-backdrop" @click.self="showStateForm = false"><section class="bo-modal"><header><div><span class="bo-eyebrow">{{ stateTarget.codigoSolicitud }}</span><h2>Cambiar estado</h2></div><button class="bo-close" type="button" @click="showStateForm = false">×</button></header><form class="bo-form" @submit.prevent="confirmStateChange"><label>Nuevo estado *<select v-model.number="nextStateId" required><option :value="0" disabled>Seleccione...</option><option v-for="item in options.estadosSolicitud.filter(option => option.idTipoValor !== stateTarget?.idEstadoSolicitud)" :key="item.idTipoValor" :value="item.idTipoValor">{{ item.nombreTipoValor }}</option></select></label><label>Motivo del cambio<textarea v-model="stateReason" maxlength="1000" rows="3" /></label><p v-if="formError" class="bo-form-error" role="alert">{{ formError }}</p><footer><button class="bo-btn" type="button" @click="showStateForm = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="saving">Continuar</button></footer></form></section></div>
  <ConfirmDialog :open="confirmState" title="Confirmar transición" :message="stateTarget ? `¿Confirma cambiar ${stateTarget.codigoSolicitud} a ${nextStateName}? La operación agregará una entrada al historial de estados.` : ''" confirm-label="Cambiar estado" :busy="saving" @confirm="applyStateChange" @cancel="confirmState = false" />
</template>

<style scoped>
.solicitud-beneficiario { display: grid; gap: 3px; min-width: 150px; white-space: normal; }.solicitud-beneficiario strong { color: var(--bo-dark); font-weight: 700; }.solicitud-beneficiario small { color: var(--bo-muted); font-size: 11px; line-height: 1.2; }
</style>
