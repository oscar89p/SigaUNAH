<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import type { NavigationItem } from "@/types/navigation";

const props = withDefaults(defineProps<{ item: NavigationItem; depth?: number }>(), { depth: 0 });
const route = useRoute();
const expanded = ref(false);

function isActive(item: NavigationItem): boolean {
  return Boolean(item.enlaceNavegacion && (route.path === item.enlaceNavegacion || route.path.startsWith(`${item.enlaceNavegacion}/`)));
}
function hasActiveDescendant(item: NavigationItem): boolean {
  return item.children.some(child => isActive(child) || hasActiveDescendant(child));
}
function syncActiveParent() {
  if (hasActiveDescendant(props.item)) expanded.value = true;
}
function onGroupKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowRight" && !expanded.value) { event.preventDefault(); expanded.value = true; }
  if (event.key === "ArrowLeft" && expanded.value) { event.preventDefault(); expanded.value = false; }
}
onMounted(syncActiveParent);
watch(() => route.path, syncActiveParent);
</script>

<template>
  <div class="bo-nav-item" :class="{ 'bo-nav-nested': depth > 0 }">
    <RouterLink v-if="item.enlaceNavegacion" class="bo-nav-link" :to="item.enlaceNavegacion" :class="{ active: isActive(item), 'has-toggle': item.children.length }" :aria-current="isActive(item) ? 'page' : undefined">
      <span class="bo-nav-mark" />{{ item.tituloNavegacion }}
    </RouterLink>
    <button v-else-if="item.children.length" class="bo-nav-group" type="button" :aria-expanded="expanded" :aria-controls="`bo-nav-${item.idNavegacion}`" @click="expanded = !expanded" @keydown="onGroupKeydown">
      <span class="bo-nav-mark" />{{ item.tituloNavegacion }}<span class="bo-nav-chevron" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
    </button>
    <span v-else class="bo-nav-group bo-nav-group-empty"><span class="bo-nav-mark" />{{ item.tituloNavegacion }}</span>
    <button v-if="item.enlaceNavegacion && item.children.length" class="bo-nav-toggle" type="button" :aria-expanded="expanded" :aria-label="`${expanded ? 'Contraer' : 'Expandir'} ${item.tituloNavegacion}`" :aria-controls="`bo-nav-${item.idNavegacion}`" @click="expanded = !expanded" @keydown="onGroupKeydown">{{ expanded ? '−' : '+' }}</button>
    <div v-if="item.children.length && expanded" :id="`bo-nav-${item.idNavegacion}`" class="bo-nav-children">
      <NavigationMenuNode v-for="child in item.children" :key="child.idNavegacion" :item="child" :depth="depth + 1" />
    </div>
  </div>
</template>
