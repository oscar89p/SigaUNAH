<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ id: string; label: string; text: string }>();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const tooltip = ref<HTMLElement | null>(null);
const open = ref(false);
const hovering = ref(false);
const closingTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const position = ref({ top: 0, left: 0, maxWidth: 320 });

function close() {
  if (closingTimer.value) clearTimeout(closingTimer.value);
  open.value = false;
}

function openTooltip() {
  if (closingTimer.value) clearTimeout(closingTimer.value);
  open.value = true;
}

function toggle() {
  if (hovering.value) {
    openTooltip();
    return;
  }
  open.value = !open.value;
}

function scheduleClose() {
  if (closingTimer.value) clearTimeout(closingTimer.value);
  closingTimer.value = setTimeout(() => {
    if (!hovering.value) close();
  }, 180);
}

function updatePosition() {
  if (!trigger.value) return;
  const rect = trigger.value.getBoundingClientRect();
  const viewportPadding = 12;
  const maxWidth = Math.min(320, window.innerWidth - viewportPadding * 2);
  const tooltipHeight = tooltip.value?.offsetHeight ?? 96;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + maxWidth > window.innerWidth - viewportPadding) left = window.innerWidth - maxWidth - viewportPadding;
  if (left < viewportPadding) left = viewportPadding;
  if (top + tooltipHeight > window.innerHeight - viewportPadding) top = rect.top - tooltipHeight - 8;
  if (top < viewportPadding) top = viewportPadding;
  position.value = { top, left, maxWidth };
}

function closeOnOutside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close();
}

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    close();
  }
}

onMounted(() => {
  document.addEventListener("pointerdown", closeOnOutside);
  document.addEventListener("keydown", closeOnEscape);
});

onBeforeUnmount(() => {
  if (closingTimer.value) clearTimeout(closingTimer.value);
  document.removeEventListener("pointerdown", closeOnOutside);
  document.removeEventListener("keydown", closeOnEscape);
});

watch(open, async (isOpen, _wasOpen, onCleanup) => {
  if (!isOpen) {
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
    return;
  }
  await nextTick();
  updatePosition();
  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  onCleanup(() => {
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
  });
});
</script>

<template>
  <span ref="root" class="info-tooltip" @mouseenter="hovering = true; openTooltip()" @mouseleave="hovering = false; scheduleClose()">
    <button
      ref="trigger"
      class="info-tooltip-trigger"
      type="button"
      :aria-label="`Ayuda: ${props.label}`"
      :aria-expanded="open"
      :aria-describedby="open ? props.id : undefined"
      :aria-controls="props.id"
      @click.stop="toggle"
      @blur="close"
    >
      <span aria-hidden="true">i</span>
    </button>
  </span>
  <Teleport to="body">
    <span v-if="open" ref="tooltip" :id="props.id" class="info-tooltip-content" role="tooltip" :style="{ top: `${position.top}px`, left: `${position.left}px`, maxWidth: `${position.maxWidth}px` }" @mouseenter="openTooltip" @mouseleave="scheduleClose">{{ props.text }}</span>
  </Teleport>
</template>

<style scoped>
.info-tooltip { display: inline-flex; align-items: center; vertical-align: middle; max-width: 100%; }
.info-tooltip-trigger { display: inline-grid; width: 20px; height: 20px; flex: 0 0 20px; place-items: center; padding: 0; border: 1px solid var(--bo-blue); border-radius: 50%; color: var(--bo-blue); background: #fff; cursor: pointer; font-size: 0.8125rem; font-weight: 800; line-height: 1; }
.info-tooltip-trigger:hover { color: #fff; background: var(--bo-blue); }
.info-tooltip-content { position: fixed; z-index: 1000; display: block; width: max-content; padding: 9px 10px; border: 1px solid #b7cfda; border-radius: 6px; color: var(--bo-dark); background: #f3f9fb; box-shadow: 0 5px 16px rgb(0 35 55 / 16%); font-size: var(--siga-text-secondary); font-weight: 400; line-height: 1.45; overflow-wrap: anywhere; pointer-events: auto; }
</style>
