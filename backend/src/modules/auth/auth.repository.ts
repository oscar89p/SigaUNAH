import sql from "mssql";

import { getDatabasePool } from "../../shared/database/pool.js";

export async function findUser(nombreAcceso: string) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("nombreAcceso", sql.NVarChar(90), nombreAcceso).query(`
    SELECT TOP (1) idUsuario, nombreUsuario, nombreAcceso, claveHash, tipoAutenticacion,
           intentosFallidos, fechaBloqueo, estadoUsuario
    FROM Seguridad.tblUsuarios WHERE nombreAcceso=@nombreAcceso`);
  return result.recordset[0] as {
    idUsuario: number; nombreUsuario: string; nombreAcceso: string; claveHash: string | null;
    tipoAutenticacion: string; intentosFallidos: number; fechaBloqueo: Date | null; estadoUsuario: boolean;
  } | undefined;
}

export async function loadAccess(idUsuario: number) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("idUsuario", sql.BigInt, idUsuario).query(`
    SELECT DISTINCT p.codigoPerfil, pe.codigoPermiso
    FROM Seguridad.tblUsuariosPerfiles up
    INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=up.idPerfil AND p.estadoPerfil=1
    INNER JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
    INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.estadoPermiso=1
    WHERE up.idUsuario=@idUsuario AND up.estadoUsuarioPerfil=1`);
  return result.recordset as { codigoPerfil: string; codigoPermiso: string }[];
}

export async function createSession(data: { idUsuario: number; identificadorSesion: string; inicio: Date; expiracion: Date; ip: string | undefined; agent: string | undefined }) {
  const pool = await getDatabasePool();
  await pool.request().input("idUsuario", sql.BigInt, data.idUsuario).input("identificadorSesion", sql.NVarChar(100), data.identificadorSesion)
    .input("inicio", sql.DateTime2, data.inicio).input("expiracion", sql.DateTime2, data.expiracion)
    .input("ip", sql.NVarChar(45), data.ip ?? null).input("agent", sql.NVarChar(500), data.agent ?? null)
    .input("usuarioRegistro", sql.NVarChar(90), "SISTEMA").query(`
      INSERT INTO Seguridad.tblSesionesUsuarios(idUsuario,identificadorSesion,fechaInicio,fechaExpiracion,direccionIp,agenteUsuario,usuarioRegistro)
      VALUES(@idUsuario,@identificadorSesion,@inicio,@expiracion,@ip,@agent,@usuarioRegistro)`);
}

export async function findSession(identifier: string) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("identifier", sql.NVarChar(100), identifier).query(`
    SELECT TOP (1) s.idSesionUsuario,s.idUsuario,s.fechaInicio,s.fechaExpiracion,u.nombreUsuario,u.nombreAcceso,u.estadoUsuario
    FROM Seguridad.tblSesionesUsuarios s INNER JOIN Seguridad.tblUsuarios u ON u.idUsuario=s.idUsuario
    WHERE s.identificadorSesion=@identifier AND s.estadoSesionUsuario=1 AND s.fechaCierre IS NULL`);
  return result.recordset[0] as { idSesionUsuario: number; idUsuario: number; fechaInicio: Date; fechaExpiracion: Date; nombreUsuario: string; nombreAcceso: string; estadoUsuario: boolean } | undefined;
}

export async function touchSession(idSesionUsuario: number, expiration: Date) {
  const pool = await getDatabasePool();
  await pool.request().input("idSesionUsuario", sql.BigInt, idSesionUsuario).input("expiration", sql.DateTime2, expiration)
    .input("usuarioActualizacion", sql.NVarChar(90), "SISTEMA").query(`UPDATE Seguridad.tblSesionesUsuarios SET fechaExpiracion=@expiration,fechaActualizacion=SYSDATETIME(),usuarioActualizacion=@usuarioActualizacion WHERE idSesionUsuario=@idSesionUsuario`);
}

export async function closeSession(identifier: string) {
  const pool = await getDatabasePool();
  await pool.request().input("identifier", sql.NVarChar(100), identifier).input("usuarioActualizacion", sql.NVarChar(90), "SISTEMA").query(`UPDATE Seguridad.tblSesionesUsuarios SET estadoSesionUsuario=0,fechaCierre=SYSDATETIME(),fechaActualizacion=SYSDATETIME(),usuarioActualizacion=@usuarioActualizacion WHERE identificadorSesion=@identifier AND estadoSesionUsuario=1`);
}

export async function recordAttempt(nombreAcceso: string, idUsuario: number | null, success: boolean, reason: string, ip: string | undefined, agent: string | undefined) {
  const pool = await getDatabasePool();
  await pool.request().input("nombreAcceso", sql.NVarChar(90), nombreAcceso).input("idUsuario", sql.BigInt, idUsuario).input("success", sql.Bit, success)
    .input("reason", sql.NVarChar(500), reason).input("ip", sql.NVarChar(45), ip ?? null).input("agent", sql.NVarChar(500), agent ?? null).input("usuarioRegistro", sql.NVarChar(90), nombreAcceso || "SISTEMA")
    .query(`INSERT INTO Auditoria.tblIntentosAutenticacion(nombreAcceso,idUsuario,direccionIp,agenteUsuario,fueExitoso,motivoFallo,usuarioRegistro) VALUES(@nombreAcceso,@idUsuario,@ip,@agent,@success,@reason,@usuarioRegistro)`);
}

export async function registerFailure(idUsuario: number) {
  const pool = await getDatabasePool();
  await pool.request().input("idUsuario", sql.BigInt, idUsuario).query(`UPDATE Seguridad.tblUsuarios SET intentosFallidos=intentosFallidos+1,fechaBloqueo=CASE WHEN intentosFallidos+1>=5 THEN DATEADD(MINUTE,15,SYSDATETIME()) ELSE fechaBloqueo END WHERE idUsuario=@idUsuario`);
}

export async function registerSuccess(idUsuario: number) {
  const pool = await getDatabasePool();
  await pool.request().input("idUsuario", sql.BigInt, idUsuario).query(`UPDATE Seguridad.tblUsuarios SET intentosFallidos=0,fechaBloqueo=NULL,ultimoAcceso=SYSDATETIME() WHERE idUsuario=@idUsuario`);
}
