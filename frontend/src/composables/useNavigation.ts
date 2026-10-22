import { computed, ref } from "vue";
import { getMyNavigation } from "@/services/navigation";
import type { NavigationItem } from "@/types/navigation";

const items = ref<NavigationItem[]>([]);
const loading = ref(false);
const error = ref("");
let loadedForSession = false;

function flatten(nodes: NavigationItem[]): NavigationItem[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

export function useNavigation() {
  async function load(force = false) {
    if (loadedForSession && !force) return items.value;
    loading.value = true;
    error.value = "";
    try {
      items.value = (await getMyNavigation()).items;
      loadedForSession = true;
    } catch (cause) {
      items.value = [];
      error.value = cause instanceof Error ? cause.message : "No fue posible cargar la navegación";
      throw cause;
    } finally { loading.value = false; }
    return items.value;
  }
  function clear() { items.value = []; error.value = ""; loadedForSession = false; }
  function canAccess(path: string) { return flatten(items.value).some((item) => item.enlaceNavegacion === path); }
  return { items, loading, error, flatItems: computed(() => flatten(items.value)), load, clear, canAccess };
}
