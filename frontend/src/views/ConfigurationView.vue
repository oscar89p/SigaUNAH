<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppBreadcrumb from "@/components/AppBreadcrumb.vue";
import PageHeader from "@/components/PageHeader.vue";
import { listParameters, updateParameter, type Parameter } from "@/services/administracion";

const items = ref<Parameter[]>([]); const loading = ref(false); const savingId = ref<number | null>(null); const error = ref(""); const success = ref(""); const drafts = ref<Record<number, string>>({});
const message = (e: unknown) => e instanceof Error ? e.message : "Ocurrió un error inesperado";
async function load() { loading.value = true; error.value = ""; try { items.value = await listParameters(); drafts.value = Object.fromEntries(items.value.map(item => [item.idParametro, item.valorPredeterminado ?? ""])); } catch (e) { error.value = message(e); } finally { loading.value = false; } }
async function save(item: Parameter) { const valor = drafts.value[item.idParametro] ?? ""; if (!window.confirm(`¿Confirma cambiar el valor de “${item.nombreParametro}”?`)) return; savingId.value = item.idParametro; error.value = ""; success.value = ""; try { await updateParameter(item.idParametro, valor); success.value = `Se actualizó ${item.nombreParametro}.`; await load(); } catch (e) { error.value = message(e); } finally { savingId.value = null; } }
function normalizedType(type: string) { return type.trim().toUpperCase(); }
function isBoolean(type: string) { return ["BOOLEAN", "BOOL", "BIT", "BOOLEANO", "LOGICO"].includes(normalizedType(type)); }
function inputType(type: string) { const value = normalizedType(type); return ["INT", "INTEGER", "SMALLINT", "BIGINT", "ENTERO", "DECIMAL", "NUMERIC", "FLOAT", "NUMBER", "NUMERICO"].includes(value) || /^DECIMAL\(\d+,\d+\)$/.test(value) ? "number" : value === "DATE" || value === "FECHA" ? "date" : "text"; }
onMounted(() => void load());
</script>

<template>
  <AppBreadcrumb :items="[{ label: 'Administración' }, { label: 'Configuración' }]" />
  <PageHeader eyebrow="Administración" title="Configuración" description="Consulte parámetros institucionales y modifique solo valores marcados como editables." action-label="Actualizar" @action="load" />
  <div v-if="success" class="bo-notice bo-notice-success" role="status">{{ success }}</div><div v-if="error" class="bo-state bo-state-error" role="alert">{{ error }} <button class="bo-link" @click="load">Reintentar</button></div>
  <section class="bo-card"><div v-if="loading" class="bo-state" role="status">Cargando parámetros...</div><div v-else-if="!items.length" class="bo-state"><strong>No hay parámetros institucionales disponibles.</strong><span>La consulta utiliza Configuracion.tblParametros. No se encontraron filas activas y no se generaron valores de ejemplo.</span></div><div v-else class="bo-table-wrap"><table><thead><tr><th>Parámetro</th><th>Tipo</th><th>Valor</th><th>Modificable</th><th>Acción</th></tr></thead><tbody><tr v-for="item in items" :key="item.idParametro"><td><strong>{{ item.nombreParametro }}</strong><br /><small>{{ item.codigoParametro }} · {{ item.descripcionParametro || 'Sin descripción' }}</small></td><td>{{ item.tipoDato }}</td><td><select v-if="item.permiteModificacion && isBoolean(item.tipoDato)" v-model="drafts[item.idParametro]" :aria-label="`Valor de ${item.nombreParametro}`"><option value="true">Verdadero</option><option value="false">Falso</option><option value="1">1</option><option value="0">0</option></select><input v-else-if="item.permiteModificacion" v-model="drafts[item.idParametro]" :type="inputType(item.tipoDato)" :step="inputType(item.tipoDato) === 'number' ? 'any' : undefined" maxlength="1000" :aria-label="`Valor de ${item.nombreParametro}`" /><span v-else>{{ item.valorPredeterminado ?? 'Sin valor predeterminado' }}</span></td><td>{{ item.permiteModificacion ? 'Sí' : 'Solo lectura' }}</td><td><button v-if="item.permiteModificacion" class="bo-action" :disabled="savingId === item.idParametro" @click="save(item)">{{ savingId === item.idParametro ? 'Guardando...' : 'Guardar' }}</button><span v-else>—</span></td></tr></tbody></table></div></section>
  <p class="bo-form-note">Los secretos, contraseñas, hashes, tokens y cadenas de conexión se excluyen del servicio. La edición actualiza solo valorPredeterminado en la tabla existente; no se modificó el esquema.</p>
</template>
