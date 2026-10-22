-- Consultas de solo lectura. No muestran claveHash ni credenciales.

SELECT
  u.idUsuario,
  u.nombreUsuario,
  u.correoElectronico,
  u.nombreAcceso,
  u.tipoAutenticacion,
  u.intentosFallidos,
  u.fechaBloqueo,
  u.estadoUsuario,
  p.codigoPerfil,
  up.estadoUsuarioPerfil
FROM Seguridad.tblUsuarios u
INNER JOIN Seguridad.tblUsuariosPerfiles up ON up.idUsuario = u.idUsuario
INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil = up.idPerfil
WHERE u.nombreAcceso = N'<NOMBRE_ACCESO>';

SELECT
  p.codigoPerfil,
  pe.codigoPermiso,
  pe.moduloPermiso
FROM Seguridad.tblPerfiles p
INNER JOIN Seguridad.tblPerfilesPermisos pp
  ON pp.idPerfil = p.idPerfil AND pp.estadoPerfilPermiso = 1
INNER JOIN Seguridad.tblPermisos pe
  ON pe.idPermiso = pp.idPermiso AND pe.estadoPermiso = 1
WHERE p.codigoPerfil = N'ADMIN_GENERAL'
  AND p.estadoPerfil = 1
ORDER BY pe.moduloPermiso, pe.codigoPermiso;
