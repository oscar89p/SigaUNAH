<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ApiError } from "@/services/http";
import { findReturnAssignmentState, getAssignmentOptions, isAssignmentVigente, returnAsignacion, type Asignacion } from "@/services/tarjetas";
import type { Beneficiary } from "@/services/beneficiarios";

const props = defineProps<{ assignment: Asignacion; beneficiary: Beneficiary }>();
const emit = defineEmits<{ (event: "close"): void; (event: "released", assignment: Asignacion): void }>();
const saving = ref(false); const loading = ref(true); const error = ref(""); const comment = ref(""); const stateId = ref(0);
const message = (cause: unknown) => cause instanceof ApiError ? cause.message : "No fue posible liberar la tarjeta. Intente nuevamente.";
const name = computed(() => [props.beneficiary.primerNombre, props.beneficiary.segundoNombre, props.beneficiary.primerApellido, props.beneficiary.segundoApellido].filter(Boolean).join(" "));
const date = (value: string | null | undefined) => value ? value.slice(0, 10) : "—";
async function load() { try { const options = await getAssignmentOptions(); const state = findReturnAssignmentState(options); if (state) stateId.value = state.idTipoValor; else error.value = "No existe un estado DEVUELTA activo configurado."; } catch (cause) { error.value = message(cause); } finally { loading.value = false; } }
async function release() { if (!isAssignmentVigente(props.assignment.esAsignacionVigente)) { error.value = "La asignación ya no está vigente."; return; } if (!stateId.value || comment.value.trim().length < 1 || saving.value) return; saving.value = true; error.value = ""; try { const result = await returnAsignacion(props.assignment.idAsignacion, { idEstadoAsignacionNuevo: stateId.value, motivoCambio: comment.value.trim(), usuario: "backoffice" }); emit("released", result); } catch (cause) { error.value = message(cause); } finally { saving.value = false; } }
onMounted(() => { void load(); });
</script>
<template>
  <div class="bo-modal-backdrop" @click.self="!saving && emit('close')"><section class="bo-modal release-modal" role="dialog" aria-modal="true" aria-labelledby="release-title">
    <header><div><span class="bo-eyebrow">Tarjetas asignadas</span><h2 id="release-title">Liberar tarjeta</h2><p>La asignación finalizará y permanecerá en el historial.</p></div><button class="bo-close" type="button" :disabled="saving" @click="emit('close')">×</button></header>
     <div class="release-details"><div><small>Código de tarjeta</small><strong>{{ assignment.codigoTarjeta }}</strong></div><div><small>Serie</small><strong>{{ assignment.numeroSerie ?? "—" }}</strong></div><div><small>Beneficiario actual</small><strong>{{ name }}</strong></div><div><small>Fecha de asignación</small><strong>{{ date(assignment.fechaAsignacion) }}</strong></div><div class="release-event"><small>Evento</small><strong>Liberación de tarjeta</strong></div></div>
     <label class="release-reason">Comentario / Justificación<textarea v-model="comment" rows="4" maxlength="1000" required placeholder="Documente la justificación de la liberación" /></label>
    <p v-if="loading" class="bo-form-note">Validando el estado de devolución...</p><p v-if="error" class="bo-form-error" role="alert">{{ error }}</p>
     <footer><button class="bo-btn" type="button" :disabled="saving" @click="emit('close')">Cancelar</button><button class="bo-btn bo-btn-primary" type="button" :disabled="loading || saving || !stateId || !isAssignmentVigente(assignment.esAsignacionVigente) || !comment.trim()" @click="release">{{ saving ? "Liberando..." : "Confirmar liberación" }}</button></footer>
  </section></div>
</template>
<style scoped>
 .release-modal{width:min(620px,calc(100vw - 32px));padding:26px}.release-modal header{display:flex;justify-content:space-between;gap:16px;margin-bottom:20px}.release-modal h2{margin:3px 0 0;color:var(--bo-dark)}.release-modal header p{margin:7px 0 0;color:var(--bo-muted);font-size:12px}.release-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;margin-bottom:20px;border:1px solid var(--bo-line);background:var(--bo-line)}.release-details div{display:grid;gap:5px;padding:13px;background:#f8fafb}.release-details small{color:var(--bo-muted);font-size:10px;font-weight:800;text-transform:uppercase}.release-details strong{color:var(--bo-dark);font-size:12px;overflow-wrap:anywhere}.release-details .release-event{grid-column:1/-1;background:#eef6fa}.release-details .release-event strong{color:var(--bo-blue)}.release-reason{display:grid;gap:7px;color:var(--bo-dark);font-size:12px;font-weight:700}.release-reason textarea{resize:vertical;padding:10px;border:1px solid var(--bo-line);border-radius:6px;font:inherit;font-weight:400}.release-modal footer{display:flex;justify-content:flex-end;gap:9px;margin-top:22px}@media(max-width:520px){.release-details{grid-template-columns:1fr}.release-details .release-event{grid-column:auto}}
</style>
