/* SIGA UNAH - DML incremental e idempotente
   No crea tablas, no copia IDs identity y no asigna permisos a perfiles. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @idConfiguracion int;
SELECT @idConfiguracion=idNavegacion FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N'ADMIN_CONFIGURACION' AND estadoNavegacion=1;
IF @idConfiguracion IS NULL THROW 51150, N'No existe la navegación activa ADMIN_CONFIGURACION.', 1;

/* Configuración es un contenedor; sus pantallas son opciones hijas. */
UPDATE Seguridad.tblNavegaciones SET enlaceNavegacion=NULL,usuarioActualizacion=N'script-configuracion',fechaActualizacion=SYSDATETIME() WHERE idNavegacion=@idConfiguracion;

IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N'ADMIN_PARAMETROS')
  INSERT INTO Seguridad.tblNavegaciones (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,usuarioRegistro)
  VALUES (N'ADMIN_PARAMETROS',N'Parámetros',N'Parámetros',N'Administración de parámetros institucionales.',N'OPCION',N'/administracion/configuracion/parametros',10,@idConfiguracion,1,N'script-configuracion');
ELSE
  UPDATE Seguridad.tblNavegaciones SET enlaceNavegacion=N'/administracion/configuracion/parametros',idNavegacionPadre=@idConfiguracion,estadoNavegacion=1,esVisible=1,usuarioActualizacion=N'script-configuracion',fechaActualizacion=SYSDATETIME() WHERE codigoNavegacion=N'ADMIN_PARAMETROS';

IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N'ADMIN_CATALOGOS')
  INSERT INTO Seguridad.tblNavegaciones (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,usuarioRegistro)
  VALUES (N'ADMIN_CATALOGOS',N'Catálogos',N'Catálogos',N'Administración de catálogos institucionales.',N'OPCION',N'/administracion/configuracion/catalogos',20,@idConfiguracion,1,N'script-configuracion');
ELSE
  UPDATE Seguridad.tblNavegaciones SET enlaceNavegacion=N'/administracion/configuracion/catalogos',idNavegacionPadre=@idConfiguracion,estadoNavegacion=1,esVisible=1,usuarioActualizacion=N'script-configuracion',fechaActualizacion=SYSDATETIME() WHERE codigoNavegacion=N'ADMIN_CATALOGOS';

IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N'ADMIN_PERIODOS_ACADEMICOS')
  INSERT INTO Seguridad.tblNavegaciones (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,usuarioRegistro)
  VALUES (N'ADMIN_PERIODOS_ACADEMICOS',N'Períodos académicos',N'Períodos académicos',N'Administración de períodos académicos institucionales.',N'OPCION',N'/administracion/configuracion/periodos-academicos',30,@idConfiguracion,1,N'script-configuracion');
ELSE
  UPDATE Seguridad.tblNavegaciones SET enlaceNavegacion=N'/administracion/configuracion/periodos-academicos',idNavegacionPadre=@idConfiguracion,estadoNavegacion=1,esVisible=1,usuarioActualizacion=N'script-configuracion',fechaActualizacion=SYSDATETIME() WHERE codigoNavegacion=N'ADMIN_PERIODOS_ACADEMICOS';

/* Solo replica la navegación a perfiles que ya tenían Configuración asignada.
   No agrega permisos ni altera asignaciones existentes. */
INSERT INTO Seguridad.tblPerfilesNavegaciones (idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
SELECT DISTINCT parentAssignment.idPerfil, child.idNavegacion, 1, 1, N'script-configuracion'
FROM Seguridad.tblPerfilesNavegaciones parentAssignment
INNER JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=parentAssignment.idNavegacion AND parent.codigoNavegacion=N'ADMIN_CONFIGURACION'
INNER JOIN Seguridad.tblNavegaciones child ON child.idNavegacionPadre=@idConfiguracion AND child.codigoNavegacion IN (N'ADMIN_PARAMETROS',N'ADMIN_CATALOGOS',N'ADMIN_PERIODOS_ACADEMICOS') AND child.estadoNavegacion=1 AND child.esVisible=1
WHERE parentAssignment.estadoPerfilNavegacion=1 AND parentAssignment.permiteVisualizar=1
  AND NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfilesNavegaciones existing WHERE existing.idPerfil=parentAssignment.idPerfil AND existing.idNavegacion=child.idNavegacion);

COMMIT TRANSACTION;
GO

/* Verificación: la asignación a perfiles debe realizarse explícitamente por Seguridad. */
SELECT n.idNavegacion,n.codigoNavegacion,n.enlaceNavegacion,n.idNavegacionPadre,n.estadoNavegacion,n.esVisible
FROM Seguridad.tblNavegaciones n
WHERE n.codigoNavegacion IN (N'ADMIN_CONFIGURACION',N'ADMIN_PARAMETROS',N'ADMIN_CATALOGOS',N'ADMIN_PERIODOS_ACADEMICOS')
ORDER BY n.idNavegacionPadre,n.ordenNavegacion;

SELECT p.idPermiso,p.codigoPermiso,p.estadoPermiso
FROM Seguridad.tblPermisos p
WHERE p.codigoPermiso=N'CONFIGURACION_ADMINISTRAR';

SELECT p.codigoPerfil,n.codigoNavegacion,pn.estadoPerfilNavegacion,pn.permiteVisualizar
FROM Seguridad.tblPerfilesNavegaciones pn
INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=pn.idPerfil
INNER JOIN Seguridad.tblNavegaciones n ON n.idNavegacion=pn.idNavegacion
WHERE n.codigoNavegacion IN (N'ADMIN_PARAMETROS',N'ADMIN_CATALOGOS',N'ADMIN_PERIODOS_ACADEMICOS')
ORDER BY p.codigoPerfil,n.ordenNavegacion;

SELECT COUNT(1) AS periodosAcademicos FROM Academico.tblPeriodosAcademicos;
