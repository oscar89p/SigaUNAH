/*
  SIGA UNAH - Opción de navegación para Catálogos
  Revisión requerida antes de ejecutar.

  No crear permisos nuevos: reutiliza CONFIGURACION_ADMINISTRAR.
  Perfil objetivo: ADMIN_GENERAL.
  El script termina en ROLLBACK deliberadamente. Descomentar COMMIT y
  comentar ROLLBACK únicamente después de revisar el resultado.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @adminId int = (SELECT TOP (1) idNavegacion FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMINISTRACION' AND estadoNavegacion = 1);
DECLARE @configId int = (SELECT TOP (1) idNavegacion FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMIN_CONFIGURACION' AND estadoNavegacion = 1);
DECLARE @profileId int = (SELECT TOP (1) idPerfil FROM Seguridad.tblPerfiles WHERE codigoPerfil = N'ADMIN_GENERAL' AND estadoPerfil = 1);
DECLARE @configurationPermissionId int = (SELECT TOP (1) idPermiso FROM Seguridad.tblPermisos WHERE codigoPermiso = N'CONFIGURACION_ADMINISTRAR' AND estadoPermiso = 1);
DECLARE @catalogId int;

IF @adminId IS NULL THROW 51060, N'No existe el contenedor ADMINISTRACION activo.', 1;
IF @configId IS NULL THROW 51061, N'No existe la navegación ADMIN_CONFIGURACION activa.', 1;
IF @profileId IS NULL THROW 51064, N'No existe el perfil ADMIN_GENERAL activo.', 1;
IF @configurationPermissionId IS NULL THROW 51065, N'No existe el permiso CONFIGURACION_ADMINISTRAR activo.', 1;

IF EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMIN_CATALOGOS' AND (ISNULL(enlaceNavegacion,N'') <> N'/administracion/configuracion/catalogos' OR ISNULL(idNavegacionPadre,-1) <> @adminId))
  THROW 51062, N'ADMIN_CATALOGOS existe con ruta o jerarquía diferente; revisión manual requerida.', 1;
IF EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMIN_CATALOGOS' AND (estadoNavegacion=0 OR esVisible=0))
  THROW 51063, N'ADMIN_CATALOGOS existe inactivo u oculto; revisión manual requerida.', 1;

IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMIN_CATALOGOS')
BEGIN
  INSERT INTO Seguridad.tblNavegaciones
    (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
  VALUES
    (N'ADMIN_CATALOGOS',N'Catálogos',N'Catálogos',N'Administración de tipos y valores institucionales.',N'ITEM',N'/administracion/configuracion/catalogos',5,@adminId,1,1,N'REVISION');
END;

SET @catalogId = (SELECT TOP (1) idNavegacion FROM Seguridad.tblNavegaciones WHERE codigoNavegacion = N'ADMIN_CATALOGOS' AND estadoNavegacion = 1);

IF NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfilesPermisos WHERE idPerfil=@profileId AND idPermiso=@configurationPermissionId AND estadoPerfilPermiso=1)
  THROW 51066, N'ADMIN_GENERAL no tiene CONFIGURACION_ADMINISTRAR activo.', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfilesNavegaciones WHERE idPerfil=@profileId AND idNavegacion=@adminId AND permiteVisualizar=1 AND estadoPerfilNavegacion=1)
  THROW 51067, N'ADMIN_GENERAL no tiene asignado el contenedor ADMINISTRACION.', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfilesNavegaciones WHERE idPerfil=@profileId AND idNavegacion=@catalogId)
BEGIN
  INSERT INTO Seguridad.tblPerfilesNavegaciones (idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
  VALUES (@profileId,@catalogId,1,1,N'REVISION');
END
ELSE
BEGIN
  UPDATE Seguridad.tblPerfilesNavegaciones SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=N'REVISION',fechaActualizacion=SYSDATETIME() WHERE idPerfil=@profileId AND idNavegacion=@catalogId;
END

SELECT n.codigoNavegacion,n.enlaceNavegacion,n.idNavegacionPadre,n.estadoNavegacion,n.esVisible
FROM Seguridad.tblNavegaciones n
WHERE n.codigoNavegacion IN (N'ADMINISTRACION',N'ADMIN_CONFIGURACION',N'ADMIN_CATALOGOS');

SELECT p.codigoPerfil,pn.idNavegacion,pn.permiteVisualizar,pn.estadoPerfilNavegacion
FROM Seguridad.tblPerfilesNavegaciones pn
INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=pn.idPerfil
INNER JOIN Seguridad.tblNavegaciones n ON n.idNavegacion=pn.idNavegacion
WHERE n.codigoNavegacion=N'ADMIN_CATALOGOS' AND p.codigoPerfil=N'ADMIN_GENERAL';

-- COMMIT TRANSACTION;
ROLLBACK TRANSACTION;
