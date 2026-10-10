<script setup lang="ts">
import { RouterLink } from "vue-router";

defineProps<{ items: Array<{ label: string; to?: string }> }>();
</script>

<template>
  <nav class="bo-breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <RouterLink v-if="item.to && index < items.length - 1" :to="item.to">{{ item.label }}</RouterLink>
        <span v-else aria-current="page">{{ item.label }}</span>
        <span v-if="index < items.length - 1" class="bo-breadcrumb-separator">/</span>
      </li>
    </ol>
  </nav>
</template>
