import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { Create, Query, State, Update } from "./solicitudes.types.js";
import type { AuthContext } from "../auth/auth-context.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";

const columns = `
  s.idSolicitud, s.codigoSolicitud, s.idBeneficiario, s.idPeriodoAcademico, s.idTipoSolicitud,
  s.idTipoVigencia, s.idEstadoSolicitud, s.fechaSolicitud, s.fechaInicioSolicitada,
  s.fechaFinSolicitada, s.motivoSolicitud, s.origenSolicitud, s.fechaResolucion,
  s.idUsuarioResolucion, u.nombreUsuario AS nombreUsuarioResolucion, s.observacionResolucion, s.estadoSolicitud, s.usuarioRegistro, s.fechaRegistro,
  s.usuarioActualizacion, s.fechaActualizacion,
  CONCAT(p.primerNombre, ' ', p.primerApellido) AS nombreBeneficiario,
  p.numeroIdentificacion, b.numeroCuenta, ts.codigoTipoSolicitud, ts.nombreTipoSolicitud,
  tv.nombreTipoValor AS nombreTipoVigencia, es.codigoTipoValor AS codigoEstadoSolicitud, es.nombreTipoValor AS nombreEstadoSolicitud,
  pa.codigoPeriodoAcademico, pa.nombrePeriodoAcademico,
  va.idAsignacion AS idAsignacionVigente, va.idTarjeta AS idTarjetaVigente,
  tar.codigoTarjeta AS codigoTarjetaVigente
`;
const from = `
  FROM DbSigaUNAH.Solicitudes.tblSolicitudes s
  INNER JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario = s.idBeneficiario
  INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona = b.idPersona
  LEFT JOIN DbSigaUNAH.Solicitudes.tblTiposSolicitudes ts ON ts.idTipoSolicitud = s.idTipoSolicitud
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor = s.idTipoVigencia
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores es ON es.idTipoValor = s.idEstadoSolicitud
  LEFT JOIN DbSigaUNAH.Academico.tblPeriodosAcademicos pa ON pa.idPeriodoAcademico = s.idPeriodoAcademico
  LEFT JOIN Seguridad.tblUsuarios u ON u.idUsuario = s.idUsuarioResolucion
  OUTER APPLY (SELECT TOP (1) a.idAsignacion, a.idTarjeta FROM DbSigaUNAH.Tarjetas.tblAsignaciones a WHERE a.idSolicitud = s.idSolicitud AND a.esAsignacionVigente = 1 ORDER BY a.idAsignacion DESC) va
  LEFT JOIN DbSigaUNAH.Tarjetas.tblTarjetas tar ON tar.idTarjeta = va.idTarjeta
`;
const sortColumns = { idSolicitud: "s.idSolicitud", codigoSolicitud: "s.codigoSolicitud", beneficiario: "p.primerApellido", fechaSolicitud: "s.fechaSolicitud", estado: "es.nombreTipoValor", fechaRegistro: "s.fechaRegistro" } as const;

export async function list(query: Query) {
  const pool = await getDatabasePool();
  const request = pool.request().input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request();
  const conditions: string[] = [];
  if (query.search) { conditions.push("(s.codigoSolicitud LIKE @search OR p.primerNombre LIKE @search OR p.primerApellido LIKE @search OR b.numeroCuenta LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.idEstadoSolicitud) { conditions.push("s.idEstadoSolicitud = @idEstadoSolicitud"); request.input("idEstadoSolicitud", sql.Int, query.idEstadoSolicitud); countRequest.input("idEstadoSolicitud", sql.Int, query.idEstadoSolicitud); }
  if (query.idBeneficiario) { conditions.push("s.idBeneficiario = @idBeneficiario"); request.input("idBeneficiario", sql.BigInt, query.idBeneficiario); countRequest.input("idBeneficiario", sql.BigInt, query.idBeneficiario); }
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

async function validatePeriod(request: sql.Request, idPeriodoAcademico: number | null | undefined, existingId?: number | null) {
  if (idPeriodoAcademico == null || existingId === idPeriodoAcademico) return;
  const result = await request.input("period", sql.Int, idPeriodoAcademico).query(`SELECT idPeriodoAcademico FROM DbSigaUNAH.Academico.tblPeriodosAcademicos WHERE idPeriodoAcademico=@period AND estadoPeriodoAcademico=1`);
  if (!result.recordset.length) throw new HttpError(400, "El período académico no existe o no está habilitado para nuevas solicitudes");
}

async function audit(request: sql.Request, actor: AuthContext, id: bigint, action: string, before: unknown, after: unknown) {
  await request.input("auditUser", sql.BigInt, actor.idUsuario).input("auditModule", sql.NVarChar(80), "SOLICITUDES").input("auditEntity", sql.NVarChar(150), "tblSolicitudes").input("auditId", sql.NVarChar(100), String(id)).input("auditAction", sql.NVarChar(30), action).input("auditBefore", sql.NVarChar(sql.MAX), stringifyJsonSafe(before)).input("auditAfter", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("auditRegistration", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Auditoria.tblBitacoras(idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,usuarioRegistro) VALUES(@auditUser,@auditModule,@auditEntity,@auditId,@auditAction,@auditBefore,@auditAfter,@auditRegistration)`);
}

export async function create(data: Create, actor: AuthContext) {
  const pool = await getDatabasePool();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();
      await validatePeriod(new sql.Request(transaction), data.idPeriodoAcademico);
      const pending = await new sql.Request(transaction).query(`SELECT tv.idTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_SOLICITUD' AND tv.codigoTipoValor='PENDIENTE' AND t.estadoTipo=1 AND tv.estadoTipoValor=1`);
      const pendingId = pending.recordset[0]?.idTipoValor;
      if (!pendingId) throw new HttpError(500, "El catálogo ESTADO_SOLICITUD no contiene el estado PENDIENTE activo");
      const sequence = await new sql.Request(transaction).query<{ value: string; year: number }>("SELECT NEXT VALUE FOR DbSigaUNAH.Solicitudes.seqCodigoSolicitud AS value, YEAR(SYSDATETIME()) AS year");
      const sequenceRow = sequence.recordset[0];
      if (!sequenceRow) throw new HttpError(500, "No fue posible obtener el consecutivo de solicitud");
      const sequenceValue = BigInt(sequenceRow.value);
      const suffix = sequenceValue < 1000000n ? sequenceValue.toString().padStart(6, "0") : sequenceValue.toString();
      const codigoSolicitud = `SOL-${sequenceRow.year}-${suffix}`;
      const existing = await new sql.Request(transaction).input("codigo", sql.NVarChar(30), codigoSolicitud).query("SELECT TOP 1 idSolicitud FROM DbSigaUNAH.Solicitudes.tblSolicitudes WHERE codigoSolicitud=@codigo");
      if (existing.recordset.length) { await transaction.rollback(); continue; }
      const result = await new sql.Request(transaction)
        .input("codigoSolicitud", sql.NVarChar(30), codigoSolicitud).input("idBeneficiario", sql.BigInt, data.idBeneficiario)
        .input("idPeriodoAcademico", sql.Int, data.idPeriodoAcademico ?? null).input("idTipoSolicitud", sql.Int, data.idTipoSolicitud ?? null)
         .input("idTipoVigencia", sql.Int, data.idTipoVigencia).input("idEstadoSolicitud", sql.Int, pendingId)
        .input("fechaInicio", sql.Date, data.fechaInicioSolicitada ?? null).input("fechaFin", sql.Date, data.fechaFinSolicitada ?? null)
        .input("motivo", sql.NVarChar(1500), data.motivoSolicitud ?? null).input("origen", sql.NVarChar(30), data.origenSolicitud).input("usuario", sql.NVarChar(90), actor.nombreAcceso)
        .query(`INSERT INTO DbSigaUNAH.Solicitudes.tblSolicitudes (codigoSolicitud,idBeneficiario,idPeriodoAcademico,idTipoSolicitud,idTipoVigencia,idEstadoSolicitud,fechaInicioSolicitada,fechaFinSolicitada,motivoSolicitud,origenSolicitud,usuarioRegistro) OUTPUT INSERTED.idSolicitud VALUES (@codigoSolicitud,@idBeneficiario,@idPeriodoAcademico,@idTipoSolicitud,@idTipoVigencia,@idEstadoSolicitud,@fechaInicio,@fechaFin,@motivo,@origen,@usuario)`);
      const inserted = result.recordset[0];
      if (!inserted) throw new HttpError(500, "No fue posible registrar la solicitud");
      const id = BigInt(inserted.idSolicitud);
      await audit(new sql.Request(transaction), actor, id, "CREAR", null, { ...data, codigoSolicitud, idEstadoSolicitud: pendingId, codigoEstadoSolicitud: "PENDIENTE" });
      await transaction.commit();
      return find(id);
    } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
  }
  throw new HttpError(500, "No fue posible generar un número único de solicitud");
}

export async function update(id: bigint, data: Update) {
  try {
    const pool = await getDatabasePool();
    const existing = await pool.request().input("id", sql.BigInt, id).query<{ idPeriodoAcademico: number | null }>("SELECT idPeriodoAcademico FROM DbSigaUNAH.Solicitudes.tblSolicitudes WHERE idSolicitud=@id");
    await validatePeriod(pool.request(), data.idPeriodoAcademico, existing.recordset[0]?.idPeriodoAcademico);
    await pool.request().input("id", sql.BigInt, id).input("idBeneficiario", sql.BigInt, data.idBeneficiario).input("idPeriodoAcademico", sql.Int, data.idPeriodoAcademico ?? null).input("idTipoSolicitud", sql.Int, data.idTipoSolicitud ?? null).input("idTipoVigencia", sql.Int, data.idTipoVigencia).input("fechaInicio", sql.Date, data.fechaInicioSolicitada ?? null).input("fechaFin", sql.Date, data.fechaFinSolicitada ?? null).input("motivo", sql.NVarChar(1500), data.motivoSolicitud ?? null).input("origen", sql.NVarChar(30), data.origenSolicitud).input("usuario", sql.NVarChar(90), data.usuarioActualizacion).query(`UPDATE DbSigaUNAH.Solicitudes.tblSolicitudes SET idBeneficiario=@idBeneficiario,idPeriodoAcademico=@idPeriodoAcademico,idTipoSolicitud=@idTipoSolicitud,idTipoVigencia=@idTipoVigencia,fechaInicioSolicitada=@fechaInicio,fechaFinSolicitada=@fechaFin,motivoSolicitud=@motivo,origenSolicitud=@origen,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idSolicitud=@id`);
    return find(id);
  } catch (error) { return mapSqlError(error); }
}

export async function state(id: bigint, data: State, actor: AuthContext) {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const current = await new sql.Request(transaction).input("id", sql.BigInt, id).query(`SELECT s.idEstadoSolicitud,tv.codigoTipoValor AS codigoEstadoSolicitud FROM DbSigaUNAH.Solicitudes.tblSolicitudes s WITH (UPDLOCK,HOLDLOCK) INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=s.idEstadoSolicitud WHERE s.idSolicitud=@id`);
    if (!current.recordset[0]) { await transaction.rollback(); return null; }
    if (current.recordset[0].codigoEstadoSolicitud !== "PENDIENTE" || !["APROBADA", "RECHAZADA"].includes(data.codigoEstadoSolicitudNuevo.toUpperCase())) throw new HttpError(409, "Solo una solicitud PENDIENTE puede aprobarse o rechazarse");
    const target = await new sql.Request(transaction).input("code", sql.NVarChar(100), data.codigoEstadoSolicitudNuevo.toUpperCase()).query(`SELECT tv.idTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='ESTADO_SOLICITUD' AND tv.codigoTipoValor=@code AND t.estadoTipo=1 AND tv.estadoTipoValor=1`);
    const targetId = target.recordset[0]?.idTipoValor;
    if (!targetId) throw new HttpError(400, "El estado solicitado no existe o está inactivo");
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("state", sql.Int, targetId).input("user", sql.NVarChar(90), actor.nombreAcceso).input("actorId", sql.BigInt, actor.idUsuario).input("reason", sql.NVarChar(1000), data.motivoCambio ?? null).query("UPDATE DbSigaUNAH.Solicitudes.tblSolicitudes SET idEstadoSolicitud=@state,fechaResolucion=sysdatetime(),idUsuarioResolucion=@actorId,observacionResolucion=@reason,usuarioActualizacion=@user,fechaActualizacion=sysdatetime() WHERE idSolicitud=@id");
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("previous", sql.Int, current.recordset[0].idEstadoSolicitud).input("next", sql.Int, targetId).input("reason", sql.NVarChar(1000), data.motivoCambio ?? null).input("userId", sql.BigInt, actor.idUsuario).input("user", sql.NVarChar(90), actor.nombreAcceso).query("INSERT INTO DbSigaUNAH.Solicitudes.tblSolicitudesEstados (idSolicitud,idEstadoSolicitudAnterior,idEstadoSolicitudNuevo,motivoCambio,idUsuarioResponsable,usuarioRegistro) VALUES (@id,@previous,@next,@reason,@userId,@user)");
    await transaction.commit(); return find(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
