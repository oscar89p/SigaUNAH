<script setup lang="ts">
import { ref, toRef } from "vue";
import { useDialogAccessibility } from "@/composables/useDialogAccessibility";

const props = withDefaults(defineProps<{ open: boolean; title: string; message: string; confirmLabel: string; busy?: boolean }>(), { busy: false });
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const dialog = ref<HTMLElement | null>(null);
useDialogAccessibility(dialog, toRef(props, "open"), () => { if (!props.busy) emit("cancel"); });
</script>

<template>
  <div v-if="open" class="bo-modal-backdrop" @click.self="!busy && emit('cancel')">
    <section ref="dialog" class="bo-modal bo-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" tabindex="-1">
      <header><div><span class="bo-eyebrow">Confirmación</span><h2 id="confirm-dialog-title">{{ title }}</h2></div><button class="bo-close" type="button" :disabled="busy" aria-label="Cerrar diálogo" @click="emit('cancel')">×</button></header>
      <p id="confirm-dialog-message" class="bo-confirm-message">{{ message }}</p>
      <footer class="bo-form-actions"><button class="bo-btn" type="button" :disabled="busy" data-dialog-initial-focus @click="emit('cancel')">Cancelar</button><button class="bo-btn bo-btn-primary" type="button" :disabled="busy" @click="emit('confirm')">{{ busy ? "Procesando…" : confirmLabel }}</button></footer>
    </section>
  </div>
</template>
