import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import type { AccessQuery, IncidentQuery } from "./monitoreo.types.js";

function addRange(request: sql.Request, query: { desde?: string; hasta?: string }, alias: string) {
  const clauses: string[] = [];
  if (query.desde) { clauses.push(`${alias}>=@desde`); request.input("desde", sql.Date, query.desde); }
  if (query.hasta) { clauses.push(`${alias}<DATEADD(day,1,@hasta)`); request.input("hasta", sql.Date, query.hasta); }
  return clauses;
}
function page<T>(items: T[], total: number, query: { page: number; pageSize: number }) {
  return { items, total, page: query.page, pageSize: query.pageSize };
}

const accessFrom = `
  FROM Operaciones.tblRegistrosAcceso r
  LEFT JOIN Tarjetas.tblTarjetas t ON t.idTarjeta=r.idTarjeta
  LEFT JOIN Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=r.idBeneficiario
  LEFT JOIN Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona
  LEFT JOIN Accesos.tblDispositivos d ON d.idDispositivo=r.idDispositivo
  LEFT JOIN Accesos.tblElevadores e ON e.idElevador=r.idElevador`;
const accessSelect = `r.idRegistroAcceso,r.fechaHoraAcceso,r.resultadoAcceso,r.codigoResultado,r.direccionMovimiento,r.pisoOrigen,r.pisoDestino,r.origenRegistro,r.idTarjeta,t.codigoTarjeta,r.idBeneficiario,CONCAT(p.primerNombre,N' ',p.primerApellido) AS nombreBeneficiario,r.idDispositivo,d.codigoDispositivo,d.nombreDispositivo,r.idElevador,e.codigoElevador,e.nombreElevador`;

function bindAccessFilters(request: sql.Request, query: AccessQuery) {
  const clauses = addRange(request, query, "r.fechaHoraAcceso");
  if (query.search) {
    clauses.push("(t.codigoTarjeta LIKE @search OR d.codigoDispositivo LIKE @search OR e.codigoElevador LIKE @search OR r.resultadoAcceso LIKE @search OR r.codigoResultado LIKE @search OR p.primerNombre LIKE @search OR p.primerApellido LIKE @search)");
    request.input("search", sql.NVarChar(150), `%${query.search}%`);
  }
  if (query.resultado) { clauses.push("r.resultadoAcceso=@resultado"); request.input("resultado", sql.NVarChar(30), query.resultado); }
  if (query.idTarjeta) { clauses.push("r.idTarjeta=@idTarjeta"); request.input("idTarjeta", sql.BigInt, query.idTarjeta); }
  if (query.idElevador) { clauses.push("r.idElevador=@idElevador"); request.input("idElevador", sql.Int, query.idElevador); }
  if (query.idDispositivo) { clauses.push("r.idDispositivo=@idDispositivo"); request.input("idDispositivo", sql.BigInt, query.idDispositivo); }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export async function listAccessEvents(query: AccessQuery) {
  const pool = await getDatabasePool();
  const request = pool.request(); const countRequest = pool.request();
  const where = bindAccessFilters(request, query); bindAccessFilters(countRequest, query);
  const offset = (query.page - 1) * query.pageSize;
  request.input("offset", sql.Int, offset).input("pageEnd", sql.Int, offset + query.pageSize);
  const direction = query.sortDirection === "asc" ? "ASC" : "DESC";
  const [data, count] = await Promise.all([
    request.query(`SELECT * FROM (SELECT ${accessSelect},ROW_NUMBER() OVER (ORDER BY r.fechaHoraAcceso ${direction},r.idRegistroAcceso ${direction}) AS numeroFila ${accessFrom} ${where}) eventos WHERE numeroFila>@offset AND numeroFila<=@pageEnd ORDER BY numeroFila`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${accessFrom} ${where}`)
  ]);
  return page(data.recordset, count.recordset[0]?.total ?? 0, query);
}

const incidentFrom = `
  FROM Operaciones.tblIncidentesAcceso i
  LEFT JOIN Tarjetas.tblTarjetas t ON t.idTarjeta=i.idTarjeta
  LEFT JOIN Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=i.idBeneficiario
  LEFT JOIN Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona
  LEFT JOIN Accesos.tblDispositivos d ON d.idDispositivo=i.idDispositivo`;
const incidentSelect = `i.idIncidenteAcceso,i.codigoIncidenteAcceso,i.tipoIncidenteAcceso,i.descripcionIncidenteAcceso,i.nivelSeveridadIncidenteAcceso,i.fechaIncidenteAcceso,i.fechaResolucionIncidenteAcceso,i.resueltoIncidenteAcceso,i.resolucionIncidenteAcceso,i.idRegistroAcceso,i.idTarjeta,t.codigoTarjeta,i.idBeneficiario,CONCAT(p.primerNombre,N' ',p.primerApellido) AS nombreBeneficiario,i.idDispositivo,d.codigoDispositivo,d.nombreDispositivo`;

function bindIncidentFilters(request: sql.Request, query: IncidentQuery) {
  const clauses = addRange(request, query, "i.fechaIncidenteAcceso");
  if (query.search) {
    clauses.push("(i.codigoIncidenteAcceso LIKE @search OR i.tipoIncidenteAcceso LIKE @search OR i.descripcionIncidenteAcceso LIKE @search OR t.codigoTarjeta LIKE @search OR d.codigoDispositivo LIKE @search OR p.primerNombre LIKE @search OR p.primerApellido LIKE @search)");
    request.input("search", sql.NVarChar(150), `%${query.search}%`);
  }
  if (query.severidad) { clauses.push("i.nivelSeveridadIncidenteAcceso=@severidad"); request.input("severidad", sql.NVarChar(20), query.severidad); }
  if (query.resuelto !== "all") { clauses.push("i.resueltoIncidenteAcceso=@resuelto"); request.input("resuelto", sql.Bit, query.resuelto === "resolved"); }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export async function listIncidents(query: IncidentQuery) {
  const pool = await getDatabasePool();
  const request = pool.request(); const countRequest = pool.request();
  const where = bindIncidentFilters(request, query); bindIncidentFilters(countRequest, query);
  const offset = (query.page - 1) * query.pageSize;
  request.input("offset", sql.Int, offset).input("pageEnd", sql.Int, offset + query.pageSize);
  const direction = query.sortDirection === "asc" ? "ASC" : "DESC";
  const [data, count] = await Promise.all([
    request.query(`SELECT * FROM (SELECT ${incidentSelect},ROW_NUMBER() OVER (ORDER BY i.fechaIncidenteAcceso ${direction},i.idIncidenteAcceso ${direction}) AS numeroFila ${incidentFrom} ${where}) incidentes WHERE numeroFila>@offset AND numeroFila<=@pageEnd ORDER BY numeroFila`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${incidentFrom} ${where}`)
  ]);
  return page(data.recordset, count.recordset[0]?.total ?? 0, query);
}
