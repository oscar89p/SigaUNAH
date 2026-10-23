import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import type { NavigationRow } from "./navegacion.types.js";

/** Solo devuelve navegaciones explícitamente asignadas al usuario autenticado. */
export async function findForUser(idUsuario: number): Promise<NavigationRow[]> {
  const pool = await getDatabasePool();
  const result = await pool.request()
    .input("idUsuario", sql.BigInt, idUsuario)
    .query<NavigationRow>(`
      ;WITH asignadas AS (
        SELECT n.idNavegacion, n.idNavegacionPadre
        FROM Seguridad.tblUsuariosPerfiles up
        INNER JOIN Seguridad.tblPerfiles p
          ON p.idPerfil = up.idPerfil AND p.estadoPerfil = 1
        INNER JOIN Seguridad.tblPerfilesNavegaciones pn
          ON pn.idPerfil = p.idPerfil
         AND pn.estadoPerfilNavegacion = 1
         AND pn.permiteVisualizar = 1
        INNER JOIN Seguridad.tblNavegaciones n
          ON n.idNavegacion = pn.idNavegacion
         AND n.estadoNavegacion = 1
         AND n.esVisible = 1
        WHERE up.idUsuario = @idUsuario
          AND up.estadoUsuarioPerfil = 1
      ), arbol AS (
        SELECT idNavegacion, idNavegacionPadre FROM asignadas
        UNION ALL
        SELECT parent.idNavegacion, parent.idNavegacionPadre
        FROM Seguridad.tblNavegaciones parent
        INNER JOIN arbol child ON child.idNavegacionPadre = parent.idNavegacion
        WHERE parent.estadoNavegacion = 1 AND parent.esVisible = 1
      )
      SELECT DISTINCT
        n.idNavegacion, n.codigoNavegacion, n.nombreNavegacion,
        n.tituloNavegacion, n.descripcionNavegacion, n.tipoNavegacion,
        n.enlaceNavegacion, n.claseNavegacion, n.ordenNavegacion,
        n.idNavegacionPadre
      FROM arbol a
      INNER JOIN Seguridad.tblNavegaciones n ON n.idNavegacion = a.idNavegacion
      ORDER BY n.idNavegacionPadre, n.ordenNavegacion, n.idNavegacion
      OPTION (MAXRECURSION 100)`);
  return result.recordset;
}
