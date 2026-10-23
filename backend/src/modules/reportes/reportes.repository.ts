import sql from "mssql";
import { getDatabasePool } from "../../shared/database/pool.js";
import type { ReportQuery } from "./reportes.types.js";

export async function options() {
  const pool = await getDatabasePool();
  const [campuses, buildings, beneficiaryTypes] = await Promise.all([
    pool.request().query(`SELECT idCampus,codigoCampus,nombreCampus FROM DbSigaUNAH.Accesos.tblCampus WHERE estadoCampus=1 ORDER BY nombreCampus`),
    pool.request().query(`SELECT e.idEdificio,e.idCampus,e.codigoEdificio,e.nombreEdificio FROM DbSigaUNAH.Accesos.tblEdificios e INNER JOIN DbSigaUNAH.Accesos.tblCampus c ON c.idCampus=e.idCampus WHERE e.estadoEdificio=1 AND c.estadoCampus=1 ORDER BY e.nombreEdificio`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_BENEFICIARIO' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`)
  ]);
  return { campus: campuses.recordset, edificios: buildings.recordset, tiposBeneficiario: beneficiaryTypes.recordset };
}

function bindCommon(request: sql.Request, query: ReportQuery, beneficiaryAlias = "b", dateAlias?: string, dateField = "fechaSolicitud", stateField = "estadoBeneficiario") {
  const clauses: string[] = [];
  if (query.idTipoBeneficiario) { clauses.push(`${beneficiaryAlias}.idTipoBeneficiario=@idTipoBeneficiario`); request.input("idTipoBeneficiario", sql.Int, query.idTipoBeneficiario); }
  if (query.estado !== "all") {
    const field = `${dateAlias ?? beneficiaryAlias}.${stateField}`;
    clauses.push(`${field}=@estadoActivo`); request.input("estadoActivo", sql.Bit, query.estado === "active");
  }
  if (dateAlias && query.desde) { clauses.push(`${dateAlias}.${dateField}>=@desde`); request.input("desde", sql.Date, query.desde); }
  if (dateAlias && query.hasta) { clauses.push(`${dateAlias}.${dateField}<DATEADD(day,1,@hasta)`); request.input("hasta", sql.Date, query.hasta); }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

function bindInfrastructure(request: sql.Request, query: ReportQuery, entityAlias: string, campusAlias: string, buildingAlias?: string) {
  const clauses: string[] = [];
  if (query.idCampus) { clauses.push(`${campusAlias}.idCampus=@idCampus`); request.input("idCampus", sql.Int, query.idCampus); }
  if (query.idEdificio && buildingAlias) { clauses.push(`${buildingAlias}.idEdificio=@idEdificio`); request.input("idEdificio", sql.Int, query.idEdificio); }
  else if (query.idEdificio) { clauses.push(`${campusAlias}.idCampus IN (SELECT idCampus FROM DbSigaUNAH.Accesos.tblEdificios WHERE idEdificio=@idEdificio)`); request.input("idEdificio", sql.Int, query.idEdificio); }
  if (query.estado !== "all") { const stateName = entityAlias === "c" ? "Campus" : entityAlias === "e" ? "Edificio" : entityAlias === "v" ? "Elevador" : "Dispositivo"; clauses.push(`${entityAlias}.estado${stateName}=@infraActivo`); request.input("infraActivo", sql.Bit, query.estado === "active"); }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export async function summary(query: ReportQuery) {
  const pool = await getDatabasePool();
  const beneficiaryCountRequest = pool.request();
  const beneficiaryWhere = bindCommon(beneficiaryCountRequest, query, "b", "b", "fechaRegistro");
  const beneficiaryTypeRequest = pool.request();
  const beneficiaryTypeWhere = bindCommon(beneficiaryTypeRequest, query, "b", "b", "fechaRegistro");
  const requestCountRequest = pool.request();
  const requestWhere = bindCommon(requestCountRequest, query, "b", "s", "fechaSolicitud", "estadoSolicitud");
  const requestStateRequest = pool.request();
  const requestStateWhere = bindCommon(requestStateRequest, query, "b", "s", "fechaSolicitud", "estadoSolicitud");
  const assignmentRequest = pool.request();
  const assignmentFilters = bindCommon(assignmentRequest, { ...query, estado: "all" }, "b", "a", "fechaAsignacion");
  const assignmentWhere = assignmentFilters ? `WHERE a.esAsignacionVigente=1 AND ${assignmentFilters.slice(6)}` : "WHERE a.esAsignacionVigente=1";
  const campusRequest = pool.request(); const buildingRequest = pool.request(); const elevatorRequest = pool.request(); const deviceRequest = pool.request();
  const campusWhere = bindInfrastructure(campusRequest, query, "c", "c");
  const buildingWhere = bindInfrastructure(buildingRequest, query, "e", "c", "e");
  const elevatorWhere = bindInfrastructure(elevatorRequest, query, "v", "c", "e");
  const deviceWhere = bindInfrastructure(deviceRequest, query, "d", "c", "e");
  const [beneficiaries, requests, requestStates, beneficiaryTypes, cards, assignments, campus, buildings, elevators, devices] = await Promise.all([
    beneficiaryCountRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b ${beneficiaryWhere}`),
    requestCountRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Solicitudes.tblSolicitudes s INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=s.idBeneficiario ${requestWhere}`),
    requestStateRequest.query(`SELECT tv.codigoTipoValor AS codigoEstado,tv.nombreTipoValor AS nombreEstado,COUNT(1) AS total FROM DbSigaUNAH.Solicitudes.tblSolicitudes s INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=s.idBeneficiario INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=s.idEstadoSolicitud ${requestStateWhere} GROUP BY tv.codigoTipoValor,tv.nombreTipoValor ORDER BY tv.nombreTipoValor`),
    beneficiaryTypeRequest.query(`SELECT tv.codigoTipoValor AS codigoTipo,tv.nombreTipoValor AS nombreTipo,COUNT(1) AS total FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=b.idTipoBeneficiario ${beneficiaryTypeWhere} GROUP BY tv.codigoTipoValor,tv.nombreTipoValor ORDER BY tv.nombreTipoValor`),
    (() => { const request = pool.request(); const where = query.estado === "all" ? "" : "WHERE t.estadoTarjeta=@cardActivo"; if (query.estado !== "all") request.input("cardActivo", sql.Bit, query.estado === "active"); return request.query(`SELECT tv.codigoTipoValor AS codigoEstado,tv.nombreTipoValor AS nombreEstado,COUNT(1) AS total FROM DbSigaUNAH.Tarjetas.tblTarjetas t INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta ${where} GROUP BY tv.codigoTipoValor,tv.nombreTipoValor ORDER BY tv.nombreTipoValor`); })(),
    assignmentRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario ${assignmentWhere}`),
    campusRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Accesos.tblCampus c ${campusWhere}`),
    buildingRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Accesos.tblEdificios e INNER JOIN DbSigaUNAH.Accesos.tblCampus c ON c.idCampus=e.idCampus ${buildingWhere}`),
    elevatorRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Accesos.tblElevadores v INNER JOIN DbSigaUNAH.Accesos.tblEdificios e ON e.idEdificio=v.idEdificio INNER JOIN DbSigaUNAH.Accesos.tblCampus c ON c.idCampus=e.idCampus ${elevatorWhere}`),
    deviceRequest.query(`SELECT COUNT(1) AS total FROM DbSigaUNAH.Accesos.tblDispositivos d LEFT JOIN DbSigaUNAH.Accesos.tblElevadores v ON v.idElevador=d.idElevador LEFT JOIN DbSigaUNAH.Accesos.tblEdificios e ON e.idEdificio=v.idEdificio LEFT JOIN DbSigaUNAH.Accesos.tblCampus c ON c.idCampus=e.idCampus ${deviceWhere}`)
  ]);
  return {
    beneficiarios: { total: beneficiaries.recordset[0]?.total ?? 0, porTipo: beneficiaryTypes.recordset },
    solicitudes: { total: requests.recordset[0]?.total ?? 0, porEstado: requestStates.recordset },
    tarjetas: { porEstado: cards.recordset },
    asignacionesVigentes: assignments.recordset[0]?.total ?? 0,
    infraestructura: { campus: campus.recordset[0]?.total ?? 0, edificios: buildings.recordset[0]?.total ?? 0, elevadores: elevators.recordset[0]?.total ?? 0, dispositivos: devices.recordset[0]?.total ?? 0 },
    filtros: { idCampus: query.idCampus ?? null, idEdificio: query.idEdificio ?? null, idTipoBeneficiario: query.idTipoBeneficiario ?? null, estado: query.estado, desde: query.desde ?? null, hasta: query.hasta ?? null }
  };
}
