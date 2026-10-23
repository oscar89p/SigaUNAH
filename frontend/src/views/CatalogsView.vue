<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import PageHeader from "@/components/PageHeader.vue";
import DataGrid, { type GridColumn } from "@/components/DataGrid.vue";
import { ApiError } from "@/services/http";
import {
  createCatalog,
  createCatalogValue,
  listCatalogs,
  listCatalogValues,
  setCatalogState,
  setCatalogValueState,
  updateCatalog,
  updateCatalogValue,
  type Catalog,
  type CatalogValue
} from "@/services/administracion";

type Tab = "catalogs" | "values";
type Operation = "catalog-create" | "catalog-edit" | "value-create" | "value-edit" | "catalog-activate" | "catalog-deactivate" | "value-activate" | "value-deactivate";

const tab = ref<Tab>("catalogs");
const catalogs = ref<Catalog[]>([]);
const values = ref<CatalogValue[]>([]);

// Query state is intentionally independent for each tab and from write operations.
const catalogListLoading = ref(false);
const valueListLoading = ref(false);
const catalogListError = ref("");
const valueListError = ref("");
const catalogSearch = ref("");
const valueSearch = ref("");
const catalogState = ref<"all" | "active" | "inactive">("all");
const valueState = ref<"all" | "active" | "inactive">("all");
const selectedType = ref<number | undefined>();
const catalogPage = ref(1);
const valuePage = ref(1);
const catalogPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
const valuePagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

const operationError = ref("");
const operationSuccess = ref("");
const operationInFlight = ref<Operation | null>(null);
const catalogSaveLoading = ref(false);
const valueSaveLoading = ref(false);
const catalogStateLoading = ref(false);
const valueStateLoading = ref(false);

const catalogModal = ref(false);
const valueModal = ref(false);
const editingCatalog = ref<Catalog | null>(null);
const editingValue = ref<CatalogValue | null>(null);

const catalogForm = ref({ idCategoria: 0, codigoTipo: "", nombreTipo: "", descripcionTipo: "" });
const valueForm = ref({ idTipo: 0, codigoTipoValor: "", nombreTipoValor: "", descripcionTipoValor: "", ordenTipoValor: 0 });

const message = (error: unknown) => error instanceof ApiError ? error.message : "Ocurrió un error inesperado";
let catalogRequestSequence = 0;
let valueRequestSequence = 0;
let catalogRequestKey = "";
let valueRequestKey = "";

const catalogColumns: GridColumn[] = [
  { key: "codigoTipo", label: "Código", width: "18%" },
  { key: "nombreTipo", label: "Nombre", width: "25%" },
  { key: "descripcionTipo", label: "Descripción", width: "30%" },
  { key: "nombreCategoria", label: "Categoría", width: "17%" },
  { key: "estadoTipo", label: "Estado", width: "10%" }
];
const valueColumns: GridColumn[] = [
  { key: "codigoTipoValor", label: "Código", width: "18%" },
  { key: "nombreTipoValor", label: "Nombre", width: "22%" },
  { key: "nombreTipo", label: "Catálogo", width: "22%" },
  { key: "descripcionTipoValor", label: "Descripción", width: "23%" },
  { key: "ordenTipoValor", label: "Orden", width: "8%" },
  { key: "estadoTipoValor", label: "Estado", width: "10%" }
];
const rows = (items: unknown[]) => items as Record<string, unknown>[];
const key = (row: Record<string, unknown>) => String(row.idTipo ?? row.idTipoValor);

async function loadCatalogs(force = false): Promise<boolean> {
  const requestKey = JSON.stringify([catalogPage.value, catalogSearch.value, catalogState.value]);
  if (!force && catalogListLoading.value && catalogRequestKey === requestKey) return false;
  const sequence = ++catalogRequestSequence;
  catalogRequestKey = requestKey;
  catalogListLoading.value = true;
  catalogListError.value = "";
  try {
    const response = await listCatalogs({ page: catalogPage.value, pageSize: 10, search: catalogSearch.value, estado: catalogState.value, sortBy: "codigoTipo", sortDirection: "asc" });
    if (sequence !== catalogRequestSequence) return false;
    catalogs.value = response.items;
    catalogPagination.value = response.pagination;
    return true;
  } catch (error) {
    if (sequence !== catalogRequestSequence) return false;
    catalogListError.value = message(error);
    return false;
  } finally {
    if (sequence === catalogRequestSequence) catalogListLoading.value = false;
  }
}

async function loadValues(force = false): Promise<boolean> {
  const requestKey = JSON.stringify([valuePage.value, valueSearch.value, selectedType.value, valueState.value]);
  if (!force && valueListLoading.value && valueRequestKey === requestKey) return false;
  const sequence = ++valueRequestSequence;
  valueRequestKey = requestKey;
  valueListLoading.value = true;
  valueListError.value = "";
  try {
    const response = await listCatalogValues({ page: valuePage.value, pageSize: 10, search: valueSearch.value, idTipo: selectedType.value, estado: valueState.value, sortBy: "ordenTipoValor", sortDirection: "asc" });
    if (sequence !== valueRequestSequence) return false;
    values.value = response.items;
    valuePagination.value = response.pagination;
    return true;
  } catch (error) {
    if (sequence !== valueRequestSequence) return false;
    valueListError.value = message(error);
    return false;
  } finally {
    if (sequence === valueRequestSequence) valueListLoading.value = false;
  }
}

function beginOperation(operation: Operation): boolean {
  if (operationInFlight.value) return false;
  operationInFlight.value = operation;
  operationError.value = "";
  operationSuccess.value = "";
  return true;
}

function finishOperation(operation: Operation) {
  if (operationInFlight.value === operation) operationInFlight.value = null;
}

function editCatalog(item: Catalog | null) {
  editingCatalog.value = item;
  catalogForm.value = { idCategoria: item?.idCategoria ?? 0, codigoTipo: item?.codigoTipo ?? "", nombreTipo: item?.nombreTipo ?? "", descripcionTipo: item?.descripcionTipo ?? "" };
  catalogModal.value = true;
}

function editValue(item: CatalogValue | null) {
  editingValue.value = item;
  valueForm.value = { idTipo: item?.idTipo ?? catalogs.value[0]?.idTipo ?? 0, codigoTipoValor: item?.codigoTipoValor ?? "", nombreTipoValor: item?.nombreTipoValor ?? "", descripcionTipoValor: item?.descripcionTipoValor ?? "", ordenTipoValor: item?.ordenTipoValor ?? 0 };
  valueModal.value = true;
}

async function saveCatalog() {
  const operation: Operation = editingCatalog.value ? "catalog-edit" : "catalog-create";
  if (!beginOperation(operation)) return;
  catalogSaveLoading.value = true;
  try {
    const data = { ...catalogForm.value, descripcionTipo: catalogForm.value.descripcionTipo || null };
    if (editingCatalog.value) await updateCatalog(editingCatalog.value.idTipo, data);
    else await createCatalog(data);
    catalogModal.value = false;
    if (await loadCatalogs(true)) operationSuccess.value = "Catálogo guardado correctamente.";
  } catch (error) {
    operationError.value = message(error);
  } finally {
    catalogSaveLoading.value = false;
    finishOperation(operation);
  }
}

async function saveValue() {
  const operation: Operation = editingValue.value ? "value-edit" : "value-create";
  if (!beginOperation(operation)) return;
  valueSaveLoading.value = true;
  try {
    const data = { ...valueForm.value, descripcionTipoValor: valueForm.value.descripcionTipoValor || null };
    if (editingValue.value) await updateCatalogValue(editingValue.value.idTipoValor, data);
    else await createCatalogValue(data);
    valueModal.value = false;
    if (await loadValues(true)) operationSuccess.value = "Valor guardado correctamente.";
  } catch (error) {
    operationError.value = message(error);
  } finally {
    valueSaveLoading.value = false;
    finishOperation(operation);
  }
}

async function toggleCatalog(item: Catalog) {
  if (!confirm(`¿Confirma ${item.estadoTipo ? "desactivar" : "activar"} este catálogo?`)) return;
  const operation: Operation = item.estadoTipo ? "catalog-deactivate" : "catalog-activate";
  if (!beginOperation(operation)) return;
  catalogStateLoading.value = true;
  try {
    await setCatalogState(item.idTipo, !item.estadoTipo);
    if (await loadCatalogs(true)) operationSuccess.value = "Estado del catálogo actualizado correctamente.";
  } catch (error) {
    // A rejected state change must not reload or alter the list state.
    operationError.value = message(error);
  } finally {
    catalogStateLoading.value = false;
    finishOperation(operation);
  }
}

async function toggleValue(item: CatalogValue) {
  if (!confirm(`¿Confirma ${item.estadoTipoValor ? "desactivar" : "activar"} el valor “${item.nombreTipoValor}”?`)) return;
  const operation: Operation = item.estadoTipoValor ? "value-deactivate" : "value-activate";
  if (!beginOperation(operation)) return;
  valueStateLoading.value = true;
  try {
    await setCatalogValueState(item.idTipoValor, !item.estadoTipoValor);
    if (await loadValues(true)) operationSuccess.value = `Valor ${item.estadoTipoValor ? "desactivado" : "activado"} correctamente.`;
  } catch (error) {
    operationError.value = message(error);
  } finally {
    valueStateLoading.value = false;
    finishOperation(operation);
  }
}

function selectTab(next: Tab) {
  tab.value = next;
  operationError.value = "";
  operationSuccess.value = "";
  if (next === "catalogs") void loadCatalogs();
  else void loadValues();
}

function pageChange(page: number) {
  if (tab.value === "catalogs") {
    catalogPage.value = page;
    void loadCatalogs();
  } else {
    valuePage.value = page;
    void loadValues();
  }
}

onMounted(() => void loadCatalogs());
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración', to: '/administracion/configuracion' }, { label: 'Catálogos' }]" />
  <PageHeader eyebrow="Administración" title="Catálogos institucionales" description="Gestión de tipos y valores utilizados por los módulos de SIGA UNAH." />
  <div v-if="operationSuccess" class="bo-notice bo-notice-success" role="status">{{ operationSuccess }}</div>
  <div v-if="operationError" class="bo-notice bo-state-error" role="alert">{{ operationError }}</div>

  <nav class="configuration-tabs">
    <button :class="{ active: tab === 'catalogs' }" @click="selectTab('catalogs')">Catálogos</button>
    <button :class="{ active: tab === 'values' }" @click="selectTab('values')">Valores de catálogos</button>
  </nav>

  <section v-if="tab === 'catalogs'" class="bo-card">
    <form class="bo-toolbar" @submit.prevent="catalogPage = 1; loadCatalogs()">
      <input v-model="catalogSearch" placeholder="Buscar código, nombre o descripción..." />
      <select v-model="catalogState"><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select>
      <button class="bo-btn bo-btn-primary">Buscar</button><button type="button" class="bo-btn" @click="editCatalog(null)">Nuevo catálogo</button>
    </form>
    <DataGrid :columns="catalogColumns" :rows="rows(catalogs)" :row-key="key" :pagination="catalogPagination" :loading="catalogListLoading" :error="catalogListError" empty-text="No hay catálogos registrados." @page="pageChange">
      <template #cell-estadoTipo="{ row }"><span class="status-badge" :class="{ 'status-badge--inactive': !row.estadoTipo }">{{ row.estadoTipo ? 'Activo' : 'Inactivo' }}</span></template>
      <template #actions="{ row }"><button class="bo-action" :disabled="Boolean(operationInFlight)" @click="editCatalog(row as unknown as Catalog)">Editar</button><button class="bo-action" :class="{ danger: row.estadoTipo }" :disabled="catalogStateLoading || Boolean(operationInFlight)" @click="toggleCatalog(row as unknown as Catalog)">{{ row.estadoTipo ? 'Desactivar' : 'Activar' }}</button></template>
    </DataGrid>
  </section>

  <section v-else class="bo-card">
    <form class="bo-toolbar" @submit.prevent="valuePage = 1; loadValues()">
      <input v-model="valueSearch" placeholder="Buscar valores o catálogos..." />
      <select v-model="selectedType"><option :value="undefined">Todos los catálogos</option><option v-for="item in catalogs" :key="item.idTipo" :value="item.idTipo">{{ item.nombreTipo }} ({{ item.codigoTipo }})</option></select>
      <select v-model="valueState"><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select>
      <button class="bo-btn bo-btn-primary">Buscar</button><button type="button" class="bo-btn" @click="editValue(null)">Nuevo valor</button>
    </form>
    <DataGrid :columns="valueColumns" :rows="rows(values)" :row-key="key" :pagination="valuePagination" :loading="valueListLoading" :error="valueListError" empty-text="No hay valores registrados." @page="pageChange">
      <template #cell-estadoTipoValor="{ row }"><span class="status-badge" :class="{ 'status-badge--inactive': !row.estadoTipoValor }">{{ row.estadoTipoValor ? 'Activo' : 'Inactivo' }}</span></template>
      <template #actions="{ row }"><div class="bo-actions catalog-inline-actions"><button class="bo-action" :disabled="Boolean(operationInFlight)" @click="editValue(row as unknown as CatalogValue)">Editar</button><button class="bo-action" :class="{ danger: row.estadoTipoValor }" :disabled="valueStateLoading || Boolean(operationInFlight)" @click="toggleValue(row as unknown as CatalogValue)">{{ row.estadoTipoValor ? 'Desactivar' : 'Activar' }}</button></div></template>
    </DataGrid>
  </section>

  <div v-if="catalogModal" class="bo-modal-backdrop" @click.self="catalogModal = false"><section class="bo-modal catalog-modal"><header><div><span class="bo-eyebrow">Catálogos</span><h2>{{ editingCatalog ? 'Editar catálogo' : 'Nuevo catálogo' }}</h2></div><button class="bo-close" @click="catalogModal = false">×</button></header><form class="bo-form" @submit.prevent="saveCatalog"><label>Categoría ID *<input v-model.number="catalogForm.idCategoria" type="number" min="1" required /></label><label>Código *<input v-model="catalogForm.codigoTipo" :disabled="Boolean(editingCatalog)" required /></label><label>Nombre *<input v-model="catalogForm.nombreTipo" required /></label><label>Descripción<textarea v-model="catalogForm.descripcionTipo" rows="3" /></label><footer class="form-actions"><button type="button" class="bo-btn" @click="catalogModal = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="catalogSaveLoading">Guardar</button></footer></form></section></div>
  <div v-if="valueModal" class="bo-modal-backdrop" @click.self="valueModal = false"><section class="bo-modal catalog-modal"><header><div><span class="bo-eyebrow">Valores</span><h2>{{ editingValue ? 'Editar valor' : 'Nuevo valor' }}</h2></div><button class="bo-close" @click="valueModal = false">×</button></header><form class="bo-form" @submit.prevent="saveValue"><label>Catálogo *<select v-model.number="valueForm.idTipo" :disabled="Boolean(editingValue)" required><option :value="0" disabled>Seleccione...</option><option v-for="item in catalogs" :key="item.idTipo" :value="item.idTipo">{{ item.nombreTipo }} ({{ item.codigoTipo }})</option></select></label><label>Código *<input v-model="valueForm.codigoTipoValor" required /></label><label>Nombre *<input v-model="valueForm.nombreTipoValor" required /></label><label>Descripción<textarea v-model="valueForm.descripcionTipoValor" rows="3" /></label><label>Orden *<input v-model.number="valueForm.ordenTipoValor" type="number" required /></label><footer class="form-actions"><button type="button" class="bo-btn" @click="valueModal = false">Cancelar</button><button class="bo-btn bo-btn-primary" :disabled="valueSaveLoading || !valueForm.idTipo">Guardar</button></footer></form></section></div>
</template>

<style scoped>
.configuration-tabs{display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid var(--bo-line)}.configuration-tabs button{padding:11px 15px;border:0;border-bottom:2px solid transparent;color:var(--bo-muted);background:transparent;cursor:pointer;font-size:12px;font-weight:700}.configuration-tabs button.active{color:var(--bo-blue);border-bottom-color:var(--bo-blue)}.catalog-modal{width:min(560px,calc(100vw - 32px));overflow-x:hidden}.catalog-modal input,.catalog-modal textarea,.catalog-modal select{width:100%;box-sizing:border-box;min-width:0}.catalog-modal .form-actions{position:sticky;bottom:-18px;background:#fff;padding:14px 0}.catalog-inline-actions{min-width:145px}
</style>
