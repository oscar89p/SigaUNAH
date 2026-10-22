<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; description: string; actionLabel?: string }>();
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <div class="bo-page-head">
    <div>
      <p class="bo-eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <button v-if="actionLabel" class="bo-btn bo-btn-accent" type="button" @click="emit('action')">+ {{ actionLabel }}</button>
  </div>
</template>
