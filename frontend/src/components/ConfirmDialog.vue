<script setup lang="ts">
defineProps<{ open: boolean; title: string; message: string; confirmLabel: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="bo-modal-backdrop" @click.self="emit('cancel')">
    <section class="bo-modal bo-confirm-modal">
      <header><div><span class="bo-eyebrow">Confirmación</span><h2>{{ title }}</h2></div><button class="bo-close" type="button" @click="emit('cancel')">×</button></header>
      <p class="bo-confirm-message">{{ message }}</p>
      <footer class="bo-form-actions"><button class="bo-btn" type="button" @click="emit('cancel')">Cancelar</button><button class="bo-btn bo-btn-primary" type="button" @click="emit('confirm')">{{ confirmLabel }}</button></footer>
    </section>
  </div>
</template>
