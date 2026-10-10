import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { Create, Query, State, Update } from "./beneficiarios.types.js";

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
