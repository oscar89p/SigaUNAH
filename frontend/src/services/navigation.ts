import { get } from "@/services/http";
import type { NavigationItem } from "@/types/navigation";

export function getMyNavigation() {
  return get<{ items: NavigationItem[] }>("/api/v1/seguridad/mi-navegacion");
}
