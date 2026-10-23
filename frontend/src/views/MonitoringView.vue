<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import PageHeader from "@/components/PageHeader.vue";
import { listAccessEvents, listAccessIncidents, type AccessEvent, type AccessIncident } from "@/services/monitoreo";

type Section = "accesos" | "incidentes";
const section = ref<Section>("accesos"); const search = ref(""); const desde = ref(""); const hasta = ref(""); const resultado = ref(""); const incidenteStatus = ref("all"); const severidad = ref("");
const accessItems = ref<AccessEvent[]>([]); const incidentItems = ref<AccessIncident[]>([]);
const page = ref(1); const pagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 }); const loading = ref(false); const error = ref("");
const message = (cause: unknown) => cause instanceof Error ? cause.message : "Ocurrió un error inesperado";
async function load() {
  loading.value = true; error.value = "";
  try {
    const query = { page: page.value, pageSize: 10, search: search.value, desde: desde.value, hasta: hasta.value };
    if (section.value === "accesos") {
      const result = await listAccessEvents({ ...query, resultado: resultado.value });
      accessItems.value = result.items; pagination.value = result.pagination;
    } else {
      const result = await listAccessIncidents({ ...query, severidad: severidad.value, resuelto: incidenteStatus.value });
      incidentItems.value = result.items; pagination.value = result.pagination;
    }
  } catch (cause) { error.value = message(cause); }
  finally { loading.value = false; }
}
function selectSection(value: Section) { if (section.value === value) return; section.value = value; page.value = 1; void load(); }
function changePage(value: number) { page.value = value; void load(); }
watch([search, desde, hasta, resultado, incidenteStatus, severidad], () => { page.value = 1; void load(); });
onMounted(() => void load());
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Operación' }, { label: 'Monitoreo' }]" />
  <PageHeader eyebrow="Operación" title="Monitoreo" description="Consulta de registros de acceso e incidentes guardados en SQL Server." action-label="Actualizar" @action="load" />
  <div class="bo-monitor-tabs" role="tablist" aria-label="Datos de monitoreo"><button type="button" role="tab" :aria-selected="section === 'accesos'" :class="{ active: section === 'accesos' }" @click="selectSection('accesos')">Registros de acceso</button><button type="button" role="tab" :aria-selected="section === 'incidentes'" :class="{ active: section === 'incidentes' }" @click="selectSection('incidentes')">Incidentes</button></div>
  <section class="bo-card">
    <form class="bo-toolbar bo-toolbar-wrap" @submit.prevent="page = 1; load()"><input v-model="search" placeholder="Buscar tarjeta, dispositivo, beneficiario o evento..." aria-label="Buscar eventos" /><input v-model="desde" type="date" aria-label="Fecha desde" /><input v-model="hasta" type="date" aria-label="Fecha hasta" /><input v-if="section === 'accesos'" v-model="resultado" maxlength="30" placeholder="Resultado" aria-label="Resultado de acceso" /><template v-else><input v-model="severidad" maxlength="20" placeholder="Severidad" aria-label="Severidad" /><select v-model="incidenteStatus" aria-label="Estado del incidente"><option value="all">Todos</option><option value="open">Abiertos</option><option value="resolved">Resueltos</option></select></template><button class="bo-btn bo-btn-primary">Filtrar</button></form>
    <div v-if="error" class="bo-state bo-state-error" role="alert">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
    <div v-else-if="loading" class="bo-state" role="status">Cargando registros...</div>
    <div v-else-if="section === 'accesos' && !accessItems.length" class="bo-state"><strong>No hay registros de acceso para estos filtros.</strong><span>Se muestran eventos persistidos; no se generan datos de ejemplo.</span></div>
    <div v-else-if="section === 'incidentes' && !incidentItems.length" class="bo-state"><strong>No hay incidentes para estos filtros.</strong><span>Se muestran incidentes persistidos; no se generan datos de ejemplo.</span></div>
     <div v-else-if="section === 'accesos'" class="bo-table-wrap bo-monitor-grid"><table><thead><tr><th>Fecha</th><th>Resultado</th><th>Tarjeta</th><th>Beneficiario</th><th>Dispositivo / elevador</th><th>Movimiento</th></tr></thead><tbody><tr v-for="item in accessItems" :key="item.idRegistroAcceso"><td>{{ new Date(item.fechaHoraAcceso).toLocaleString('es-HN') }}</td><td>{{ item.resultadoAcceso }}<small v-if="item.codigoResultado">{{ item.codigoResultado }}</small></td><td>{{ item.codigoTarjeta ?? 'Sin tarjeta' }}</td><td>{{ item.nombreBeneficiario ?? 'No identificado' }}</td><td>{{ item.codigoDispositivo ?? 'Sin dispositivo' }}<small v-if="item.codigoElevador">{{ item.codigoElevador }}</small></td><td>{{ item.direccionMovimiento ?? '—' }}<small v-if="item.pisoOrigen !== null || item.pisoDestino !== null">{{ item.pisoOrigen ?? '—' }} → {{ item.pisoDestino ?? '—' }}</small></td></tr></tbody></table></div>
     <div v-else class="bo-table-wrap bo-monitor-grid"><table><thead><tr><th>Fecha</th><th>Código / tipo</th><th>Severidad</th><th>Descripción</th><th>Relacionado</th><th>Estado</th></tr></thead><tbody><tr v-for="item in incidentItems" :key="item.idIncidenteAcceso"><td>{{ new Date(item.fechaIncidenteAcceso).toLocaleString('es-HN') }}</td><td><strong>{{ item.codigoIncidenteAcceso }}</strong><small>{{ item.tipoIncidenteAcceso }}</small></td><td>{{ item.nivelSeveridadIncidenteAcceso }}</td><td class="bo-monitor-description">{{ item.descripcionIncidenteAcceso }}</td><td>{{ item.codigoTarjeta ?? item.codigoDispositivo ?? item.nombreBeneficiario ?? '—' }}</td><td>{{ item.resueltoIncidenteAcceso ? 'Resuelto' : 'Abierto' }}<small v-if="item.fechaResolucionIncidenteAcceso">{{ new Date(item.fechaResolucionIncidenteAcceso).toLocaleDateString('es-HN') }}</small></td></tr></tbody></table></div>
     <footer v-if="!loading && !error && pagination.total" class="bo-pagination bo-monitor-pagination"><span>Mostrando {{ ((pagination.page - 1) * pagination.pageSize) + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} de {{ pagination.total }} registros</span><div><button class="bo-page-button" :disabled="page <= 1" @click="changePage(page - 1)">Anterior</button><span>Página {{ pagination.page }} de {{ Math.max(pagination.totalPages, 1) }}</span><button class="bo-page-button" :disabled="page >= pagination.totalPages" @click="changePage(page + 1)">Siguiente</button></div></footer>
  </section>
  <p class="bo-form-note">Vista de solo lectura respaldada por `Operaciones.tblRegistrosAcceso` y `Operaciones.tblIncidentesAcceso`. La ingestión de eventos depende de los procesos de integración/dispositivo; una tabla vacía no se completa con valores simulados.</p>
</template>

<style scoped>
.bo-monitor-tabs { display: flex; gap: 4px; overflow-x: auto; margin-bottom: 12px; padding: 4px; border: 1px solid var(--bo-line); border-radius: 9px; background: #fff; }
.bo-monitor-tabs button { padding: 9px 13px; border: 0; border-radius: 6px; color: var(--bo-muted); background: transparent; cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; }
.bo-monitor-tabs button.active { color: var(--bo-dark); background: #e8f2f7; }
.bo-monitor-description { max-width: 320px; white-space: normal !important; }
.bo-monitor-grid { max-width: 100%; overflow-x: auto; }
.bo-monitor-grid table { min-width: 900px; table-layout: fixed; }
.bo-monitor-grid th, .bo-monitor-grid td { height: 48px; vertical-align: middle; }
.bo-monitor-grid th:nth-child(1), .bo-monitor-grid td:nth-child(1) { width: 16%; }
.bo-monitor-grid th:nth-child(2), .bo-monitor-grid td:nth-child(2) { width: 16%; }
.bo-monitor-grid th:nth-child(3), .bo-monitor-grid td:nth-child(3) { width: 14%; }
.bo-monitor-grid th:nth-child(4), .bo-monitor-grid td:nth-child(4) { width: 22%; }
.bo-monitor-grid th:nth-child(5), .bo-monitor-grid td:nth-child(5) { width: 18%; }
.bo-monitor-grid th:nth-child(6), .bo-monitor-grid td:nth-child(6) { width: 14%; }
.bo-monitor-grid td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bo-monitor-grid td small { display: block; overflow: hidden; color: var(--bo-muted); text-overflow: ellipsis; white-space: nowrap; }
.bo-monitor-pagination { min-height: 58px; }
.bo-monitor-pagination > div { display: flex; align-items: center; gap: 8px; }
.bo-monitor-pagination > div span { color: var(--bo-text); font-weight: 700; }
@media (max-width: 720px) { .bo-monitor-pagination { align-items: flex-start; flex-direction: column; } }
</style>
