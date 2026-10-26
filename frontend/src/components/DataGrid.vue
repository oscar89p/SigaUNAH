<script setup lang="ts">
import { computed } from "vue";

export interface GridColumn {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  numeric?: boolean;
}

interface GridPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const props = withDefaults(defineProps<{
  columns: GridColumn[];
  rows: Record<string, unknown>[];
  rowKey?: (row: Record<string, unknown>) => string | number;
  pagination?: GridPagination;
  loading?: boolean;
  error?: string;
  emptyText?: string;
}>(), { loading: false, error: "", emptyText: "No hay registros para mostrar." });

const emit = defineEmits<{ page: [number] }>();
const totalPages = computed(() => Math.max(props.pagination?.totalPages ?? 1, 1));
const currentPage = computed(() => props.pagination?.page ?? 1);
const total = computed(() => props.pagination?.total ?? props.rows.length);
const first = computed(() => total.value ? ((currentPage.value - 1) * (props.pagination?.pageSize ?? props.rows.length)) + 1 : 0);
const last = computed(() => total.value ? Math.min(currentPage.value * (props.pagination?.pageSize ?? props.rows.length), total.value) : 0);
function go(page: number) { if (!props.loading && page >= 1 && page <= totalPages.value && page !== currentPage.value) emit("page", page); }
function getRowKey(row: Record<string, unknown>, index: number) { return props.rowKey ? props.rowKey(row) : String(row.id ?? row.idAsignacion ?? row.idTarjeta ?? index); }
</script>

<template>
  <section class="siga-grid" :aria-busy="loading">
    <div v-if="loading" class="bo-state siga-grid-state">Cargando registros...</div>
    <div v-else-if="error" class="bo-state bo-state-error siga-grid-state"><strong>{{ error }}</strong><button class="bo-btn" @click="$emit('page', currentPage)">Reintentar</button></div>
    <div v-else-if="!rows.length" class="bo-state siga-grid-state">{{ emptyText }}</div>
    <div v-else class="siga-grid-scroll">
      <table class="siga-grid-table">
        <colgroup><col v-for="column in columns" :key="column.key" :style="{ width: column.width ?? 'auto' }" /><col v-if="$slots.actions" class="siga-grid-actions-col" /></colgroup>
        <thead><tr><th v-for="column in columns" :key="column.key" :class="{ 'is-numeric': column.numeric }" :style="{ textAlign: column.align ?? (column.numeric ? 'right' : 'left') }">{{ column.label }}</th><th v-if="$slots.actions">Acciones</th></tr></thead>
          <tbody><tr v-for="(row, index) in rows" :key="getRowKey(row, index)"><td v-for="column in columns" :key="column.key" :class="[`siga-grid-cell-${column.key}`, { 'is-numeric': column.numeric }]" :style="{ textAlign: column.align ?? (column.numeric ? 'right' : 'left') }"><slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">{{ row[column.key] ?? "—" }}</slot></td><td v-if="$slots.actions"><slot name="actions" :row="row" /></td></tr></tbody>
      </table>
    </div>
    <footer v-if="pagination && !loading && !error" class="siga-grid-footer"><span>Mostrando {{ first }}–{{ last }} de {{ total }} registros · {{ pagination.pageSize }} por página</span><nav class="siga-grid-pagination" aria-label="Paginación"><button class="bo-page-button" :disabled="currentPage <= 1" @click="go(1)">Primera</button><button class="bo-page-button" :disabled="currentPage <= 1" @click="go(currentPage - 1)">Anterior</button><span>Página {{ currentPage }} de {{ totalPages }}</span><button class="bo-page-button" :disabled="currentPage >= totalPages" @click="go(currentPage + 1)">Siguiente</button><button class="bo-page-button" :disabled="currentPage >= totalPages" @click="go(totalPages)">Última</button></nav></footer>
  </section>
</template>
