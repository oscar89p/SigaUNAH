import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { CampusCreate, CampusQuery, CampusState, CampusUpdate } from "./campus.types.js";

const sortColumns = {
  idCampus: "idCampus",
  codigoCampus: "codigoCampus",
  nombreCampus: "nombreCampus",
  estadoCampus: "estadoCampus",
  fechaRegistro: "fechaRegistro"
} as const;

const selectColumns = `
  idCampus, codigoCampus, nombreCampus, estadoCampus,
  usuarioRegistro, fechaRegistro, usuarioActualizacion, fechaActualizacion
`;

export async function listCampuses(query: CampusQuery) {
  const pool = await getDatabasePool();
  const request = pool.request()
    .input("offset", sql.Int, (query.page - 1) * query.pageSize)
    .input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request();
  const predicates: string[] = [];

  if (query.search) {
    predicates.push("(codigoCampus LIKE @search OR nombreCampus LIKE @search)");
    request.input("search", sql.NVarChar(150), `%${query.search}%`);
    countRequest.input("search", sql.NVarChar(150), `%${query.search}%`);
  }
  if (query.estado !== "all") {
    predicates.push("estadoCampus=@estado");
    const active = query.estado === "active";
    request.input("estado", sql.Bit, active);
    countRequest.input("estado", sql.Bit, active);
  }
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";

  const sortColumn = sortColumns[query.sortBy];
  const direction = query.sortDirection === "desc" ? "DESC" : "ASC";
  const result = await request.query(`
    SELECT ${selectColumns}
    FROM DbSigaUNAH.Accesos.tblCampus
    ${where}
    ORDER BY ${sortColumn} ${direction}
    OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
  `);
  const count = await countRequest.query<{ total: number }>(`
    SELECT COUNT(1) AS total
    FROM DbSigaUNAH.Accesos.tblCampus
    ${where};
  `);

  return { items: result.recordset, total: count.recordset[0]?.total ?? 0 };
}

export async function findCampus(id: number) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("id", sql.Int, id).query(`
    SELECT ${selectColumns}
    FROM DbSigaUNAH.Accesos.tblCampus
    WHERE idCampus = @id;
  `);
  return result.recordset[0] ?? null;
}

export async function createCampus(data: CampusCreate) {
  try {
    const pool = await getDatabasePool();
    const result = await pool.request()
      .input("codigoCampus", sql.NVarChar(20), data.codigoCampus)
      .input("nombreCampus", sql.NVarChar(150), data.nombreCampus)
      .input("usuarioRegistro", sql.NVarChar(90), data.usuarioRegistro)
      .query(`
        INSERT INTO DbSigaUNAH.Accesos.tblCampus (codigoCampus, nombreCampus, usuarioRegistro)
        OUTPUT INSERTED.idCampus
        VALUES (@codigoCampus, @nombreCampus, @usuarioRegistro);
      `);
    return findCampus(result.recordset[0].idCampus);
  } catch (error) {
    return mapSqlError(error);
  }
}

export async function updateCampus(id: number, data: CampusUpdate) {
  try {
    const pool = await getDatabasePool();
    await pool.request()
      .input("id", sql.Int, id)
      .input("codigoCampus", sql.NVarChar(20), data.codigoCampus)
      .input("nombreCampus", sql.NVarChar(150), data.nombreCampus)
      .input("usuarioActualizacion", sql.NVarChar(90), data.usuarioActualizacion)
      .query(`
        UPDATE DbSigaUNAH.Accesos.tblCampus
        SET codigoCampus = @codigoCampus,
            nombreCampus = @nombreCampus,
            usuarioActualizacion = @usuarioActualizacion,
            fechaActualizacion = sysdatetime()
        WHERE idCampus = @id;
      `);
    return findCampus(id);
  } catch (error) {
    return mapSqlError(error);
  }
}

export async function updateCampusState(id: number, data: CampusState) {
  try {
    const pool = await getDatabasePool();
    await pool.request()
      .input("id", sql.Int, id)
      .input("estadoCampus", sql.Bit, data.estadoCampus)
      .input("usuarioActualizacion", sql.NVarChar(90), data.usuarioActualizacion)
      .query(`
        UPDATE DbSigaUNAH.Accesos.tblCampus
        SET estadoCampus = @estadoCampus,
            usuarioActualizacion = @usuarioActualizacion,
            fechaActualizacion = sysdatetime()
        WHERE idCampus = @id;
      `);
    return findCampus(id);
  } catch (error) {
    return mapSqlError(error);
  }
}
