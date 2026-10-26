<script setup lang="ts">
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import DataGrid, { type GridColumn } from "@/components/DataGrid.vue";
import PageHeader from "@/components/PageHeader.vue";
import { useBeneficiarySearch } from "@/composables/useBeneficiarySearch";
import type { BeneficiarySearchResult } from "@/services/beneficiarios";

defineProps<{ currentSelection?: { idBeneficiario: number; nombreCompleto: string } | null }>();
const emit = defineEmits<{ select: [BeneficiarySearchResult]; back: [] }>();
const { search, results, resultPagination: pagination, resultLoading: loading, resultError: error, searchNow, clearSearch, findBeneficiaries } = useBeneficiarySearch();
let timer: ReturnType<typeof setTimeout> | undefined; let controller: AbortController | undefined; let sequence = 0;
const columns: GridColumn[] = [{ key: "nombreCompleto", label: "Nombre completo", width: "28%" }, { key: "identificacionEnmascarada", label: "Identificación", width: "18%" }, { key: "codigoBeneficiario", label: "Código", width: "15%" }, { key: "cuentaEnmascarada", label: "Cuenta", width: "18%" }, { key: "estadoBeneficiario", label: "Estado", width: "12%" }];
const rows = () => results.value as unknown as Record<string, unknown>[];
const rowKey = (row: Record<string, unknown>) => String(row.idBeneficiario);
const masked = (value: string | null) => value ?? "No disponible";

function changePage(nextPage: number) { void findBeneficiaries(nextPage); }
function select(item: BeneficiarySearchResult) { emit("select", item); }
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración', to: '/' }, { label: 'Operación' }, { label: 'Solicitudes' }, { label: 'Seleccionar beneficiario' }]" />
  <PageHeader eyebrow="Operación / Solicitudes" title="Seleccionar beneficiario" description="Busque un beneficiario activo por nombre, identificación, código o cuenta." />
  <section class="bo-card beneficiary-search-panel"><form class="bo-toolbar" @submit.prevent="searchNow"><input v-model="search" placeholder="Buscar por nombre o identificación..." aria-label="Buscar beneficiario" autocomplete="off" /><button class="bo-btn bo-btn-primary">Buscar</button><button type="button" class="bo-btn" @click="clearSearch">Limpiar</button></form><p v-if="currentSelection" class="bo-form-note">Selección actual: <strong>{{ currentSelection.nombreCompleto }}</strong>. Puede elegir otro beneficiario o regresar sin cambiarla.</p><DataGrid :columns="columns" :rows="rows()" :row-key="rowKey" :pagination="pagination" :loading="loading" :error="error" empty-text="Escriba al menos dos caracteres para buscar beneficiarios." @page="changePage"><template #cell-identificacionEnmascarada="{ row }">{{ masked(row.identificacionEnmascarada as string | null) }}</template><template #cell-cuentaEnmascarada="{ row }">{{ masked(row.cuentaEnmascarada as string | null) }}</template><template #cell-estadoBeneficiario>Activo</template><template #actions="{ row }"><button class="bo-action" @click="select(row as unknown as BeneficiarySearchResult)">Seleccionar</button></template></DataGrid><footer class="beneficiary-search-actions"><button class="bo-btn" type="button" @click="emit('back')">Regresar</button></footer></section>
</template>

<style scoped>.beneficiary-search-panel{display:grid;gap:12px}.beneficiary-search-actions{display:flex;justify-content:flex-end}.beneficiary-search-panel .bo-toolbar{margin-bottom:0}</style>
