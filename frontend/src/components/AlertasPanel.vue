<script setup lang="ts">
import { onMounted, ref } from "vue";
import DataGrid, { type GridColumn } from "@/components/DataGrid.vue";
import { ApiError } from "@/services/http";
import { getAlertSummary, listAlerts, type AlertPage, type AlertType, type AlertSummary } from "@/services/alertas";

const types: Array<{ id: AlertType; label: string }> = [
  { id: "pending", label: "Solicitudes pendientes" },
  { id: "approved", label: "Aprobadas sin asignación" },
  { id: "upcoming", label: "Próximas a vencer" },
  { id: "expired", label: "Vencidas" },
  { id: "inconsistency", label: "Inconsistencias operativas" }
];

const indicators: Array<{ id: AlertType; label: string; icon: string; total: (summary: AlertSummary) => number | string }> = [
  { id: "pending", label: "Solicitudes pendientes", icon: "!", total: summary => summary.totals.solicitudesPendientes },
  { id: "approved", label: "Aprobadas sin asignación", icon: "✓", total: summary => summary.totals.aprobadasSinAsignacion },
  { id: "upcoming", label: "Próximas a vencer", icon: "◷", total: summary => summary.totals.asignacionesProximas },
  { id: "expired", label: "Vencidas", icon: "⚠", total: summary => summary.totals.asignacionesVencidas },
  { id: "inconsistency", label: "Inconsistencias operativas", icon: "≋", total: summary => summary.totals.inconsistenciasOperativas }
];

const columns: GridColumn[] = [
  { key: "codigoSolicitud", label: "Solicitud", width: "13%" },
  { key: "nombreBeneficiario", label: "Beneficiario", width: "20%" },
  { key: "codigoTarjeta", label: "Tarjeta", width: "14%" },
  { key: "motivoInconsistencia", label: "Condición", width: "25%" },
  { key: "fecha", label: "Fecha", width: "13%" },
  { key: "dias", label: "Días", width: "10%" },
  { key: "prioridad", label: "Prioridad", width: "12%" }
];

const summary = ref<AlertSummary | null>(null);
const data = ref<AlertPage>({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
const selected = ref<AlertType>("pending");
const search = ref("");
const loading = ref(false);
const error = ref("");

const message = (cause: unknown) => cause instanceof ApiError ? cause.message : "No fue posible cargar las alertas.";

function formatDate(value: unknown): string {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function rows() {
  return data.value.items.map(item => ({
    ...item,
    fecha: formatDate(item.fechaSolicitud ?? item.fechaResolucion ?? item.fechaFinVigencia),
    dias: item.diasAntiguedad ?? item.diasRestantes ?? "—"
  }));
}

function priorityClass(value: unknown): string {
  return `priority-${String(value ?? "").toLowerCase()}`;
}

async function load(page = 1) {
  loading.value = true;
  error.value = "";
  try {
    data.value = await listAlerts(selected.value, page, search.value);
  } catch (cause) {
    error.value = message(cause);
  } finally {
    loading.value = false;
  }
}

async function change(type: AlertType) {
  selected.value = type;
  await load(1);
}

onMounted(async () => {
  try {
    summary.value = await getAlertSummary();
    await load();
  } catch (cause) {
    error.value = message(cause);
  }
});
</script>

<template>
  <section class="bo-card alertas-panel">
    <div v-if="summary" class="alertas-indicators" aria-label="Indicadores de alertas">
      <button v-for="item in indicators" :key="item.id" type="button" class="alertas-indicator" :class="[`alertas-indicator--${item.id}`, { active: selected === item.id }]" @click="change(item.id)">
        <span class="alertas-indicator-icon" aria-hidden="true">{{ item.icon }}</span>
        <span class="alertas-indicator-copy"><small>{{ item.label }}</small><strong>{{ item.total(summary) }}</strong></span>
      </button>
    </div>

    <section v-if="summary" class="alertas-thresholds" aria-labelledby="alertas-thresholds-title">
      <div class="alertas-section-heading"><span class="alertas-section-mark" aria-hidden="true">i</span><div><h2 id="alertas-thresholds-title">Parámetros institucionales</h2><p>Umbrales vigentes para la clasificación de alertas.</p></div></div>
      <div class="alertas-threshold-list"><span>Media: <strong>{{ summary.thresholds.pendingMediumDays }} días</strong></span><span>Alta: <strong>{{ summary.thresholds.pendingHighDays }} días</strong></span><span>Próxima a vencer: <strong>{{ summary.thresholds.assignmentUpcomingDays }} días</strong></span><span>Aprobada sin asignación: <strong>{{ summary.thresholds.approvedWithoutAssignmentDays }} días</strong></span></div>
    </section>

    <nav class="alertas-categories" aria-label="Tipos de alerta">
      <span class="alertas-categories-label">Categoría</span>
      <div class="alertas-category-list"><button v-for="item in types" :key="item.id" type="button" :class="{ active: selected === item.id }" @click="change(item.id)">{{ item.label }}</button></div>
    </nav>

    <form class="alertas-toolbar" @submit.prevent="load(1)">
      <label for="alertas-search">Buscar</label>
      <input id="alertas-search" v-model="search" placeholder="Solicitud, tarjeta o beneficiario" />
      <button class="bo-btn bo-btn-primary" type="submit">Actualizar</button>
    </form>

    <DataGrid :columns="columns" :rows="rows()" :pagination="data.pagination" :loading="loading" :error="error" :row-key="row => String(row.idSolicitud ?? row.idAsignacion ?? row.idTarjeta ?? '')" @page="load">
      <template #cell-prioridad="{ value }"><span class="alertas-priority" :class="priorityClass(value)">{{ value ?? "—" }}</span></template>
    </DataGrid>
  </section>
</template>

<style scoped>
.alertas-panel { overflow: visible; }
.alertas-indicators { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.alertas-indicator { display: flex; min-width: 0; align-items: center; gap: 11px; padding: 15px 13px; border: 1px solid var(--bo-line); border-radius: 10px; color: var(--bo-text); text-align: left; background: #fff; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
.alertas-indicator:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgb(24 53 72 / 8%); }
.alertas-indicator.active { border-color: var(--bo-primary); box-shadow: 0 0 0 2px rgb(0 90 135 / 12%); }
.alertas-indicator-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 9px; font-size: 18px; font-weight: 800; }
.alertas-indicator-copy { display: grid; min-width: 0; gap: 5px; }
.alertas-indicator small { overflow: hidden; color: var(--bo-muted); font-size: 10px; font-weight: 700; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.alertas-indicator strong { color: var(--bo-dark); font-size: 23px; line-height: 1; }
.alertas-indicator--pending { background: #f3f8fc; }.alertas-indicator--pending .alertas-indicator-icon { color: #176596; background: #dcecf7; }
.alertas-indicator--approved { background: #fffbf1; }.alertas-indicator--approved .alertas-indicator-icon { color: #9a6a00; background: #fff0c7; }
.alertas-indicator--upcoming { background: #f8f5ff; }.alertas-indicator--upcoming .alertas-indicator-icon { color: #6948a5; background: #e9ddff; }
.alertas-indicator--expired { background: #fff6f5; }.alertas-indicator--expired .alertas-indicator-icon { color: #a83936; background: #f9dedd; }
.alertas-indicator--inconsistency { background: #f1fbfa; }.alertas-indicator--inconsistency .alertas-indicator-icon { color: #167b78; background: #d4f0ed; }
.alertas-thresholds { margin-bottom: 18px; padding: 15px 16px; border: 1px solid #dbe7ed; border-radius: 10px; background: #f7fafc; }
.alertas-section-heading { display: flex; align-items: center; gap: 10px; }.alertas-section-mark { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; color: #176596; background: #dcecf7; font-size: 13px; font-weight: 800; }.alertas-section-heading h2 { margin: 0; color: var(--bo-dark); font-size: 14px; }.alertas-section-heading p { margin: 3px 0 0; color: var(--bo-muted); font-size: 11px; }
.alertas-threshold-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 13px; }.alertas-threshold-list span { padding: 7px 10px; border: 1px solid #dce6eb; border-radius: 6px; color: var(--bo-muted); background: #fff; font-size: 11px; }.alertas-threshold-list strong { color: var(--bo-dark); }
.alertas-categories { display: grid; gap: 9px; margin-bottom: 14px; }.alertas-categories-label { color: var(--bo-dark); font-size: 11px; font-weight: 800; }.alertas-category-list { display: flex; flex-wrap: wrap; gap: 8px; }.alertas-category-list button { padding: 9px 12px; border: 1px solid var(--bo-line); border-radius: 7px; color: var(--bo-text); background: #f8fafb; cursor: pointer; font: inherit; font-size: 11px; font-weight: 700; }.alertas-category-list button:hover { border-color: var(--bo-primary); }.alertas-category-list button.active { border-color: var(--bo-primary); color: #fff; background: var(--bo-primary); }
.alertas-toolbar { display: flex; align-items: end; gap: 10px; margin-bottom: 14px; padding: 13px 14px; border: 1px solid var(--bo-line); border-radius: 8px; background: #fbfcfd; }.alertas-toolbar label { color: var(--bo-dark); font-size: 11px; font-weight: 800; }.alertas-toolbar input { width: min(100%, 360px); min-height: 37px; box-sizing: border-box; padding: 0 10px; border: 1px solid var(--bo-line); border-radius: 7px; color: var(--bo-text); background: #fff; font: inherit; font-size: 12px; }.alertas-toolbar input:focus { outline: 2px solid rgb(0 90 135 / 16%); border-color: var(--bo-primary); }.alertas-toolbar .bo-btn { min-height: 37px; }
.alertas-priority { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: .03em; }.priority-informativa { color: #176596; background: #dcecf7; }.priority-media { color: #8a6200; background: #fff0c7; }.priority-alta { color: #a83936; background: #f9dedd; }.alertas-panel :deep(.siga-grid-cell-fecha) { white-space: nowrap; }
@media (max-width: 1050px) { .alertas-indicators { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 650px) { .alertas-indicators { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }.alertas-indicator { padding: 12px 10px; }.alertas-indicator-icon { width: 30px; height: 30px; flex-basis: 30px; }.alertas-indicator strong { font-size: 20px; }.alertas-threshold-list { display: grid; grid-template-columns: 1fr 1fr; }.alertas-category-list { display: grid; grid-template-columns: 1fr; }.alertas-category-list button { text-align: left; }.alertas-toolbar { align-items: stretch; flex-direction: column; }.alertas-toolbar input { width: 100%; }.alertas-toolbar .bo-btn { width: 100%; } }
@media (max-width: 390px) { .alertas-indicators { grid-template-columns: 1fr; }.alertas-threshold-list { grid-template-columns: 1fr; } }
</style>
