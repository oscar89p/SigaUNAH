import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { Create, Query, State, Update } from "./solicitudes.types.js";

const columns = `
  s.idSolicitud, s.codigoSolicitud, s.idBeneficiario, s.idPeriodoAcademico, s.idTipoSolicitud,
  s.idTipoVigencia, s.idEstadoSolicitud, s.fechaSolicitud, s.fechaInicioSolicitada,
  s.fechaFinSolicitada, s.motivoSolicitud, s.origenSolicitud, s.fechaResolucion,
  s.observacionResolucion, s.estadoSolicitud, s.usuarioRegistro, s.fechaRegistro,
  s.usuarioActualizacion, s.fechaActualizacion,
  CONCAT(p.primerNombre, ' ', p.primerApellido) AS nombreBeneficiario,
  p.numeroIdentificacion, b.numeroCuenta, ts.codigoTipoSolicitud, ts.nombreTipoSolicitud,
  tv.nombreTipoValor AS nombreTipoVigencia, es.nombreTipoValor AS nombreEstadoSolicitud,
  pa.codigoPeriodoAcademico, pa.nombrePeriodoAcademico
`;
const from = `
  FROM DbSigaUNAH.Solicitudes.tblSolicitudes s
  INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario = s.idBeneficiario
  INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona = b.idPersona
  LEFT JOIN DbSigaUNAH.Solicitudes.tblTiposSolicitudes ts ON ts.idTipoSolicitud = s.idTipoSolicitud
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor = s.idTipoVigencia
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores es ON es.idTipoValor = s.idEstadoSolicitud
  LEFT JOIN DbSigaUNAH.Academico.tblPeriodosAcademicos pa ON pa.idPeriodoAcademico = s.idPeriodoAcademico
`;
const sortColumns = { idSolicitud: "s.idSolicitud", codigoSolicitud: "s.codigoSolicitud", beneficiario: "p.primerApellido", fechaSolicitud: "s.fechaSolicitud", estado: "es.nombreTipoValor", fechaRegistro: "s.fechaRegistro" } as const;

export async function list(query: Query) {
  const pool = await getDatabasePool();
  const request = pool.request().input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request();
  const conditions: string[] = [];
  if (query.search) { conditions.push("(s.codigoSolicitud LIKE @search OR p.primerNombre LIKE @search OR p.primerApellido LIKE @search OR b.numeroCuenta LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.idEstadoSolicitud) { conditions.push("s.idEstadoSolicitud = @idEstadoSolicitud"); request.input("idEstadoSolicitud", sql.Int, query.idEstadoSolicitud); countRequest.input("idEstadoSolicitud", sql.Int, query.idEstadoSolicitud); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const direction = query.sortDirection === "desc" ? "DESC" : "ASC";
  const result = await request.query(`SELECT ${columns} ${from} ${where} ORDER BY ${sortColumns[query.sortBy]} ${direction} OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);
  const count = await countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`);
  return { items: result.recordset, total: count.recordset[0]?.total ?? 0 };
}

export async function find(id: bigint) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("id", sql.BigInt, id).query(`SELECT ${columns} ${from} WHERE s.idSolicitud = @id`);
  return result.recordset[0] ?? null;
}

export async function options() {
  const pool = await getDatabasePool();
  const [beneficiarios, tipos, vigencias, estados, periodos] = await Promise.all([
    pool.request().query(`SELECT b.idBeneficiario, CONCAT(p.primerNombre, ' ', p.primerApellido) AS nombreBeneficiario, b.numeroCuenta FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona WHERE b.estadoBeneficiario=1 AND p.estadoPersona=1 ORDER BY p.primerApellido,p.primerNombre`),
    pool.request().query(`SELECT idTipoSolicitud, codigoTipoSolicitud, nombreTipoSolicitud FROM DbSigaUNAH.Solicitudes.tblTiposSolicitudes WHERE estadoTipoSolicitud=1 ORDER BY nombreTipoSolicitud`),
    pool.request().query(`SELECT tv.idTipoValor, tv.codigoTipoValor, tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_VIGENCIA' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT tv.idTipoValor, tv.codigoTipoValor, tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_SOLICITUD' AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`),
    pool.request().query(`SELECT idPeriodoAcademico,codigoPeriodoAcademico,nombrePeriodoAcademico FROM DbSigaUNAH.Academico.tblPeriodosAcademicos WHERE estadoPeriodoAcademico=1 ORDER BY fechaInicioPeriodoAcademico DESC`)
  ]);
  return { beneficiarios: beneficiarios.recordset, tiposSolicitud: tipos.recordset, tiposVigencia: vigencias.recordset, estadosSolicitud: estados.recordset, periodos: periodos.recordset };
}

export async function create(data: Create) {
  try {
    const pool = await getDatabasePool();
    const result = await pool.request()
      .input("codigoSolicitud", sql.NVarChar(30), data.codigoSolicitud).input("idBeneficiario", sql.BigInt, data.idBeneficiario)
      .input("idPeriodoAcademico", sql.Int, data.idPeriodoAcademico ?? null).input("idTipoSolicitud", sql.Int, data.idTipoSolicitud ?? null)
      .input("idTipoVigencia", sql.Int, data.idTipoVigencia).input("idEstadoSolicitud", sql.Int, data.idEstadoSolicitud)
      .input("fechaInicio", sql.Date, data.fechaInicioSolicitada ?? null).input("fechaFin", sql.Date, data.fechaFinSolicitada ?? null)
      .input("motivo", sql.NVarChar(1500), data.motivoSolicitud ?? null).input("origen", sql.NVarChar(30), data.origenSolicitud).input("usuario", sql.NVarChar(90), data.usuarioRegistro)
      .query(`INSERT INTO DbSigaUNAH.Solicitudes.tblSolicitudes (codigoSolicitud,idBeneficiario,idPeriodoAcademico,idTipoSolicitud,idTipoVigencia,idEstadoSolicitud,fechaInicioSolicitada,fechaFinSolicitada,motivoSolicitud,origenSolicitud,usuarioRegistro) OUTPUT INSERTED.idSolicitud VALUES (@codigoSolicitud,@idBeneficiario,@idPeriodoAcademico,@idTipoSolicitud,@idTipoVigencia,@idEstadoSolicitud,@fechaInicio,@fechaFin,@motivo,@origen,@usuario)`);
    return find(BigInt(result.recordset[0].idSolicitud));
  } catch (error) { return mapSqlError(error); }
}

export async function update(id: bigint, data: Update) {
  try {
    const pool = await getDatabasePool();
    await pool.request().input("id", sql.BigInt, id).input("codigoSolicitud", sql.NVarChar(30), data.codigoSolicitud).input("idBeneficiario", sql.BigInt, data.idBeneficiario).input("idPeriodoAcademico", sql.Int, data.idPeriodoAcademico ?? null).input("idTipoSolicitud", sql.Int, data.idTipoSolicitud ?? null).input("idTipoVigencia", sql.Int, data.idTipoVigencia).input("fechaInicio", sql.Date, data.fechaInicioSolicitada ?? null).input("fechaFin", sql.Date, data.fechaFinSolicitada ?? null).input("motivo", sql.NVarChar(1500), data.motivoSolicitud ?? null).input("origen", sql.NVarChar(30), data.origenSolicitud).input("usuario", sql.NVarChar(90), data.usuarioActualizacion).query(`UPDATE DbSigaUNAH.Solicitudes.tblSolicitudes SET codigoSolicitud=@codigoSolicitud,idBeneficiario=@idBeneficiario,idPeriodoAcademico=@idPeriodoAcademico,idTipoSolicitud=@idTipoSolicitud,idTipoVigencia=@idTipoVigencia,fechaInicioSolicitada=@fechaInicio,fechaFinSolicitada=@fechaFin,motivoSolicitud=@motivo,origenSolicitud=@origen,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idSolicitud=@id`);
    return find(id);
  } catch (error) { return mapSqlError(error); }
}

export async function state(id: bigint, data: State) {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const current = await new sql.Request(transaction).input("id", sql.BigInt, id).query("SELECT idEstadoSolicitud FROM DbSigaUNAH.Solicitudes.tblSolicitudes WHERE idSolicitud=@id");
    if (!current.recordset[0]) { await transaction.rollback(); return null; }
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("state", sql.Int, data.idEstadoSolicitudNuevo).input("user", sql.NVarChar(90), data.usuarioActualizacion).query("UPDATE DbSigaUNAH.Solicitudes.tblSolicitudes SET idEstadoSolicitud=@state,fechaResolucion=CASE WHEN EXISTS (SELECT 1 FROM DbSigaUNAH.Tipos.tblTiposValores tv WHERE tv.idTipoValor=@state AND tv.codigoTipoValor IN ('APROBADA','RECHAZADA')) THEN sysdatetime() ELSE fechaResolucion END,usuarioActualizacion=@user,fechaActualizacion=sysdatetime() WHERE idSolicitud=@id");
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("previous", sql.Int, current.recordset[0].idEstadoSolicitud).input("next", sql.Int, data.idEstadoSolicitudNuevo).input("reason", sql.NVarChar(1000), data.motivoCambio ?? null).input("user", sql.NVarChar(90), data.usuarioRegistro).query("INSERT INTO DbSigaUNAH.Solicitudes.tblSolicitudesEstados (idSolicitud,idEstadoSolicitudAnterior,idEstadoSolicitudNuevo,motivoCambio,usuarioRegistro) VALUES (@id,@previous,@next,@reason,@user)");
    await transaction.commit(); return find(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
