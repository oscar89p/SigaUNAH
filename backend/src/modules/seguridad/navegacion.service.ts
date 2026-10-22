import * as repository from "./navegacion.repository.js";
import type { NavigationItem, NavigationRow } from "./navegacion.types.js";

export function buildNavigationTree(rows: NavigationRow[]): NavigationItem[] {
  const byId = new Map<number, NavigationItem>();
  for (const row of rows) byId.set(row.idNavegacion, { ...row, children: [] });

  const roots: NavigationItem[] = [];
  for (const item of byId.values()) {
    const parent = item.idNavegacionPadre === null ? undefined : byId.get(item.idNavegacionPadre);
    if (parent) parent.children.push(item);
    else roots.push(item);
  }
  return roots;
}

export async function getForUser(idUsuario: number) {
  return { items: buildNavigationTree(await repository.findForUser(idUsuario)) };
}
