import sql from "mssql";
import { getDatabasePool } from "../../shared/database/pool.js";
import type { AssignmentReportQuery, BeneficiaryReportQuery, CardReportQuery, HistoryReportQuery, ReportQuery, RequestReportQuery } from "./reportes.types.js";

function pageResult<T>(items: T[], total: number, query: { page: number; pageSize: number }) {
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
}

function bindPage(request: sql.Request, query: { page: number; pageSize: number }) {
  request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
}

function bindDateRange(request: sql.Request, query: { desde?: string; hasta?: string }, field: string, clauses: string[]) {
  if (query.desde) { clauses.push(`${field}>=@desde`); request.input("desde", sql.Date, query.desde); }
  if (query.hasta) { clauses.push(`${field}<DATEADD(day,1,@hasta)`); request.input("hasta", sql.Date, query.hasta); }
}

export async function options() {
  const pool = await getDatabasePool();
  const [campuses, buildings, beneficiaryTypes, conditions, requestStates, periods, cardStates, cardTypes, assignmentStates, beneficiaries] = await Promise.all([
    pool.request().query(`SELECT idCampus,codigoCampus,nombreCampus FROM DbSigaUNAH.Accesos.tblCampus WHERE estadoCampus=1 ORDER BY nombreCampus`),
    pool.request().query(`SELECT e.idEdificio,e.idCampus,e.codigoEdificio,e.nombreEdificio FROM DbSigaUNAH.Accesos.tblEdificios e INNER JOIN DbSigaUNAH.Accesos.tblCampus c ON c.idCampus=e.idCampus WHERE e.estadoEdificio=1 AND c.estadoCampus=1 ORDER BY e.nombreEdificio`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_BENEFICIARIO' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_CONDICION' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_SOLICITUD' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT idPeriodoAcademico,codigoPeriodoAcademico,nombrePeriodoAcademico,fechaInicioPeriodoAcademico,fechaFinPeriodoAcademico FROM DbSigaUNAH.Academico.tblPeriodosAcademicos WHERE estadoPeriodoAcademico=1 ORDER BY fechaInicioPeriodoAcademico DESC`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_TARJETA' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT idTipoTarjeta,codigoTipoTarjeta,nombreTipoTarjeta FROM DbSigaUNAH.Tarjetas.tblTiposTarjetas WHERE estadoTipoTarjeta=1 ORDER BY nombreTipoTarjeta`),
    pool.request().query(`SELECT tv.idTipoValor,codigoTipoValor,nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_ASIGNACION' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT b.idBeneficiario,CONCAT(p.primerNombre,N' ',p.primerApellido) AS nombreBeneficiario,b.numeroCuenta FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona WHERE b.estadoBeneficiario=1 ORDER BY p.primerApellido,p.primerNombre`)
  ]);
  return { campus: campuses.recordset, edificios: buildings.recordset, tiposBeneficiario: beneficiaryTypes.recordset, condiciones: conditions.recordset, estadosSolicitud: requestStates.recordset, periodos: periods.recordset, estadosTarjeta: cardStates.recordset, tiposTarjeta: cardTypes.recordset, estadosAsignacion: assignmentStates.recordset, beneficiarios: beneficiaries.recordset };
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

export async function beneficiaries(query: BeneficiaryReportQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request();
  const predicates: string[] = [];
  if (query.estado !== "all") { predicates.push(`b.estadoBeneficiario=@beneficiaryState`); request.input("beneficiaryState", sql.Bit, query.estado === "active"); countRequest.input("beneficiaryState", sql.Bit, query.estado === "active"); }
  if (query.idTipoBeneficiario) { predicates.push("b.idTipoBeneficiario=@beneficiaryType"); request.input("beneficiaryType", sql.Int, query.idTipoBeneficiario); countRequest.input("beneficiaryType", sql.Int, query.idTipoBeneficiario); }
  if (query.idTipoCondicion) { predicates.push("EXISTS (SELECT 1 FROM DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones filterCondition WHERE filterCondition.idBeneficiario=b.idBeneficiario AND filterCondition.idTipoCondicion=@conditionType AND filterCondition.estadoBeneficiarioCondicion=1)"); request.input("conditionType", sql.Int, query.idTipoCondicion); countRequest.input("conditionType", sql.Int, query.idTipoCondicion); }
  if (query.search) { predicates.push("(CONCAT(p.primerNombre,N' ',p.segundoNombre,N' ',p.primerApellido,N' ',p.segundoApellido) LIKE @beneficiarySearch OR b.numeroCuenta LIKE @beneficiarySearch OR b.codigoCarne LIKE @beneficiarySearch OR p.numeroIdentificacion LIKE @beneficiarySearch)"); request.input("beneficiarySearch", sql.NVarChar(150), `%${query.search}%`); countRequest.input("beneficiarySearch", sql.NVarChar(150), `%${query.search}%`); }
  bindDateRange(request, query, "b.fechaRegistro", predicates); bindDateRange(countRequest, query, "b.fechaRegistro", []);
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const from = `FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Tipos.tblTiposValores bt ON bt.idTipoValor=b.idTipoBeneficiario LEFT JOIN DbSigaUNAH.Academico.tblCarreras c ON c.idCarrera=b.idCarrera OUTER APPLY (SELECT TOP (1) bc.idTipoCondicion,bc.descripcionCondicion,bc.esTemporal,bc.fechaInicio,bc.fechaFinEstimada,bc.requiereRevision,ct.codigoTipoValor AS codigoTipoCondicion,ct.nombreTipoValor AS nombreTipoCondicion FROM DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones bc INNER JOIN DbSigaUNAH.Tipos.tblTiposValores ct ON ct.idTipoValor=bc.idTipoCondicion WHERE bc.idBeneficiario=b.idBeneficiario AND bc.estadoBeneficiarioCondicion=1 ORDER BY bc.fechaRegistro DESC,bc.idBeneficiarioCondicion DESC) conditionData`;
  bindPage(request, query);
  const [data, count] = await Promise.all([
    request.query(`SELECT b.idBeneficiario,CONCAT_WS(N' ',p.primerNombre,p.segundoNombre,p.primerApellido,p.segundoApellido) AS nombreCompleto,bt.codigoTipoValor AS codigoTipoBeneficiario,bt.nombreTipoValor AS nombreTipoBeneficiario,conditionData.codigoTipoCondicion,conditionData.nombreTipoCondicion,conditionData.descripcionCondicion,conditionData.esTemporal,conditionData.fechaInicio,conditionData.fechaFinEstimada,conditionData.requiereRevision,b.estadoBeneficiario,b.fechaRegistro,b.numeroCuenta,b.correoInstitucional,b.codigoCarne,b.estadoAcademico,c.codigoCarrera,c.nombreCarrera,c.nivelAcademico ${from} ${where} ORDER BY b.fechaRegistro ${query.sortDirection === "asc" ? "ASC" : "DESC"},b.idBeneficiario OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`)
  ]);
  return pageResult(data.recordset, count.recordset[0]?.total ?? 0, query);
}

export async function requests(query: RequestReportQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const predicates: string[] = [];
  if (query.idEstadoSolicitud) { predicates.push("s.idEstadoSolicitud=@requestState"); request.input("requestState", sql.Int, query.idEstadoSolicitud); countRequest.input("requestState", sql.Int, query.idEstadoSolicitud); }
  if (query.codigoEstadoSolicitud) { predicates.push("es.codigoTipoValor=@requestStateCode"); request.input("requestStateCode", sql.NVarChar(100), query.codigoEstadoSolicitud); countRequest.input("requestStateCode", sql.NVarChar(100), query.codigoEstadoSolicitud); }
  if (query.idPeriodoAcademico) { predicates.push("s.idPeriodoAcademico=@academicPeriod"); request.input("academicPeriod", sql.Int, query.idPeriodoAcademico); countRequest.input("academicPeriod", sql.Int, query.idPeriodoAcademico); }
  if (query.idBeneficiario) { predicates.push("s.idBeneficiario=@requestBeneficiary"); request.input("requestBeneficiary", sql.BigInt, query.idBeneficiario); countRequest.input("requestBeneficiary", sql.BigInt, query.idBeneficiario); }
  if (query.sinAsignacion) predicates.push("currentAssignment.idAsignacion IS NULL");
  if (query.search) { predicates.push("(s.codigoSolicitud LIKE @requestSearch OR CONCAT(p.primerNombre,N' ',p.primerApellido) LIKE @requestSearch OR b.numeroCuenta LIKE @requestSearch)"); request.input("requestSearch", sql.NVarChar(150), `%${query.search}%`); countRequest.input("requestSearch", sql.NVarChar(150), `%${query.search}%`); }
  bindDateRange(request, query, "s.fechaSolicitud", predicates); bindDateRange(countRequest, query, "s.fechaSolicitud", []);
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const from = `FROM DbSigaUNAH.Solicitudes.tblSolicitudes s INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=s.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Tipos.tblTiposValores es ON es.idTipoValor=s.idEstadoSolicitud INNER JOIN DbSigaUNAH.Tipos.tblTipos et ON et.idTipo=es.idTipo AND et.codigoTipo='ESTADO_SOLICITUD' LEFT JOIN DbSigaUNAH.Academico.tblPeriodosAcademicos pa ON pa.idPeriodoAcademico=s.idPeriodoAcademico LEFT JOIN DbSigaUNAH.Solicitudes.tblTiposSolicitudes st ON st.idTipoSolicitud=s.idTipoSolicitud OUTER APPLY (SELECT TOP (1) a.idAsignacion,a.idTarjeta,t.codigoTarjeta FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=a.idTarjeta WHERE a.idSolicitud=s.idSolicitud AND a.esAsignacionVigente=1 ORDER BY a.idAsignacion DESC) currentAssignment OUTER APPLY (SELECT TOP (1) ap.tipoDecision,ap.fechaAprobacion,ap.observacionAprobacion FROM DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones ap WHERE ap.idSolicitud=s.idSolicitud ORDER BY ap.fechaAprobacion DESC,ap.idSolicitudAprobacion DESC) approvalData`;
  bindPage(request, query);
  const [data, count] = await Promise.all([
    request.query(`SELECT s.idSolicitud,s.codigoSolicitud,s.idBeneficiario,CONCAT_WS(N' ',p.primerNombre,p.segundoNombre,p.primerApellido,p.segundoApellido) AS nombreBeneficiario,s.fechaSolicitud,pa.idPeriodoAcademico,pa.codigoPeriodoAcademico,pa.nombrePeriodoAcademico,st.codigoTipoSolicitud,st.nombreTipoSolicitud,es.idTipoValor AS idEstadoSolicitud,es.codigoTipoValor AS codigoEstadoSolicitud,es.nombreTipoValor AS nombreEstadoSolicitud,s.fechaResolucion,s.observacionResolucion,approvalData.tipoDecision,approvalData.fechaAprobacion,approvalData.observacionAprobacion,currentAssignment.idAsignacion,currentAssignment.idTarjeta,currentAssignment.codigoTarjeta,CASE WHEN currentAssignment.idAsignacion IS NULL THEN CAST(0 AS bit) ELSE CAST(1 AS bit) END AS tieneAsignacionVigente ${from} ${where} ORDER BY s.fechaSolicitud ${query.sortDirection === "asc" ? "ASC" : "DESC"},s.idSolicitud OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`)
  ]);
  return pageResult(data.recordset, count.recordset[0]?.total ?? 0, query);
}

export async function cards(query: CardReportQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const predicates: string[] = [];
  if (query.idEstadoTarjeta) { predicates.push("t.idEstadoTarjeta=@cardState"); request.input("cardState", sql.Int, query.idEstadoTarjeta); countRequest.input("cardState", sql.Int, query.idEstadoTarjeta); }
  if (query.idTipoTarjeta) { predicates.push("t.idTipoTarjeta=@cardType"); request.input("cardType", sql.Int, query.idTipoTarjeta); countRequest.input("cardType", sql.Int, query.idTipoTarjeta); }
  if (query.disponibilidad === "available") predicates.push("currentAssignment.idAsignacion IS NULL");
  if (query.disponibilidad === "assigned") predicates.push("currentAssignment.idAsignacion IS NOT NULL");
  if (query.search) { predicates.push("(t.codigoTarjeta LIKE @cardSearch OR t.codigoExterno LIKE @cardSearch OR t.numeroSerie LIKE @cardSearch OR CONCAT(p.primerNombre,N' ',p.primerApellido) LIKE @cardSearch)"); request.input("cardSearch", sql.NVarChar(150), `%${query.search}%`); countRequest.input("cardSearch", sql.NVarChar(150), `%${query.search}%`); }
  bindDateRange(request, query, "t.fechaAlta", predicates); bindDateRange(countRequest, query, "t.fechaAlta", []);
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const from = `FROM DbSigaUNAH.Tarjetas.tblTarjetas t INNER JOIN DbSigaUNAH.Tipos.tblTiposValores ts ON ts.idTipoValor=t.idEstadoTarjeta INNER JOIN DbSigaUNAH.Tipos.tblTipos tst ON tst.idTipo=ts.idTipo AND tst.codigoTipo='ESTADO_TARJETA' LEFT JOIN DbSigaUNAH.Tarjetas.tblTiposTarjetas tt ON tt.idTipoTarjeta=t.idTipoTarjeta OUTER APPLY (SELECT TOP (1) a.idAsignacion,a.idSolicitud,a.idBeneficiario,a.fechaAsignacion,a.fechaEntrega,a.fechaInicioVigencia,a.fechaFinVigencia,a.fechaDevolucion,ae.nombreTipoValor AS nombreEstadoAsignacion,s.codigoSolicitud,CONCAT_WS(N' ',p.primerNombre,p.segundoNombre,p.primerApellido,p.segundoApellido) AS nombreBeneficiario FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Tipos.tblTiposValores ae ON ae.idTipoValor=a.idEstadoAsignacion LEFT JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud LEFT JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario LEFT JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona WHERE a.idTarjeta=t.idTarjeta ORDER BY a.esAsignacionVigente DESC,a.fechaAsignacion DESC,a.idAsignacion DESC) currentAssignment`;
  bindPage(request, query);
  const [data, count] = await Promise.all([
    request.query(`SELECT t.idTarjeta,t.codigoTarjeta,t.codigoExterno,t.numeroSerie,tt.codigoTipoTarjeta,tt.nombreTipoTarjeta,t.idTipoTarjeta,t.idEstadoTarjeta,ts.codigoTipoValor AS codigoEstadoTarjeta,ts.nombreTipoValor AS nombreEstadoTarjeta,t.estadoTarjeta,t.fechaAlta,t.fechaBaja,currentAssignment.idAsignacion,currentAssignment.idSolicitud,currentAssignment.idBeneficiario,currentAssignment.nombreBeneficiario,currentAssignment.codigoSolicitud,currentAssignment.fechaAsignacion,currentAssignment.fechaEntrega,currentAssignment.fechaInicioVigencia,currentAssignment.fechaFinVigencia,currentAssignment.fechaDevolucion,currentAssignment.nombreEstadoAsignacion,CASE WHEN currentAssignment.idAsignacion IS NULL THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS disponible ${from} ${where} ORDER BY t.fechaAlta ${query.sortDirection === "asc" ? "ASC" : "DESC"},t.idTarjeta OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`)
  ]);
  return pageResult(data.recordset, count.recordset[0]?.total ?? 0, query);
}

export async function assignments(query: AssignmentReportQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const predicates: string[] = [];
  if (query.idEstadoAsignacion) { predicates.push("a.idEstadoAsignacion=@assignmentState"); request.input("assignmentState", sql.Int, query.idEstadoAsignacion); countRequest.input("assignmentState", sql.Int, query.idEstadoAsignacion); }
  if (query.idBeneficiario) { predicates.push("a.idBeneficiario=@assignmentBeneficiary"); request.input("assignmentBeneficiary", sql.BigInt, query.idBeneficiario); countRequest.input("assignmentBeneficiary", sql.BigInt, query.idBeneficiario); }
  if (query.idTarjeta) { predicates.push("a.idTarjeta=@assignmentCard"); request.input("assignmentCard", sql.BigInt, query.idTarjeta); countRequest.input("assignmentCard", sql.BigInt, query.idTarjeta); }
  if (query.search) { predicates.push("(t.codigoTarjeta LIKE @assignmentSearch OR CONCAT(p.primerNombre,N' ',p.primerApellido) LIKE @assignmentSearch OR s.codigoSolicitud LIKE @assignmentSearch)"); request.input("assignmentSearch", sql.NVarChar(150), `%${query.search}%`); countRequest.input("assignmentSearch", sql.NVarChar(150), `%${query.search}%`); }
  bindDateRange(request, query, "a.fechaAsignacion", predicates); bindDateRange(countRequest, query, "a.fechaAsignacion", []);
  if (query.estado === "vigentes") predicates.push("a.esAsignacionVigente=1 AND (a.fechaFinVigencia IS NULL OR a.fechaFinVigencia>=CONVERT(date,GETDATE()))");
  if (query.estado === "vencidas") predicates.push("a.esAsignacionVigente=1 AND a.fechaFinVigencia<CONVERT(date,GETDATE())");
  if (query.estado === "proximas") { predicates.push("a.esAsignacionVigente=1 AND a.fechaFinVigencia>=CONVERT(date,GETDATE()) AND a.fechaFinVigencia<DATEADD(day,@upcomingDays,DATEADD(day,1,CONVERT(date,GETDATE())))"); request.input("upcomingDays", sql.Int, query.proximasDias); countRequest.input("upcomingDays", sql.Int, query.proximasDias); }
  if (query.estado === "finalizadas") predicates.push("a.esAsignacionVigente=0");
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const from = `FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=a.idTarjeta INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud INNER JOIN DbSigaUNAH.Tipos.tblTiposValores ast ON ast.idTipoValor=a.idEstadoAsignacion`;
  bindPage(request, query);
  const [data, count] = await Promise.all([
    request.query(`SELECT a.idAsignacion,a.idBeneficiario,a.idTarjeta,a.idSolicitud,CONCAT_WS(N' ',p.primerNombre,p.segundoNombre,p.primerApellido,p.segundoApellido) AS nombreBeneficiario,t.codigoTarjeta,s.codigoSolicitud,ast.codigoTipoValor AS codigoEstadoAsignacion,ast.nombreTipoValor AS nombreEstadoAsignacion,a.fechaAsignacion,a.fechaInicioVigencia,a.fechaFinVigencia,a.fechaDevolucion,a.esAsignacionVigente,CASE WHEN a.fechaFinVigencia IS NULL THEN NULL ELSE DATEDIFF(day,CONVERT(date,GETDATE()),a.fechaFinVigencia) END AS diasRestantes ${from} ${where} ORDER BY a.fechaAsignacion ${query.sortDirection === "asc" ? "ASC" : "DESC"},a.idAsignacion OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`)
  ]);
  return pageResult(data.recordset, count.recordset[0]?.total ?? 0, query);
}

function historyFrom(query: HistoryReportQuery) {
  const branches: string[] = [];
  if (query.tipoMovimiento === "all" || query.tipoMovimiento === "asignacion") branches.push(`SELECT N'asignacion' AS tipoMovimiento,a.idAsignacion AS idMovimiento,a.idBeneficiario,a.idTarjeta,a.idSolicitud,CONCAT_WS(N' ',p.primerNombre,p.primerApellido) AS nombreBeneficiario,t.codigoTarjeta,s.codigoSolicitud,aes.fechaRegistro AS fechaMovimiento,oldState.codigoTipoValor AS codigoEstadoAnterior,oldState.nombreTipoValor AS nombreEstadoAnterior,newState.codigoTipoValor AS codigoEstadoNuevo,newState.nombreTipoValor AS nombreEstadoNuevo,aes.idUsuarioResponsable,aes.usuarioRegistro AS usuarioResponsable,aes.motivoCambio FROM DbSigaUNAH.Tarjetas.tblAsignacionesEstados aes INNER JOIN DbSigaUNAH.Tarjetas.tblAsignaciones a ON a.idAsignacion=aes.idAsignacion INNER JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=a.idTarjeta INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud LEFT JOIN DbSigaUNAH.Tipos.tblTiposValores oldState ON oldState.idTipoValor=aes.idEstadoAsignacionAnterior INNER JOIN DbSigaUNAH.Tipos.tblTiposValores newState ON newState.idTipoValor=aes.idEstadoAsignacionNuevo`);
  if (query.tipoMovimiento === "all" || query.tipoMovimiento === "solicitud") branches.push(`SELECT N'solicitud' AS tipoMovimiento,s.idSolicitud AS idMovimiento,s.idBeneficiario,latestAssignment.idTarjeta,s.idSolicitud,CONCAT_WS(N' ',p.primerNombre,p.primerApellido) AS nombreBeneficiario,t.codigoTarjeta,s.codigoSolicitud,ses.fechaRegistro AS fechaMovimiento,oldState.codigoTipoValor AS codigoEstadoAnterior,oldState.nombreTipoValor AS nombreEstadoAnterior,newState.codigoTipoValor AS codigoEstadoNuevo,newState.nombreTipoValor AS nombreEstadoNuevo,ses.idUsuarioResponsable,ses.usuarioRegistro AS usuarioResponsable,ses.motivoCambio FROM DbSigaUNAH.Solicitudes.tblSolicitudesEstados ses INNER JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=ses.idSolicitud INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=s.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona OUTER APPLY (SELECT TOP (1) a.idTarjeta FROM DbSigaUNAH.Tarjetas.tblAsignaciones a WHERE a.idSolicitud=s.idSolicitud ORDER BY a.idAsignacion DESC) latestAssignment LEFT JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=latestAssignment.idTarjeta LEFT JOIN DbSigaUNAH.Tipos.tblTiposValores oldState ON oldState.idTipoValor=ses.idEstadoSolicitudAnterior INNER JOIN DbSigaUNAH.Tipos.tblTiposValores newState ON newState.idTipoValor=ses.idEstadoSolicitudNuevo`);
  if (query.tipoMovimiento === "all" || query.tipoMovimiento === "tarjeta") branches.push(`SELECT N'tarjeta' AS tipoMovimiento,tes.idTarjetaEstado AS idMovimiento,latestAssignment.idBeneficiario,tes.idTarjeta,latestAssignment.idSolicitud,latestAssignment.nombreBeneficiario,t.codigoTarjeta,latestAssignment.codigoSolicitud,tes.fechaRegistro AS fechaMovimiento,oldState.codigoTipoValor AS codigoEstadoAnterior,oldState.nombreTipoValor AS nombreEstadoAnterior,newState.codigoTipoValor AS codigoEstadoNuevo,newState.nombreTipoValor AS nombreEstadoNuevo,tes.idUsuarioResponsable,tes.usuarioRegistro AS usuarioResponsable,tes.motivoCambio FROM DbSigaUNAH.Tarjetas.tblTarjetasEstados tes INNER JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=tes.idTarjeta OUTER APPLY (SELECT TOP (1) a.idBeneficiario,a.idSolicitud,CONCAT_WS(N' ',p.primerNombre,p.primerApellido) AS nombreBeneficiario,s.codigoSolicitud FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud WHERE a.idTarjeta=tes.idTarjeta ORDER BY a.idAsignacion DESC) latestAssignment LEFT JOIN DbSigaUNAH.Tipos.tblTiposValores oldState ON oldState.idTipoValor=tes.idEstadoTarjetaAnterior INNER JOIN DbSigaUNAH.Tipos.tblTiposValores newState ON newState.idTipoValor=tes.idEstadoTarjetaNuevo`);
  return branches.join(" UNION ALL ");
}

export async function history(query: HistoryReportQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const clauses: string[] = [];
  if (query.idBeneficiario) { clauses.push("history.idBeneficiario=@historyBeneficiary"); request.input("historyBeneficiary", sql.BigInt, query.idBeneficiario); countRequest.input("historyBeneficiary", sql.BigInt, query.idBeneficiario); }
  if (query.idTarjeta) { clauses.push("history.idTarjeta=@historyCard"); request.input("historyCard", sql.BigInt, query.idTarjeta); countRequest.input("historyCard", sql.BigInt, query.idTarjeta); }
  bindDateRange(request, query, "history.fechaMovimiento", clauses); bindDateRange(countRequest, query, "history.fechaMovimiento", []);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""; const source = `(${historyFrom(query)}) history`;
  bindPage(request, query);
  const [data, count] = await Promise.all([
    request.query(`SELECT history.tipoMovimiento,history.idMovimiento,history.idBeneficiario,history.idTarjeta,history.idSolicitud,history.nombreBeneficiario,history.codigoTarjeta,history.codigoSolicitud,history.fechaMovimiento,history.codigoEstadoAnterior,history.nombreEstadoAnterior,history.codigoEstadoNuevo,history.nombreEstadoNuevo,history.idUsuarioResponsable,history.usuarioResponsable,history.motivoCambio FROM ${source} ${where} ORDER BY history.fechaMovimiento ${query.sortDirection === "asc" ? "ASC" : "DESC"},history.idMovimiento DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM ${source} ${where}`)
  ]);
  return pageResult(data.recordset, count.recordset[0]?.total ?? 0, query);
}
