import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { AssignmentInput, AssignmentQuery, Create, HistoryQuery, Query, RenewAssignment, ReplaceAssignment, ReturnAssignment, State, Update } from "./tarjetas.types.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { AuthContext } from "../auth/auth-context.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";

const columns = `t.idTarjeta,t.codigoTarjeta,t.codigoExterno,t.numeroSerie,t.idEstadoTarjeta,t.idTipoTarjeta,t.fechaAdquisicion,t.fechaAlta,t.fechaBaja,t.motivoBaja,t.requiereRevision,t.observacionTarjeta,t.estadoTarjeta,t.usuarioRegistro,t.fechaRegistro,t.usuarioActualizacion,t.fechaActualizacion,tv.codigoTipoValor AS codigoEstadoTarjeta,tv.nombreTipoValor AS nombreEstadoTarjeta,tt.codigoTipoTarjeta,tt.nombreTipoTarjeta,a.idAsignacion,a.idSolicitud,a.idBeneficiario,a.fechaAsignacion,a.fechaInicioVigencia,a.fechaFinVigencia,a.idEstadoAsignacion,a.esAsignacionVigente,p.nombreBeneficiario,s.codigoSolicitud,b.numeroCuenta,e.nombreTipoValor AS nombreEstadoAsignacion,(SELECT STRING_AGG(CONVERT(nvarchar(max),pa.nombrePerfilAcceso),N', ') FROM DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ap INNER JOIN DbSigaUNAH.Accesos.tblPerfilesAcceso pa ON pa.idPerfilAcceso=ap.idPerfilAcceso WHERE ap.idAsignacion=a.idAsignacion AND ap.estadoAsignacionPerfilAcceso=1) AS perfilesAcceso`;
const from = `FROM DbSigaUNAH.Tarjetas.tblTarjetas t INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta LEFT JOIN DbSigaUNAH.Tarjetas.tblTiposTarjetas tt ON tt.idTipoTarjeta=t.idTipoTarjeta LEFT JOIN DbSigaUNAH.Tarjetas.tblAsignaciones a ON a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1 LEFT JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud LEFT JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario LEFT JOIN (SELECT b2.idBeneficiario, CONCAT(p2.primerNombre,' ',p2.primerApellido) AS nombreBeneficiario FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b2 INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p2 ON p2.idPersona=b2.idPersona) p ON p.idBeneficiario=a.idBeneficiario LEFT JOIN DbSigaUNAH.Tipos.tblTiposValores e ON e.idTipoValor=a.idEstadoAsignacion`;
const sortColumns = { idTarjeta: "t.idTarjeta", codigoTarjeta: "t.codigoTarjeta", estado: "tv.nombreTipoValor", fechaAlta: "t.fechaAlta" } as const;

export async function list(query: Query) { const pool=await getDatabasePool(); const request=pool.request().input("offset",sql.Int,(query.page-1)*query.pageSize).input("pageSize",sql.Int,query.pageSize); const countRequest=pool.request(); const predicates:string[]=[]; if(query.search){predicates.push("(t.codigoTarjeta LIKE @search OR t.codigoExterno LIKE @search OR t.numeroSerie LIKE @search OR p.nombreBeneficiario LIKE @search OR s.codigoSolicitud LIKE @search)");request.input("search",sql.NVarChar(150),`%${query.search}%`);countRequest.input("search",sql.NVarChar(150),`%${query.search}%`);} if(query.estado!=="all"){predicates.push("t.estadoTarjeta=@active");request.input("active",sql.Bit,query.estado==="active");countRequest.input("active",sql.Bit,query.estado==="active");} const where=predicates.length?`WHERE ${predicates.join(" AND ")}`:""; const direction=query.sortDirection==="desc"?"DESC":"ASC"; const result=await request.query(`SELECT ${columns} ${from} ${where} ORDER BY ${sortColumns[query.sortBy]} ${direction},t.idTarjeta OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`); const count=await countRequest.query<{total:number}>(`SELECT COUNT(1) AS total ${from} ${where}`); return {items:result.recordset,total:count.recordset[0]?.total??0}; }
export async function find(id: bigint) { const pool=await getDatabasePool(); const result=await pool.request().input("id",sql.BigInt,id).query(`SELECT ${columns} ${from} WHERE t.idTarjeta=@id`); return result.recordset[0]??null; }
export async function options() { const pool=await getDatabasePool(); const [states,types,vigencias,assignmentStates,beneficiaries,requests]=await Promise.all([pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_TARJETA' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),pool.request().query(`SELECT idTipoTarjeta,codigoTipoTarjeta,nombreTipoTarjeta FROM DbSigaUNAH.Tarjetas.tblTiposTarjetas WHERE estadoTipoTarjeta=1 ORDER BY nombreTipoTarjeta`),pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_VIGENCIA' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_ASIGNACION' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),pool.request().query(`SELECT b.idBeneficiario,CONCAT(p.primerNombre,' ',p.primerApellido) AS nombreBeneficiario,b.numeroCuenta FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona WHERE b.estadoBeneficiario=1 ORDER BY p.primerApellido,p.primerNombre`),pool.request().query(`SELECT s.idSolicitud,s.codigoSolicitud,s.idBeneficiario,CONCAT(p.primerNombre,' ',p.primerApellido) AS nombreBeneficiario FROM DbSigaUNAH.Solicitudes.tblSolicitudes s INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=s.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona WHERE s.estadoSolicitud=1 ORDER BY s.fechaRegistro DESC`)]); return {estadosTarjeta:states.recordset,tiposTarjeta:types.recordset,tiposVigencia:vigencias.recordset,estadosAsignacion:assignmentStates.recordset,beneficiarios:beneficiaries.recordset,solicitudes:requests.recordset}; }

async function insertCard(request: sql.Request, data: Create | Update) { const result=await request.input("codigoTarjeta",sql.NVarChar(30),data.codigoTarjeta).input("codigoExterno",sql.NVarChar(50),data.codigoExterno??null).input("numeroSerie",sql.NVarChar(100),data.numeroSerie??null).input("idEstadoTarjeta",sql.Int,data.idEstadoTarjeta).input("idTipoTarjeta",sql.Int,data.idTipoTarjeta??null).input("fechaAdquisicion",sql.Date,data.fechaAdquisicion??null).input("fechaAlta",sql.Date,data.fechaAlta).input("fechaBaja",sql.Date,data.fechaBaja??null).input("motivoBaja",sql.NVarChar(500),data.motivoBaja??null).input("requiereRevision",sql.Bit,data.requiereRevision).input("observacion",sql.NVarChar(1000),data.observacionTarjeta??null).input("usuario",sql.NVarChar(90),"usuarioRegistro" in data?data.usuarioRegistro:data.usuarioActualizacion).query(`INSERT INTO DbSigaUNAH.Tarjetas.tblTarjetas (codigoTarjeta,codigoExterno,numeroSerie,idEstadoTarjeta,idTipoTarjeta,fechaAdquisicion,fechaAlta,fechaBaja,motivoBaja,requiereRevision,observacionTarjeta,usuarioRegistro) OUTPUT INSERTED.idTarjeta VALUES (@codigoTarjeta,@codigoExterno,@numeroSerie,@idEstadoTarjeta,@idTipoTarjeta,@fechaAdquisicion,@fechaAlta,@fechaBaja,@motivoBaja,@requiereRevision,@observacion,@usuario)`); return BigInt(result.recordset[0].idTarjeta); }
export async function create(data: Create, actor: AuthContext) { const pool=await getDatabasePool(); const tx=new sql.Transaction(pool); try { await tx.begin(); const actorData={...data,usuarioRegistro:actor.nombreAcceso}; const id=await insertCard(new sql.Request(tx),actorData); if(data.assignment){const a=data.assignment; await new sql.Request(tx).input("idSolicitud",sql.BigInt,a.idSolicitud).input("idBeneficiario",sql.BigInt,a.idBeneficiario).input("idTarjeta",sql.BigInt,id).input("idTipoVigencia",sql.Int,a.idTipoVigencia).input("idEstadoAsignacion",sql.Int,a.idEstadoAsignacion).input("fechaAsignacion",sql.DateTime2,a.fechaAsignacion).input("fechaInicio",sql.Date,a.fechaInicioVigencia).input("fechaFin",sql.Date,a.fechaFinVigencia??null).input("numeroCompromiso",sql.NVarChar(50),a.numeroCompromiso??null).input("observacion",sql.NVarChar(1000),a.observacionEntrega??null).input("usuario",sql.NVarChar(90),actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Tarjetas.tblAsignaciones (idSolicitud,idBeneficiario,idTarjeta,idTipoVigencia,idEstadoAsignacion,fechaAsignacion,fechaInicioVigencia,fechaFinVigencia,numeroCompromiso,observacionEntrega,esAsignacionVigente,usuarioRegistro) VALUES (@idSolicitud,@idBeneficiario,@idTarjeta,@idTipoVigencia,@idEstadoAsignacion,@fechaAsignacion,@fechaInicio,@fechaFin,@numeroCompromiso,@observacion,1,@usuario)`);} await audit(new sql.Request(tx),actor,"tblTarjetas",id,"CREAR",null,{idTarjeta:id,codigoTarjeta:data.codigoTarjeta,idEstadoTarjeta:data.idEstadoTarjeta}); await tx.commit(); return find(id); } catch(error){await tx.rollback().catch(()=>undefined); return mapSqlError(error);} }
export async function update(id: bigint,data: Update){try{const pool=await getDatabasePool();await pool.request().input("id",sql.BigInt,id).input("codigoTarjeta",sql.NVarChar(30),data.codigoTarjeta).input("codigoExterno",sql.NVarChar(50),data.codigoExterno??null).input("numeroSerie",sql.NVarChar(100),data.numeroSerie??null).input("idEstadoTarjeta",sql.Int,data.idEstadoTarjeta).input("idTipoTarjeta",sql.Int,data.idTipoTarjeta??null).input("fechaAdquisicion",sql.Date,data.fechaAdquisicion??null).input("fechaAlta",sql.Date,data.fechaAlta).input("fechaBaja",sql.Date,data.fechaBaja??null).input("motivoBaja",sql.NVarChar(500),data.motivoBaja??null).input("requiereRevision",sql.Bit,data.requiereRevision).input("observacion",sql.NVarChar(1000),data.observacionTarjeta??null).input("usuario",sql.NVarChar(90),data.usuarioActualizacion).query(`UPDATE DbSigaUNAH.Tarjetas.tblTarjetas SET codigoTarjeta=@codigoTarjeta,codigoExterno=@codigoExterno,numeroSerie=@numeroSerie,idEstadoTarjeta=@idEstadoTarjeta,idTipoTarjeta=@idTipoTarjeta,fechaAdquisicion=@fechaAdquisicion,fechaAlta=@fechaAlta,fechaBaja=@fechaBaja,motivoBaja=@motivoBaja,requiereRevision=@requiereRevision,observacionTarjeta=@observacion,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idTarjeta=@id`);return find(id);}catch(error){return mapSqlError(error);}}
export async function state(id: bigint,data: State){try{const pool=await getDatabasePool();await pool.request().input("id",sql.BigInt,id).input("state",sql.Int,data.idEstadoTarjeta).input("user",sql.NVarChar(90),data.usuarioActualizacion).query(`UPDATE DbSigaUNAH.Tarjetas.tblTarjetas SET idEstadoTarjeta=@state,usuarioActualizacion=@user,fechaActualizacion=sysdatetime() WHERE idTarjeta=@id`);return find(id);}catch(error){return mapSqlError(error);}}

const assignmentColumns = `a.idAsignacion,a.idSolicitud,a.idBeneficiario,a.idTarjeta,a.idTipoVigencia,a.idEstadoAsignacion,a.fechaAsignacion,a.fechaEntrega,a.fechaInicioVigencia,a.fechaFinVigencia,a.fechaDevolucion,a.numeroCompromiso,a.observacionEntrega,a.esAsignacionVigente,a.estadoAsignacion,t.codigoTarjeta,CONCAT(p.primerNombre,N' ',p.primerApellido) AS nombreBeneficiario,s.codigoSolicitud,e.nombreTipoValor AS nombreEstadoAsignacion,(SELECT STRING_AGG(CONVERT(nvarchar(max),pa.nombrePerfilAcceso),N', ') FROM DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ap INNER JOIN DbSigaUNAH.Accesos.tblPerfilesAcceso pa ON pa.idPerfilAcceso=ap.idPerfilAcceso WHERE ap.idAsignacion=a.idAsignacion AND ap.estadoAsignacionPerfilAcceso=1) AS perfilesAcceso`;
const assignmentFrom = `FROM DbSigaUNAH.Tarjetas.tblAsignaciones a INNER JOIN DbSigaUNAH.Tarjetas.tblTarjetas t ON t.idTarjeta=a.idTarjeta INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona INNER JOIN DbSigaUNAH.Solicitudes.tblSolicitudes s ON s.idSolicitud=a.idSolicitud INNER JOIN DbSigaUNAH.Tipos.tblTiposValores e ON e.idTipoValor=a.idEstadoAsignacion`;

function audit(request: sql.Request, actor: AuthContext, entity: string, id: bigint | number, action: string, before: unknown, after: unknown) {
  return request.input("auditUser", sql.BigInt, actor.idUsuario).input("auditModule", sql.NVarChar(80), "TARJETAS").input("auditEntity", sql.NVarChar(150), entity).input("auditId", sql.NVarChar(100), String(id)).input("auditAction", sql.NVarChar(30), action).input("auditBefore", sql.NVarChar(sql.MAX), stringifyJsonSafe(before)).input("auditAfter", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("auditRegistration", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Auditoria.tblBitacoras(idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,usuarioRegistro) VALUES(@auditUser,@auditModule,@auditEntity,@auditId,@auditAction,@auditBefore,@auditAfter,@auditRegistration)`);
}

export async function listAssignments(query: AssignmentQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const predicates = query.historial ? [] : ["a.esAsignacionVigente=1"];
  if (query.idBeneficiario) { predicates.push("a.idBeneficiario=@beneficiary"); request.input("beneficiary", sql.BigInt, query.idBeneficiario); }
  if (query.idTarjeta) { predicates.push("a.idTarjeta=@card"); request.input("card", sql.BigInt, query.idTarjeta); }
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const rows = await request.query(`${`SELECT ${assignmentColumns}`} ${assignmentFrom} ${where} ORDER BY a.fechaRegistro DESC,a.idAsignacion DESC`);
  return rows.recordset;
}

export async function availableCards() {
  const pool = await getDatabasePool();
  return (await pool.request().query(`SELECT t.idTarjeta,t.codigoTarjeta,t.codigoExterno,t.numeroSerie,t.idEstadoTarjeta,t.idTipoTarjeta,tv.codigoTipoValor AS codigoEstadoTarjeta,tv.nombreTipoValor AS nombreEstadoTarjeta FROM DbSigaUNAH.Tarjetas.tblTarjetas t INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta WHERE t.estadoTarjeta=1 AND NOT EXISTS(SELECT 1 FROM DbSigaUNAH.Tarjetas.tblAsignaciones a WHERE a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1) ORDER BY t.codigoTarjeta`)).recordset;
}

export const availabilityDiagnosticsQuery = `
;WITH tarjetaDisponibilidad AS (
  SELECT t.idTarjeta,t.estadoTarjeta,tv.codigoTipoValor AS codigoEstadoTarjeta,tv.nombreTipoValor AS nombreEstadoTarjeta,
    CASE WHEN EXISTS (
      SELECT 1 FROM DbSigaUNAH.Tarjetas.tblAsignaciones a
      WHERE a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1
    ) THEN 1 ELSE 0 END AS tieneAsignacionVigente
  FROM DbSigaUNAH.Tarjetas.tblTarjetas t
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta
)
SELECT COUNT_BIG(*) AS totalTarjetas,
  SUM(CASE WHEN estadoTarjeta=1 THEN 1 ELSE 0 END) AS tarjetasActivas,
  SUM(CASE WHEN estadoTarjeta=1 AND tieneAsignacionVigente=0 THEN 1 ELSE 0 END) AS disponibles,
  SUM(CASE WHEN estadoTarjeta=1 AND tieneAsignacionVigente=1 THEN 1 ELSE 0 END) AS conAsignacionVigente,
  SUM(CASE WHEN estadoTarjeta=0 THEN 1 ELSE 0 END) AS inactivas
FROM tarjetaDisponibilidad;
;WITH tarjetaDisponibilidad AS (
  SELECT t.idTarjeta,t.estadoTarjeta,tv.codigoTipoValor AS codigoEstadoTarjeta,tv.nombreTipoValor AS nombreEstadoTarjeta,
    CASE WHEN EXISTS (
      SELECT 1 FROM DbSigaUNAH.Tarjetas.tblAsignaciones a
      WHERE a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1
    ) THEN 1 ELSE 0 END AS tieneAsignacionVigente
  FROM DbSigaUNAH.Tarjetas.tblTarjetas t
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta
)
SELECT codigoEstadoTarjeta,nombreEstadoTarjeta,
  COUNT_BIG(*) AS total,
  SUM(CASE WHEN estadoTarjeta=1 THEN 1 ELSE 0 END) AS activas,
  SUM(CASE WHEN estadoTarjeta=1 AND tieneAsignacionVigente=1 THEN 1 ELSE 0 END) AS conAsignacionVigente,
  SUM(CASE WHEN estadoTarjeta=1 AND tieneAsignacionVigente=0 THEN 1 ELSE 0 END) AS disponibles
FROM tarjetaDisponibilidad
GROUP BY codigoEstadoTarjeta,nombreEstadoTarjeta
ORDER BY nombreEstadoTarjeta;`;

export async function availabilityDiagnostics() {
  const pool = await getDatabasePool();
  const result = await pool.request().query(availabilityDiagnosticsQuery);
  const recordsets = result.recordsets as Array<Array<Record<string, unknown>>>;
  return { resumen: recordsets[0]?.[0] ?? null, porEstado: recordsets[1] ?? [] };
}

export async function accessOptions() {
  const pool = await getDatabasePool();
  const [profiles, elevators] = await Promise.all([
    pool.request().query(`SELECT pa.idPerfilAcceso,pa.codigoPerfilAcceso,pa.nombrePerfilAcceso,pa.descripcionPerfilAcceso,pa.horaInicio,pa.horaFin,pa.diasSemana,(SELECT STRING_AGG(CONVERT(nvarchar(max),e.codigoElevador+N' · '+e.nombreElevador),N', ') FROM DbSigaUNAH.Accesos.tblPerfilesAccesoElevadores pae INNER JOIN DbSigaUNAH.Accesos.tblElevadores e ON e.idElevador=pae.idElevador WHERE pae.idPerfilAcceso=pa.idPerfilAcceso AND pae.estadoPerfilAccesoElevador=1 AND e.estadoElevador=1) AS elevadoresAutorizados FROM DbSigaUNAH.Accesos.tblPerfilesAcceso pa WHERE pa.estadoPerfilAcceso=1 ORDER BY pa.nombrePerfilAcceso`),
    pool.request().query(`SELECT e.idElevador,e.codigoElevador,e.nombreElevador,b.nombreEdificio FROM DbSigaUNAH.Accesos.tblElevadores e INNER JOIN DbSigaUNAH.Accesos.tblEdificios b ON b.idEdificio=e.idEdificio WHERE e.estadoElevador=1 ORDER BY b.nombreEdificio,e.nombreElevador`)
  ]);
  return { perfilesAcceso: profiles.recordset, elevadores: elevators.recordset };
}

export async function assignmentOptions() {
  const pool = await getDatabasePool();
  const [vigencias, states] = await Promise.all([
    pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_VIGENCIA' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor`),
    pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_ASIGNACION' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor`)
  ]);
  return { tiposVigencia: vigencias.recordset, estadosAsignacion: states.recordset };
}

export async function validRequests(idBeneficiario: bigint) {
  const pool = await getDatabasePool();
  return (await pool.request().input("beneficiary", sql.BigInt, idBeneficiario).query(`SELECT s.idSolicitud,s.codigoSolicitud,s.idBeneficiario,s.fechaInicioSolicitada,s.fechaFinSolicitada,tv.nombreTipoValor AS nombreTipoVigencia,es.nombreTipoValor AS nombreEstadoSolicitud FROM DbSigaUNAH.Solicitudes.tblSolicitudes s INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=s.idTipoVigencia INNER JOIN DbSigaUNAH.Tipos.tblTiposValores es ON es.idTipoValor=s.idEstadoSolicitud WHERE s.idBeneficiario=@beneficiary AND s.estadoSolicitud=1 ORDER BY s.fechaRegistro DESC`)).recordset;
}

export function buildHistoryPageQuery() {
  return `SELECT * FROM (SELECT ${assignmentColumns},a.fechaRegistro AS fechaOperacion,a.usuarioRegistro AS usuarioResponsable,ROW_NUMBER() OVER (ORDER BY a.fechaRegistro DESC,a.idAsignacion DESC) AS numeroFila ${assignmentFrom} WHERE a.idTarjeta=@card) historial WHERE numeroFila>@offset AND numeroFila<=@pageEnd ORDER BY numeroFila`;
}

export async function history(idTarjeta: bigint, query: HistoryQuery) {
  try {
    const pool = await getDatabasePool();
    const offset = (query.page - 1) * query.pageSize;
    const request = pool.request().input("card", sql.BigInt, idTarjeta).input("offset", sql.Int, offset).input("pageEnd", sql.Int, offset + query.pageSize);
    const countRequest = pool.request().input("card", sql.BigInt, idTarjeta);
    const data = await request.query(buildHistoryPageQuery());
    const total = await countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${assignmentFrom} WHERE a.idTarjeta=@card`);
    return { items: data.recordset, total: total.recordset[0]?.total ?? 0 };
  } catch (error) {
    return mapSqlError(error);
  }
}

async function currentAssignment(request: sql.Request, id: bigint) {
  const result = await request.input("assignment", sql.BigInt, id).query(`SELECT ${assignmentColumns} ${assignmentFrom} WHERE a.idAsignacion=@assignment`);
  if (!result.recordset[0]) throw new HttpError(404, "Asignación no encontrada");
  return result.recordset[0] as Record<string, unknown>;
}

export async function assign(data: AssignmentInput, actor: AuthContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction);
    const beneficiary = await request.input("beneficiary", sql.BigInt, data.idBeneficiario).query(`SELECT idBeneficiario FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios WITH (UPDLOCK,HOLDLOCK) WHERE idBeneficiario=@beneficiary AND estadoBeneficiario=1`);
    if (!beneficiary.recordset.length) throw new HttpError(400, "El beneficiario no existe o está inactivo");
    const application = await new sql.Request(transaction).input("application", sql.BigInt, data.idSolicitud).input("beneficiary", sql.BigInt, data.idBeneficiario).query(`SELECT idSolicitud FROM DbSigaUNAH.Solicitudes.tblSolicitudes WHERE idSolicitud=@application AND idBeneficiario=@beneficiary AND estadoSolicitud=1`);
    if (!application.recordset.length) throw new HttpError(400, "La solicitud no existe, está inactiva o no corresponde al beneficiario");
    const card = await new sql.Request(transaction).input("card", sql.BigInt, data.idTarjeta).query(`SELECT idTarjeta FROM DbSigaUNAH.Tarjetas.tblTarjetas WITH (UPDLOCK,HOLDLOCK) WHERE idTarjeta=@card AND estadoTarjeta=1`);
    if (!card.recordset.length) throw new HttpError(400, "La tarjeta no existe o está inactiva");
    const occupied = await new sql.Request(transaction).input("card", sql.BigInt, data.idTarjeta).query(`SELECT TOP(1) idAsignacion FROM DbSigaUNAH.Tarjetas.tblAsignaciones WITH (UPDLOCK,HOLDLOCK) WHERE idTarjeta=@card AND esAsignacionVigente=1`);
    if (occupied.recordset.length) throw new HttpError(409, "La tarjeta ya tiene una asignación vigente");
    if (data.fechaFinVigencia && data.fechaFinVigencia < data.fechaInicioVigencia) throw new HttpError(400, "La fecha final no puede ser anterior a la fecha inicial");
    const inserted = await new sql.Request(transaction).input("request", sql.BigInt, data.idSolicitud).input("beneficiary", sql.BigInt, data.idBeneficiario).input("card", sql.BigInt, data.idTarjeta).input("validity", sql.Int, data.idTipoVigencia).input("state", sql.Int, data.idEstadoAsignacion).input("assigned", sql.DateTime2, data.fechaAsignacion).input("start", sql.Date, data.fechaInicioVigencia).input("end", sql.Date, data.fechaFinVigencia ?? null).input("commitment", sql.NVarChar(50), data.numeroCompromiso ?? null).input("observation", sql.NVarChar(1000), data.observacionEntrega ?? null).input("user", sql.NVarChar(90), actor.nombreAcceso).query<{ idAsignacion: bigint }>(`INSERT INTO DbSigaUNAH.Tarjetas.tblAsignaciones(idSolicitud,idBeneficiario,idTarjeta,idTipoVigencia,idEstadoAsignacion,fechaAsignacion,fechaInicioVigencia,fechaFinVigencia,numeroCompromiso,observacionEntrega,esAsignacionVigente,usuarioRegistro) OUTPUT INSERTED.idAsignacion VALUES(@request,@beneficiary,@card,@validity,@state,@assigned,@start,@end,@commitment,@observation,1,@user)`);
    const id = inserted.recordset[0]?.idAsignacion; if (!id) throw new HttpError(500, "No fue posible crear la asignación");
    await new sql.Request(transaction).input("assignment", sql.BigInt, id).input("state", sql.Int, data.idEstadoAsignacion).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Tarjetas.tblAsignacionesEstados(idAsignacion,idEstadoAsignacionNuevo,idUsuarioResponsable,usuarioRegistro) VALUES(@assignment,@state,@userId,@user)`);
    if (data.idPerfilAcceso) await new sql.Request(transaction).input("assignment", sql.BigInt, id).input("profile", sql.Int, data.idPerfilAcceso).input("start", sql.Date, data.fechaInicioVigencia).input("end", sql.Date, data.fechaFinVigencia ?? null).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso(idAsignacion,idPerfilAcceso,fechaInicio,fechaFin,usuarioRegistro) VALUES(@assignment,@profile,@start,@end,@user)`);
    await audit(new sql.Request(transaction), actor, "tblAsignaciones", id, "ASIGNAR", null, data); await transaction.commit(); return findAssignment(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function returnAssignment(id: bigint, data: ReturnAssignment, actor: AuthContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try { await transaction.begin(); const before = await currentAssignment(new sql.Request(transaction), id); if (before.esAsignacionVigente !== true) throw new HttpError(409, "La asignación ya no está vigente"); const request = new sql.Request(transaction).input("id", sql.BigInt, id).input("state", sql.Int, data.idEstadoAsignacionNuevo).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso); await request.query(`UPDATE DbSigaUNAH.Tarjetas.tblAsignaciones SET esAsignacionVigente=0,fechaDevolucion=SYSDATETIME(),recibidaPor=@userId,idEstadoAsignacion=@state,usuarioActualizacion=@user,fechaActualizacion=SYSDATETIME() WHERE idAsignacion=@id`); await new sql.Request(transaction).input("id", sql.BigInt, id).input("oldState", sql.Int, before.idEstadoAsignacion as number).input("state", sql.Int, data.idEstadoAsignacionNuevo).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso).input("reason", sql.NVarChar(1000), data.motivoCambio).query(`INSERT INTO DbSigaUNAH.Tarjetas.tblAsignacionesEstados(idAsignacion,idEstadoAsignacionAnterior,idEstadoAsignacionNuevo,motivoCambio,idUsuarioResponsable,usuarioRegistro) VALUES(@id,@oldState,@state,@reason,@userId,@user)`); await audit(new sql.Request(transaction), actor, "tblAsignaciones", id, "DEVOLVER", before, { ...before, esAsignacionVigente: false, idEstadoAsignacion: data.idEstadoAsignacionNuevo }); await transaction.commit(); return findAssignment(id); } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function renewAssignment(id: bigint, data: RenewAssignment, actor: AuthContext) { const pool = await getDatabasePool(); const tx = new sql.Transaction(pool); try { await tx.begin(); const before = await currentAssignment(new sql.Request(tx), id); if (before.esAsignacionVigente !== true) throw new HttpError(409, "Solo se puede renovar una asignación vigente"); if (data.fechaFinVigencia && data.fechaFinVigencia < data.fechaInicioVigencia) throw new HttpError(400, "La fecha final no puede ser anterior a la fecha inicial"); await new sql.Request(tx).input("id", sql.BigInt, id).input("start", sql.Date, data.fechaInicioVigencia).input("end", sql.Date, data.fechaFinVigencia ?? null).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`UPDATE DbSigaUNAH.Tarjetas.tblAsignaciones SET fechaInicioVigencia=@start,fechaFinVigencia=@end,usuarioActualizacion=@user,fechaActualizacion=SYSDATETIME() WHERE idAsignacion=@id`); await new sql.Request(tx).input("id", sql.BigInt, id).input("start", sql.Date, data.fechaInicioVigencia).input("end", sql.Date, data.fechaFinVigencia ?? null).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`UPDATE ap SET fechaInicio=@start,fechaFin=@end,usuarioActualizacion=@user,fechaActualizacion=SYSDATETIME() FROM DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ap WHERE ap.idAsignacion=@id AND ap.estadoAsignacionPerfilAcceso=1`); await audit(new sql.Request(tx), actor, "tblAsignaciones", id, "RENOVAR", before, { ...before, fechaInicioVigencia: data.fechaInicioVigencia, fechaFinVigencia: data.fechaFinVigencia }); await tx.commit(); return findAssignment(id); } catch (error) { await tx.rollback().catch(() => undefined); return mapSqlError(error); } }

export async function replaceAssignment(id: bigint, data: ReplaceAssignment, actor: AuthContext) { const pool = await getDatabasePool(); const tx = new sql.Transaction(pool); try { await tx.begin(); const before = await currentAssignment(new sql.Request(tx), id); if (before.esAsignacionVigente !== true) throw new HttpError(409, "Solo se puede reemplazar una asignación vigente"); const card = await new sql.Request(tx).input("card", sql.BigInt, data.idTarjetaNueva).query(`SELECT idTarjeta FROM DbSigaUNAH.Tarjetas.tblTarjetas WITH (UPDLOCK,HOLDLOCK) WHERE idTarjeta=@card AND estadoTarjeta=1 AND NOT EXISTS(SELECT 1 FROM DbSigaUNAH.Tarjetas.tblAsignaciones a WHERE a.idTarjeta=@card AND a.esAsignacionVigente=1)`); if (!card.recordset.length) throw new HttpError(409, "La tarjeta nueva no está disponible"); const start = data.fechaInicioVigencia ?? before.fechaInicioVigencia; const end = data.fechaFinVigencia ?? before.fechaFinVigencia; await new sql.Request(tx).input("id", sql.BigInt, id).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`UPDATE DbSigaUNAH.Tarjetas.tblAsignaciones SET esAsignacionVigente=0,fechaDevolucion=SYSDATETIME(),recibidaPor=@userId,usuarioActualizacion=@user,fechaActualizacion=SYSDATETIME() WHERE idAsignacion=@id`); const inserted = await new sql.Request(tx).input("old", sql.BigInt, id).input("card", sql.BigInt, data.idTarjetaNueva).input("state", sql.Int, data.idEstadoAsignacion).input("start", sql.Date, start).input("end", sql.Date, end).input("user", sql.NVarChar(90), actor.nombreAcceso).query<{ idAsignacion: bigint }>(`INSERT INTO DbSigaUNAH.Tarjetas.tblAsignaciones(idSolicitud,idBeneficiario,idTarjeta,idTipoVigencia,idEstadoAsignacion,fechaAsignacion,fechaInicioVigencia,fechaFinVigencia,numeroCompromiso,observacionEntrega,esAsignacionVigente,usuarioRegistro) SELECT idSolicitud,idBeneficiario,@card,idTipoVigencia,@state,SYSDATETIME(),@start,@end,numeroCompromiso,observacionEntrega,1,@user FROM DbSigaUNAH.Tarjetas.tblAsignaciones WHERE idAsignacion=@old OUTPUT INSERTED.idAsignacion`); const newId = inserted.recordset[0]?.idAsignacion; if (!newId) throw new HttpError(500, "No fue posible crear la asignación de reemplazo"); await new sql.Request(tx).input("old", sql.BigInt, id).input("new", sql.BigInt, newId).input("reason", sql.NVarChar(1000), data.motivoReemplazo).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Tarjetas.tblTarjetasReemplazos(idTarjetaAnterior,idTarjetaNueva,idAsignacion,motivoReemplazo,fechaReemplazo,idUsuarioResponsable,usuarioRegistro) SELECT idTarjeta,@new,@old,@reason,SYSDATETIME(),@userId,@user FROM DbSigaUNAH.Tarjetas.tblAsignaciones WHERE idAsignacion=@old`); await audit(new sql.Request(tx), actor, "tblTarjetasReemplazos", newId, "REEMPLAZAR", before, { idAsignacion: newId, idTarjetaNueva: data.idTarjetaNueva, motivoReemplazo: data.motivoReemplazo }); await tx.commit(); return findAssignment(newId); } catch (error) { await tx.rollback().catch(() => undefined); return mapSqlError(error); } }

async function findAssignment(id: bigint) { const pool = await getDatabasePool(); const result = await pool.request().input("id", sql.BigInt, id).query(`SELECT ${assignmentColumns} ${assignmentFrom} WHERE a.idAsignacion=@id`); return result.recordset[0] ?? null; }
