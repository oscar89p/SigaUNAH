import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import { HttpError } from "../../shared/errors/http-error.js";
import type { ConditionInput, ConditionQuery, Create, Query, SearchQuery, State, Update } from "./beneficiarios.types.js";
import type { AuthContext } from "../auth/auth-context.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";

const columns = `
  b.idBeneficiario, b.idPersona, b.idTipoBeneficiario, b.idCarrera,
  b.numeroCuenta, b.correoInstitucional, b.codigoCarne, b.estadoAcademico,
  b.estadoBeneficiario, b.usuarioRegistro, b.fechaRegistro,
  b.usuarioActualizacion, b.fechaActualizacion,
  p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido,
  p.numeroIdentificacion, p.telefonoPrincipal, p.correoPersonal, p.fechaNacimiento,
  tv.codigoTipoValor AS codigoTipoBeneficiario, tv.nombreTipoValor AS nombreTipoBeneficiario,
  c.codigoCarrera, c.nombreCarrera
`;

const sortColumns = {
  idBeneficiario: "b.idBeneficiario",
  primerApellido: "p.primerApellido",
  primerNombre: "p.primerNombre",
  numeroCuenta: "b.numeroCuenta",
  estadoBeneficiario: "b.estadoBeneficiario",
  fechaRegistro: "b.fechaRegistro"
} as const;

const from = `
  FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b
  INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona = b.idPersona
  INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor = b.idTipoBeneficiario
  LEFT JOIN DbSigaUNAH.Academico.tblCarreras c ON c.idCarrera = b.idCarrera
`;

export async function list(query: Query) {
  const pool = await getDatabasePool();
  const request = pool.request().input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request();
  const where = query.search ? "WHERE p.primerNombre LIKE @search OR p.primerApellido LIKE @search OR b.numeroCuenta LIKE @search OR b.codigoCarne LIKE @search" : "";
  if (query.search) {
    request.input("search", sql.NVarChar(150), `%${query.search}%`);
    countRequest.input("search", sql.NVarChar(150), `%${query.search}%`);
  }
  const direction = query.sortDirection === "desc" ? "DESC" : "ASC";
  const data = await request.query(`SELECT ${columns} ${from} ${where} ORDER BY ${sortColumns[query.sortBy]} ${direction} OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);
  const total = await countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`);
  return { items: data.recordset, total: total.recordset[0]?.total ?? 0 };
}

export async function search(query: SearchQuery) {
  const pool = await getDatabasePool();
  const request = pool.request().input("search", sql.NVarChar(150), `%${query.search}%`).input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request().input("search", sql.NVarChar(150), `%${query.search}%`);
  const where = "WHERE b.estadoBeneficiario=1 AND (p.primerNombre LIKE @search OR p.segundoNombre LIKE @search OR p.primerApellido LIKE @search OR p.segundoApellido LIKE @search OR p.numeroIdentificacion LIKE @search OR b.codigoCarne LIKE @search OR b.numeroCuenta LIKE @search)";
  const fields = `b.idBeneficiario, CONCAT_WS(' ', p.primerNombre,p.segundoNombre,p.primerApellido,p.segundoApellido) AS nombreCompleto, CASE WHEN p.numeroIdentificacion IS NULL THEN NULL ELSE CONCAT(REPLICATE('*', CASE WHEN LEN(p.numeroIdentificacion)>4 THEN LEN(p.numeroIdentificacion)-4 ELSE 0 END), RIGHT(p.numeroIdentificacion,4)) END AS identificacionEnmascarada, b.codigoCarne AS codigoBeneficiario, b.estadoBeneficiario, CASE WHEN b.numeroCuenta IS NULL THEN NULL ELSE CONCAT(REPLICATE('*', CASE WHEN LEN(b.numeroCuenta)>4 THEN LEN(b.numeroCuenta)-4 ELSE 0 END), RIGHT(b.numeroCuenta,4)) END AS cuentaEnmascarada`;
  const fromSearch = `FROM DbSigaUNAH.Beneficiarios.tblBeneficiarios b INNER JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona`;
  const data = await request.query(`SELECT ${fields} ${fromSearch} ${where} ORDER BY p.primerApellido,p.primerNombre,b.idBeneficiario OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);
  const total = await countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${fromSearch} ${where}`);
  return { items: data.recordset, total: total.recordset[0]?.total ?? 0 };
}

export async function find(id: bigint) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("id", sql.BigInt, id).query(`SELECT ${columns} ${from} WHERE b.idBeneficiario = @id`);
  return result.recordset[0] ?? null;
}

export async function options() {
  const pool = await getDatabasePool();
  const [types, careers] = await Promise.all([
    pool.request().query(`SELECT tv.idTipoValor, tv.codigoTipoValor, tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo = tv.idTipo WHERE t.codigoTipo = 'TIPO_BENEFICIARIO' AND t.estadoTipo = 1 AND tv.estadoTipoValor = 1 ORDER BY tv.nombreTipoValor`),
    pool.request().query(`SELECT idCarrera, codigoCarrera, nombreCarrera FROM DbSigaUNAH.Academico.tblCarreras WHERE estadoCarrera = 1 ORDER BY nombreCarrera`)
  ]);
  return { tiposBeneficiario: types.recordset, carreras: careers.recordset };
}

async function insertPerson(transaction: sql.Transaction, data: Create["person"], username: string) {
  const result = await new sql.Request(transaction)
    .input("primerNombre", sql.NVarChar(80), data.primerNombre)
    .input("segundoNombre", sql.NVarChar(80), data.segundoNombre ?? null)
    .input("primerApellido", sql.NVarChar(80), data.primerApellido)
    .input("segundoApellido", sql.NVarChar(80), data.segundoApellido ?? null)
    .input("numeroIdentificacion", sql.NVarChar(30), data.numeroIdentificacion ?? null)
    .input("telefonoPrincipal", sql.NVarChar(30), data.telefonoPrincipal ?? null)
    .input("correoPersonal", sql.NVarChar(150), data.correoPersonal ?? null)
    .input("fechaNacimiento", sql.Date, data.fechaNacimiento ?? null)
    .input("usuarioRegistro", sql.NVarChar(90), username)
    .query(`
      INSERT INTO DbSigaUNAH.Beneficiarios.tblPersonas
        (primerNombre, segundoNombre, primerApellido, segundoApellido, numeroIdentificacion, telefonoPrincipal, correoPersonal, fechaNacimiento, usuarioRegistro)
      OUTPUT INSERTED.idPersona
      VALUES (@primerNombre, @segundoNombre, @primerApellido, @segundoApellido, @numeroIdentificacion, @telefonoPrincipal, @correoPersonal, @fechaNacimiento, @usuarioRegistro)
    `);
  return result.recordset[0].idPersona as bigint;
}

export async function create(data: Create) {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const idPersona = await insertPerson(transaction, data.person, data.usuarioRegistro);
    const result = await new sql.Request(transaction)
      .input("idPersona", sql.BigInt, idPersona)
      .input("idTipoBeneficiario", sql.Int, data.beneficiary.idTipoBeneficiario)
      .input("idCarrera", sql.Int, data.beneficiary.idCarrera ?? null)
      .input("numeroCuenta", sql.NVarChar(20), data.beneficiary.numeroCuenta ?? null)
      .input("correoInstitucional", sql.NVarChar(150), data.beneficiary.correoInstitucional ?? null)
      .input("codigoCarne", sql.NVarChar(50), data.beneficiary.codigoCarne ?? null)
      .input("estadoAcademico", sql.NVarChar(30), data.beneficiary.estadoAcademico ?? null)
      .input("usuarioRegistro", sql.NVarChar(90), data.usuarioRegistro)
      .query(`
        INSERT INTO DbSigaUNAH.Beneficiarios.tblBeneficiarios
          (idPersona, idTipoBeneficiario, idCarrera, numeroCuenta, correoInstitucional, codigoCarne, estadoAcademico, usuarioRegistro)
        OUTPUT INSERTED.idBeneficiario
        VALUES (@idPersona, @idTipoBeneficiario, @idCarrera, @numeroCuenta, @correoInstitucional, @codigoCarne, @estadoAcademico, @usuarioRegistro)
      `);
    await transaction.commit();
    return find(BigInt(result.recordset[0].idBeneficiario));
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    return mapSqlError(error);
  }
}

export async function update(id: bigint, data: Update) {
  const current = await find(id);
  if (!current) return null;
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    await new sql.Request(transaction)
      .input("idPersona", sql.BigInt, current.idPersona)
      .input("primerNombre", sql.NVarChar(80), data.person.primerNombre)
      .input("segundoNombre", sql.NVarChar(80), data.person.segundoNombre ?? null)
      .input("primerApellido", sql.NVarChar(80), data.person.primerApellido)
      .input("segundoApellido", sql.NVarChar(80), data.person.segundoApellido ?? null)
      .input("numeroIdentificacion", sql.NVarChar(30), data.person.numeroIdentificacion ?? null)
      .input("telefonoPrincipal", sql.NVarChar(30), data.person.telefonoPrincipal ?? null)
      .input("correoPersonal", sql.NVarChar(150), data.person.correoPersonal ?? null)
      .input("fechaNacimiento", sql.Date, data.person.fechaNacimiento ?? null)
      .input("usuario", sql.NVarChar(90), data.usuarioActualizacion)
      .query(`UPDATE DbSigaUNAH.Beneficiarios.tblPersonas SET primerNombre=@primerNombre,segundoNombre=@segundoNombre,primerApellido=@primerApellido,segundoApellido=@segundoApellido,numeroIdentificacion=@numeroIdentificacion,telefonoPrincipal=@telefonoPrincipal,correoPersonal=@correoPersonal,fechaNacimiento=@fechaNacimiento,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idPersona=@idPersona`);
    await new sql.Request(transaction)
      .input("id", sql.BigInt, id)
      .input("idTipoBeneficiario", sql.Int, data.beneficiary.idTipoBeneficiario)
      .input("idCarrera", sql.Int, data.beneficiary.idCarrera ?? null)
      .input("numeroCuenta", sql.NVarChar(20), data.beneficiary.numeroCuenta ?? null)
      .input("correoInstitucional", sql.NVarChar(150), data.beneficiary.correoInstitucional ?? null)
      .input("codigoCarne", sql.NVarChar(50), data.beneficiary.codigoCarne ?? null)
      .input("estadoAcademico", sql.NVarChar(30), data.beneficiary.estadoAcademico ?? null)
      .input("usuario", sql.NVarChar(90), data.usuarioActualizacion)
      .query(`UPDATE DbSigaUNAH.Beneficiarios.tblBeneficiarios SET idTipoBeneficiario=@idTipoBeneficiario,idCarrera=@idCarrera,numeroCuenta=@numeroCuenta,correoInstitucional=@correoInstitucional,codigoCarne=@codigoCarne,estadoAcademico=@estadoAcademico,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idBeneficiario=@id`);
    await transaction.commit();
    return find(id);
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    return mapSqlError(error);
  }
}

export async function state(id: bigint, data: State) {
  try {
    const pool = await getDatabasePool();
    await pool.request().input("id", sql.BigInt, id).input("estado", sql.Bit, data.estadoBeneficiario).input("usuario", sql.NVarChar(90), data.usuarioActualizacion).query(`UPDATE DbSigaUNAH.Beneficiarios.tblBeneficiarios SET estadoBeneficiario=@estado,usuarioActualizacion=@usuario,fechaActualizacion=sysdatetime() WHERE idBeneficiario=@id`);
    return find(id);
  } catch (error) {
    return mapSqlError(error);
  }
}

export async function conditionOptions() { const pool = await getDatabasePool(); return (await pool.request().query(`SELECT tv.idTipoValor,tv.codigoTipoValor,tv.nombreTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE t.codigoTipo='TIPO_CONDICION' AND t.estadoTipo=1 AND tv.estadoTipoValor=1 ORDER BY tv.ordenTipoValor,tv.nombreTipoValor`)).recordset; }
const conditionSelect = `c.idBeneficiarioCondicion,c.idBeneficiario,c.idTipoCondicion,tv.codigoTipoValor AS codigoTipoCondicion,tv.nombreTipoValor AS nombreTipoCondicion,c.descripcionCondicion,c.esTemporal,c.fechaInicio,c.fechaFinEstimada,c.requiereRevision,c.estadoBeneficiarioCondicion,c.fechaRegistro,c.fechaActualizacion`;
export async function listConditions(idBeneficiario: bigint, query: ConditionQuery) { const pool = await getDatabasePool(); const request = pool.request().input("beneficiary", sql.BigInt, idBeneficiario).input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize); const countRequest = pool.request().input("beneficiary", sql.BigInt, idBeneficiario); const predicates = ["c.idBeneficiario=@beneficiary"]; if (query.estado !== "all") { predicates.push("c.estadoBeneficiarioCondicion=@state"); request.input("state", sql.Bit, query.estado === "active"); countRequest.input("state", sql.Bit, query.estado === "active"); } if (query.search) { predicates.push("(tv.codigoTipoValor LIKE @search OR tv.nombreTipoValor LIKE @search OR c.descripcionCondicion LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); } const where = `WHERE ${predicates.join(" AND ")}`; const from = `FROM DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones c INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=c.idTipoCondicion`; const [data,total] = await Promise.all([request.query(`SELECT ${conditionSelect} ${from} ${where} ORDER BY c.fechaRegistro DESC,c.idBeneficiarioCondicion DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`), countRequest.query<{total:number}>(`SELECT COUNT(1) AS total ${from} ${where}`)]); return { items: data.recordset, total: total.recordset[0]?.total ?? 0 }; }
async function conditionBefore(request: sql.Request, beneficiary: bigint, condition: bigint) { const result = await request.input("beneficiary", sql.BigInt, beneficiary).input("condition", sql.BigInt, condition).query(`SELECT ${conditionSelect} FROM DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones c INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=c.idTipoCondicion WHERE c.idBeneficiario=@beneficiary AND c.idBeneficiarioCondicion=@condition`); if (!result.recordset[0]) throw new HttpError(404, "Condición no encontrada para este beneficiario"); return result.recordset[0]; }
async function conditionAudit(request: sql.Request, actor: AuthContext, id: bigint, action: string, before: unknown, after: unknown) { await request.input("userId", sql.BigInt, actor.idUsuario).input("module", sql.NVarChar(80), "BENEFICIARIOS").input("entity", sql.NVarChar(150), "tblBeneficiariosCondiciones").input("recordId", sql.NVarChar(100), String(id)).input("action", sql.NVarChar(30), action).input("before", sql.NVarChar(sql.MAX), stringifyJsonSafe(before)).input("after", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("registration", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Auditoria.tblBitacoras(idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,usuarioRegistro) VALUES(@userId,@module,@entity,@recordId,@action,@before,@after,@registration)`); }
export async function createCondition(idBeneficiario: bigint, data: ConditionInput, actor: AuthContext) { const pool = await getDatabasePool(); const tx = new sql.Transaction(pool); try { await tx.begin(); const type = await new sql.Request(tx).input("type", sql.Int, data.idTipoCondicion).query(`SELECT tv.idTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE tv.idTipoValor=@type AND t.codigoTipo='TIPO_CONDICION' AND tv.estadoTipoValor=1`); if (!type.recordset.length) throw new HttpError(400, "El tipo de condición no existe o está inactivo"); const result = await new sql.Request(tx).input("beneficiary", sql.BigInt, idBeneficiario).input("type", sql.Int, data.idTipoCondicion).input("description", sql.NVarChar(1000), data.descripcionCondicion ?? null).input("temporary", sql.Bit, data.esTemporal).input("start", sql.Date, data.fechaInicio ?? null).input("end", sql.Date, data.fechaFinEstimada ?? null).input("review", sql.Bit, data.requiereRevision).input("actor", sql.NVarChar(90), actor.nombreAcceso).query(`INSERT INTO DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones(idBeneficiario,idTipoCondicion,descripcionCondicion,esTemporal,fechaInicio,fechaFinEstimada,requiereRevision,usuarioRegistro) OUTPUT INSERTED.idBeneficiarioCondicion VALUES(@beneficiary,@type,@description,@temporary,@start,@end,@review,@actor)`); const id = result.recordset[0]?.idBeneficiarioCondicion; if (!id) throw new HttpError(500, "No fue posible crear la condición"); await conditionAudit(new sql.Request(tx), actor, id, "CREAR", null, data); await tx.commit(); return conditionBefore(await getDatabasePool().then(p=>p.request()), idBeneficiario, id); } catch (error) { await tx.rollback().catch(()=>undefined); return mapSqlError(error); } }
export async function updateCondition(idBeneficiario: bigint, idCondicion: bigint, data: ConditionInput, actor: AuthContext) { const pool = await getDatabasePool(); const tx = new sql.Transaction(pool); try { await tx.begin(); const before = await conditionBefore(new sql.Request(tx), idBeneficiario, idCondicion); const type = await new sql.Request(tx).input("type", sql.Int, data.idTipoCondicion).query(`SELECT tv.idTipoValor FROM DbSigaUNAH.Tipos.tblTiposValores tv INNER JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=tv.idTipo WHERE tv.idTipoValor=@type AND t.codigoTipo='TIPO_CONDICION' AND tv.estadoTipoValor=1`); if (!type.recordset.length) throw new HttpError(400, "El tipo de condición no existe o está inactivo"); await new sql.Request(tx).input("id", sql.BigInt, idCondicion).input("type", sql.Int, data.idTipoCondicion).input("description", sql.NVarChar(1000), data.descripcionCondicion ?? null).input("temporary", sql.Bit, data.esTemporal).input("start", sql.Date, data.fechaInicio ?? null).input("end", sql.Date, data.fechaFinEstimada ?? null).input("review", sql.Bit, data.requiereRevision).input("actor", sql.NVarChar(90), actor.nombreAcceso).query(`UPDATE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones SET idTipoCondicion=@type,descripcionCondicion=@description,esTemporal=@temporary,fechaInicio=@start,fechaFinEstimada=@end,requiereRevision=@review,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idBeneficiarioCondicion=@id`); await conditionAudit(new sql.Request(tx), actor, idCondicion, "ACTUALIZAR", before, data); await tx.commit(); return conditionBefore(await getDatabasePool().then(p=>p.request()), idBeneficiario, idCondicion); } catch (error) { await tx.rollback().catch(()=>undefined); return mapSqlError(error); } }
export async function setConditionState(idBeneficiario: bigint, idCondicion: bigint, state: boolean, actor: AuthContext) { const pool = await getDatabasePool(); const tx = new sql.Transaction(pool); try { await tx.begin(); const before = await conditionBefore(new sql.Request(tx), idBeneficiario, idCondicion); await new sql.Request(tx).input("id", sql.BigInt, idCondicion).input("state", sql.Bit, state).input("actor", sql.NVarChar(90), actor.nombreAcceso).query(`UPDATE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones SET estadoBeneficiarioCondicion=@state,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idBeneficiarioCondicion=@id`); await conditionAudit(new sql.Request(tx), actor, idCondicion, state ? "ACTIVAR" : "DESACTIVAR", before, { ...before, estadoBeneficiarioCondicion: state }); await tx.commit(); return { ...before, estadoBeneficiarioCondicion: state }; } catch (error) { await tx.rollback().catch(()=>undefined); return mapSqlError(error); } }
