/*
  SUPERSEDED: use docs/propuesta-permisos-navegacion-p1-v2.sql for review.
  This v1 remains for audit history only; do not execute it.
*/
/*
  PROPUESTA PARA REVISIÓN DBA/FUNCIONAL — P1 RBAC Y MENÚ DINÁMICO

  NO EJECUTAR EN PRODUCCIÓN. No se ejecutó durante este trabajo.
  DML solamente contra Seguridad.tblPermisos, tblPerfilesPermisos,
  tblNavegaciones y tblPerfilesNavegaciones; no cambia la estructura.
  El guard @AprobadoParaAplicar=0 aborta antes de iniciar la transacción.
  Tras aprobación formal, DBA debe revisar los perfiles/códigos y cambiar el
  guard. La transacción termina con ROLLBACK por defecto; para persistir los
  cambios aprobados, sustituir explícitamente el ROLLBACK final por COMMIT.

  La propuesta concede los nuevos permisos únicamente a ADMIN_GENERAL.
  No los concede a otros perfiles. Accesos de solo lectura usan el código
  ACCESOS_CONSULTAR existente y nunca se usan para autorizar escrituras.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AprobadoParaAplicar bit = 0;
IF @AprobadoParaAplicar <> 1
  THROW 51000, N'Script de propuesta detenido; requiere aprobación DBA/funcional.', 1;

DECLARE @UsuarioRevision nvarchar(90) = N'APROBACION_P1';
DECLARE @IdPerfilAdmin int;

SELECT @IdPerfilAdmin = idPerfil
FROM Seguridad.tblPerfiles
WHERE codigoPerfil = N'ADMIN_GENERAL' AND estadoPerfil = 1;

IF @IdPerfilAdmin IS NULL
  THROW 51001, N'ADMIN_GENERAL no existe o está inactivo; revise el alcance.', 1;

DECLARE @NuevosPermisos TABLE (
  codigoPermiso nvarchar(80) NOT NULL PRIMARY KEY,
  nombrePermiso nvarchar(150) NOT NULL,
  descripcionPermiso nvarchar(500) NOT NULL,
  moduloPermiso nvarchar(50) NOT NULL
);

INSERT INTO @NuevosPermisos (codigoPermiso,nombrePermiso,descripcionPermiso,moduloPermiso)
VALUES
  (N'CAMPUS_ADMINISTRAR',N'Administrar campus',N'Crear, modificar y cambiar estado de campus.',N'ACCESOS'),
  (N'EDIFICIOS_ADMINISTRAR',N'Administrar edificios',N'Crear, modificar y cambiar estado de edificios.',N'ACCESOS'),
  (N'ELEVADORES_ADMINISTRAR',N'Administrar elevadores',N'Crear, modificar y cambiar estado de elevadores.',N'ACCESOS'),
  (N'DISPOSITIVOS_ADMINISTRAR',N'Administrar dispositivos',N'Crear, modificar y cambiar estado de dispositivos.',N'ACCESOS'),
  (N'SOLICITUDES_CONSULTAR',N'Consultar solicitudes',N'Consultar solicitudes y opciones de captura.',N'SOLICITUDES'),
  (N'SOLICITUDES_REGISTRAR',N'Registrar solicitudes',N'Crear solicitudes de acceso.',N'SOLICITUDES'),
  (N'SOLICITUDES_MODIFICAR',N'Modificar solicitudes',N'Modificar datos sin transicionar estado.',N'SOLICITUDES'),
  (N'SOLICITUDES_GESTIONAR',N'Gestionar estado de solicitudes',N'Ejecutar transiciones y registrar historial.',N'SOLICITUDES'),
  (N'NAVEGACION_ADMINISTRAR',N'Administrar navegación',N'Administrar opciones, jerarquía y rutas del menú.',N'SEGURIDAD');

DECLARE @NuevasNavegaciones TABLE (
  codigoNavegacion nvarchar(64) NOT NULL PRIMARY KEY,
  nombreNavegacion nvarchar(128) NOT NULL,
  tituloNavegacion nvarchar(128) NOT NULL,
  descripcionNavegacion nvarchar(512) NOT NULL,
  tipoNavegacion nvarchar(16) NOT NULL,
  enlaceNavegacion nvarchar(256) NULL,
  ordenNavegacion smallint NOT NULL,
  codigoPadre nvarchar(64) NULL
);

INSERT INTO @NuevasNavegaciones
  (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,codigoPadre)
VALUES
  (N'OPERACION',N'Operación',N'Operación',N'Beneficiarios, solicitudes y tarjetas.',N'MODULO',NULL,2,NULL),
  (N'SOLICITUDES',N'Solicitudes',N'Solicitudes',N'Gestión de solicitudes de acceso.',N'OPCION',N'/solicitudes',2,N'OPERACION'),
  (N'MONITOREO',N'Monitoreo',N'Monitoreo',N'Consulta de eventos de acceso e incidentes.',N'OPCION',N'/monitoreo',5,NULL),
  (N'CAMPUS',N'Campus',N'Campus',N'Administración de campus.',N'OPCION',N'/campus',1,N'ACCESOS'),
  (N'EDIFICIOS',N'Edificios',N'Edificios',N'Administración de edificios.',N'OPCION',N'/edificios',2,N'ACCESOS'),
  (N'ELEVADORES',N'Elevadores',N'Elevadores',N'Administración de elevadores.',N'OPCION',N'/elevadores',3,N'ACCESOS'),
  (N'DISPOSITIVOS',N'Dispositivos',N'Dispositivos',N'Administración de dispositivos.',N'OPCION',N'/dispositivos',4,N'ACCESOS'),
  (N'ADMIN_NAVEGACIONES',N'Navegación',N'Navegación',N'Administración de opciones de navegación.',N'OPCION',N'/administracion/navegaciones',6,N'ADMINISTRACION');

BEGIN TRY
  BEGIN TRANSACTION;

  INSERT INTO Seguridad.tblPermisos (codigoPermiso,nombrePermiso,descripcionPermiso,moduloPermiso,usuarioRegistro)
  SELECT p.codigoPermiso,p.nombrePermiso,p.descripcionPermiso,p.moduloPermiso,@UsuarioRevision
  FROM @NuevosPermisos p
  WHERE NOT EXISTS (SELECT 1 FROM Seguridad.tblPermisos actual WHERE actual.codigoPermiso=p.codigoPermiso);

  MERGE Seguridad.tblPerfilesPermisos AS target
  USING (
    SELECT @IdPerfilAdmin AS idPerfil,p.idPermiso
    FROM @NuevosPermisos propuesta
    INNER JOIN Seguridad.tblPermisos p ON p.codigoPermiso=propuesta.codigoPermiso AND p.estadoPermiso=1
  ) AS source
  ON target.idPerfil=source.idPerfil AND target.idPermiso=source.idPermiso
  WHEN MATCHED THEN UPDATE SET estadoPerfilPermiso=1,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHEN NOT MATCHED THEN INSERT(idPerfil,idPermiso,estadoPerfilPermiso,usuarioRegistro)
    VALUES(source.idPerfil,source.idPermiso,1,@UsuarioRevision);

  /* Corrige ACCESOS: debe ser contenedor, no una ruta inexistente /accesos. */
  UPDATE Seguridad.tblNavegaciones
  SET enlaceNavegacion=NULL,tipoNavegacion=N'MODULO',usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHERE codigoNavegacion=N'ACCESOS';

  IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N'OPERACION')
    INSERT INTO Seguridad.tblNavegaciones
      (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
    VALUES (N'OPERACION',N'Operación',N'Operación',N'Beneficiarios, solicitudes y tarjetas.',N'MODULO',NULL,2,NULL,1,1,@UsuarioRevision);

  UPDATE nav SET idNavegacionPadre=parent.idNavegacion,
    ordenNavegacion=CASE nav.codigoNavegacion WHEN N'BENEFICIARIOS' THEN 1 ELSE 3 END,
    usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  FROM Seguridad.tblNavegaciones nav CROSS JOIN Seguridad.tblNavegaciones parent
  WHERE nav.codigoNavegacion IN (N'BENEFICIARIOS',N'TARJETAS') AND parent.codigoNavegacion=N'OPERACION';

  /* Mantiene los registros inválidos, pero los oculta hasta implementar sus pantallas. */
  UPDATE Seguridad.tblNavegaciones
  SET esVisible=0,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHERE codigoNavegacion IN (N'REPORTES',N'SOPORTE',N'MI_CUENTA',N'MI_INFORMACION',N'MI_TARJETA');

  IF EXISTS (
    SELECT 1 FROM @NuevasNavegaciones propuesta
    WHERE propuesta.codigoPadre IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones padre WHERE padre.codigoNavegacion=propuesta.codigoPadre AND padre.estadoNavegacion=1)
  ) THROW 51002, N'Falta un padre activo para una opción propuesta.', 1;

  IF EXISTS (
    SELECT 1 FROM @NuevasNavegaciones propuesta
    JOIN Seguridad.tblNavegaciones actual ON actual.enlaceNavegacion=propuesta.enlaceNavegacion
    WHERE propuesta.enlaceNavegacion IS NOT NULL AND actual.codigoNavegacion<>propuesta.codigoNavegacion
  ) THROW 51003, N'Una ruta propuesta ya pertenece a otra opción.', 1;

  UPDATE nav SET nombreNavegacion=propuesta.nombreNavegacion,tituloNavegacion=propuesta.tituloNavegacion,
    descripcionNavegacion=propuesta.descripcionNavegacion,tipoNavegacion=propuesta.tipoNavegacion,
    enlaceNavegacion=propuesta.enlaceNavegacion,ordenNavegacion=propuesta.ordenNavegacion,
    idNavegacionPadre=padre.idNavegacion,esVisible=1,estadoNavegacion=1,
    usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  FROM Seguridad.tblNavegaciones nav
  JOIN @NuevasNavegaciones propuesta ON propuesta.codigoNavegacion=nav.codigoNavegacion
  LEFT JOIN Seguridad.tblNavegaciones padre ON padre.codigoNavegacion=propuesta.codigoPadre;

  INSERT INTO Seguridad.tblNavegaciones
    (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
  SELECT propuesta.codigoNavegacion,propuesta.nombreNavegacion,propuesta.tituloNavegacion,propuesta.descripcionNavegacion,
    propuesta.tipoNavegacion,propuesta.enlaceNavegacion,propuesta.ordenNavegacion,padre.idNavegacion,1,1,@UsuarioRevision
  FROM @NuevasNavegaciones propuesta
  LEFT JOIN Seguridad.tblNavegaciones padre ON padre.codigoNavegacion=propuesta.codigoPadre
  WHERE NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones actual WHERE actual.codigoNavegacion=propuesta.codigoNavegacion);

  /* Rehabilita/crea relación perfil-navegación sin conceder permisos API. */
  MERGE Seguridad.tblPerfilesNavegaciones AS target
  USING (
    SELECT DISTINCT pn.idPerfil,parent.idNavegacion
    FROM Seguridad.tblPerfilesNavegaciones pn
    JOIN Seguridad.tblNavegaciones child ON child.idNavegacion=pn.idNavegacion AND child.codigoNavegacion IN (N'BENEFICIARIOS',N'TARJETAS')
    JOIN Seguridad.tblNavegaciones parent ON parent.codigoNavegacion=N'OPERACION'
    JOIN Seguridad.tblPerfiles p ON p.idPerfil=pn.idPerfil AND p.estadoPerfil=1
    WHERE pn.estadoPerfilNavegacion=1 AND pn.permiteVisualizar=1
  ) AS source ON target.idPerfil=source.idPerfil AND target.idNavegacion=source.idNavegacion
  WHEN MATCHED THEN UPDATE SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHEN NOT MATCHED THEN INSERT(idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
    VALUES(source.idPerfil,source.idNavegacion,1,1,@UsuarioRevision);

  MERGE Seguridad.tblPerfilesNavegaciones AS target
  USING (
    SELECT DISTINCT p.idPerfil,nav.idNavegacion
    FROM Seguridad.tblPerfiles p
    JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
    JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N'ACCESOS_HISTORIAL' AND pe.estadoPermiso=1
    CROSS JOIN Seguridad.tblNavegaciones nav
    WHERE p.estadoPerfil=1 AND nav.codigoNavegacion=N'MONITOREO' AND nav.estadoNavegacion=1
  ) AS source ON target.idPerfil=source.idPerfil AND target.idNavegacion=source.idNavegacion
  WHEN MATCHED THEN UPDATE SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHEN NOT MATCHED THEN INSERT(idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
    VALUES(source.idPerfil,source.idNavegacion,1,1,@UsuarioRevision);

  MERGE Seguridad.tblPerfilesNavegaciones AS target
  USING (
    SELECT DISTINCT p.idPerfil,nav.idNavegacion
    FROM Seguridad.tblPerfiles p
    JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
    JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N'ACCESOS_CONSULTAR' AND pe.estadoPermiso=1
    CROSS JOIN Seguridad.tblNavegaciones nav
    WHERE p.estadoPerfil=1 AND nav.codigoNavegacion IN (N'ACCESOS',N'CAMPUS',N'EDIFICIOS',N'ELEVADORES',N'DISPOSITIVOS') AND nav.estadoNavegacion=1
  ) AS source ON target.idPerfil=source.idPerfil AND target.idNavegacion=source.idNavegacion
  WHEN MATCHED THEN UPDATE SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHEN NOT MATCHED THEN INSERT(idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
    VALUES(source.idPerfil,source.idNavegacion,1,1,@UsuarioRevision);

  MERGE Seguridad.tblPerfilesNavegaciones AS target
  USING (
    SELECT DISTINCT p.idPerfil,nav.idNavegacion
    FROM Seguridad.tblPerfiles p
    JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
    JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.estadoPermiso=1
    JOIN Seguridad.tblNavegaciones nav ON nav.estadoNavegacion=1
      AND ((pe.codigoPermiso=N'SOLICITUDES_CONSULTAR' AND nav.codigoNavegacion IN (N'OPERACION',N'SOLICITUDES'))
        OR (pe.codigoPermiso=N'NAVEGACION_ADMINISTRAR' AND nav.codigoNavegacion=N'ADMIN_NAVEGACIONES'))
    WHERE p.estadoPerfil=1
  ) AS source ON target.idPerfil=source.idPerfil AND target.idNavegacion=source.idNavegacion
  WHEN MATCHED THEN UPDATE SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  WHEN NOT MATCHED THEN INSERT(idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
    VALUES(source.idPerfil,source.idNavegacion,1,1,@UsuarioRevision);

  SELECT codigoPermiso,nombrePermiso,moduloPermiso,estadoPermiso
  FROM Seguridad.tblPermisos WHERE codigoPermiso IN (SELECT codigoPermiso FROM @NuevosPermisos) ORDER BY codigoPermiso;
  SELECT codigoNavegacion,tituloNavegacion,enlaceNavegacion,idNavegacionPadre,esVisible,estadoNavegacion
  FROM Seguridad.tblNavegaciones
  WHERE codigoNavegacion IN (SELECT codigoNavegacion FROM @NuevasNavegaciones) OR codigoNavegacion IN (N'OPERACION',N'ACCESOS')
  ORDER BY idNavegacionPadre,ordenNavegacion,idNavegacion;

  ROLLBACK TRANSACTION; -- Seguro por defecto; solo DBA puede sustituir por COMMIT aprobado.
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
