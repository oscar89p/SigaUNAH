<script setup lang="ts">
const props = defineProps<{ active: boolean }>();
</script>

<template>
  <span class="status-badge" :class="{ 'status-badge--inactive': !props.active }">
    {{ props.active ? "Activo" : "Inactivo" }}
  </span>
</template>
