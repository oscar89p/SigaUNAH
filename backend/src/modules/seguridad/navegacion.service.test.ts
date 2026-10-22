import { describe, expect, it } from "vitest";
import { buildNavigationTree } from "./navegacion.service.js";
import type { NavigationRow } from "./navegacion.types.js";

const row = (idNavegacion: number, idNavegacionPadre: number | null, ordenNavegacion: number): NavigationRow => ({
  idNavegacion, idNavegacionPadre, ordenNavegacion,
  codigoNavegacion: `N${idNavegacion}`, nombreNavegacion: `N${idNavegacion}`,
  tituloNavegacion: `N${idNavegacion}`, descripcionNavegacion: null,
  tipoNavegacion: "ITEM", enlaceNavegacion: `/${idNavegacion}`,
  claseNavegacion: null
});

describe("navegación autorizada", () => {
  it("conserva jerarquía y orden sin duplicar filas", () => {
    const result = buildNavigationTree([row(2, 1, 2), row(1, null, 1), row(2, 1, 2)]);
    expect(result).toHaveLength(1);
    expect(result[0]?.children.map(item => item.idNavegacion)).toEqual([2]);
  });

  it("no crea padres que no fueron asignados", () => {
    const result = buildNavigationTree([row(9, 4, 1)]);
    expect(result.map(item => item.idNavegacion)).toEqual([9]);
  });
});
