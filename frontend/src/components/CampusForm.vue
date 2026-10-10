<script setup lang="ts">
import { reactive, watch } from "vue";
import type { Campus } from "@/types/access";

const props = defineProps<{ campus: Campus | null; saving: boolean; error: string }>();
const emit = defineEmits<{ save: [data: { codigoCampus: string; nombreCampus: string }]; cancel: [] }>();
const form = reactive({ codigoCampus: "", nombreCampus: "" });

watch(() => props.campus, (campus) => {
  form.codigoCampus = campus?.codigoCampus ?? "";
  form.nombreCampus = campus?.nombreCampus ?? "";
}, { immediate: true });
</script>

<template>
  <form class="form-card" @submit.prevent="emit('save', { ...form })">
    <div class="form-card__header"><h2>{{ campus ? "Editar campus" : "Nuevo campus" }}</h2><button type="button" class="button button--text" @click="emit('cancel')">Cerrar</button></div>
    <div v-if="error" class="alert alert--error">{{ error }}</div>
    <label>Código <input v-model="form.codigoCampus" maxlength="20" required /></label>
    <label>Nombre <input v-model="form.nombreCampus" maxlength="150" required /></label>
    <div class="form-actions"><button type="button" class="button button--secondary" @click="emit('cancel')">Cancelar</button><button class="button" :disabled="saving">{{ saving ? "Guardando..." : "Guardar" }}</button></div>
  </form>
</template>
