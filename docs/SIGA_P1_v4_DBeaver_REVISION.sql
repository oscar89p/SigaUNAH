/* SIGA P1 v4 - DBeaver, una sentencia. APROBACIONES=0, ROLLBACK. */
EXEC sys.sp_executesql N'/*
  SIGA UNAH — PROPUESTA P1 v3 CORREGIDA PARA REVISIÓN DBA/FUNCIONAL

  SOLO PARA DbSigaUNAH LOCAL. NO EJECUTAR EN PRODUCCIÓN.
  Correcciones v3: resuelve id ADMIN_GENERAL, preserva Configuración/Auditoría
  bajo Administración y verifica permisos/menús activos tras aplicar.
  No se ejecutó durante el desarrollo. Este archivo no cambia estructura:
  solo propone INSERT/UPDATE en catálogos existentes de permisos/navegación y
  sus tablas de relación.

  Seguridad de ejecución:
    - @AprobadoParaAplicar=0 por defecto; el batch aborta antes de la transacción.
    - Los cambios a opciones existentes también tienen aprobaciones separadas,
      inicialmente en 0: enlace ACCESOS, jerarquía Operación y jerarquía Seguridad.
    - Todas las validaciones y vistas previas anteriores al guard son SELECT.
    - La transacción termina con ROLLBACK. Solo el DBA puede aprobar, revisar
      asignaciones/impacto y sustituir explícitamente el ROLLBACK final por COMMIT.
    - No se ocultan, desactivan ni borran opciones actuales. El enlace inválido
      ACCESOS se cambia a NULL para convertir esa opción en contenedor. También
      se reubican BENEFICIARIOS/TARJETAS bajo OPERACION y Usuarios/Perfiles/
      Permisos bajo Seguridad. Son seis filas existentes modificadas; el código
      de perfil y su autorización API no se cambian.
    - Nuevos permisos se asignan únicamente a ADMIN_GENERAL. No se amplían otros
      perfiles. Menú adicional se asigna solo por permisos/perfiles que ya lo justifican.

  Los nueve códigos de permiso de @NuevosPermisos se contrastaron con
  backend/src/modules/auth/authorization.ts: los nueve aparecen allí como
  códigos de operación. Los permisos no se insertan ni asignan por APIs normales;
  este script requiere revisión y aprobación específica.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AprobadoParaAplicar bit = 0;
DECLARE @AprobadoCambiarEnlaceAccesos bit = 0;
DECLARE @AprobadoJerarquiaOperacion bit = 0;
DECLARE @AprobadoJerarquiaSeguridad bit = 0;
DECLARE @UsuarioRevision nvarchar(90) = N''REVISION_DBA_P1_V3'';
DECLARE @IdPerfilAdmin int;

DECLARE @NuevosPermisos TABLE (
  codigoPermiso nvarchar(80) NOT NULL PRIMARY KEY,
  nombrePermiso nvarchar(150) NOT NULL,
  descripcionPermiso nvarchar(500) NOT NULL,
  moduloPermiso nvarchar(50) NOT NULL
);
INSERT INTO @NuevosPermisos VALUES
  (N''CAMPUS_ADMINISTRAR'',N''Administrar campus'',N''Crear, modificar y cambiar estado de campus.'',N''ACCESOS''),
  (N''EDIFICIOS_ADMINISTRAR'',N''Administrar edificios'',N''Crear, modificar y cambiar estado de edificios.'',N''ACCESOS''),
  (N''ELEVADORES_ADMINISTRAR'',N''Administrar elevadores'',N''Crear, modificar y cambiar estado de elevadores.'',N''ACCESOS''),
  (N''DISPOSITIVOS_ADMINISTRAR'',N''Administrar dispositivos'',N''Crear, modificar y cambiar estado de dispositivos.'',N''ACCESOS''),
  (N''SOLICITUDES_CONSULTAR'',N''Consultar solicitudes'',N''Consultar solicitudes y opciones de captura.'',N''SOLICITUDES''),
  (N''SOLICITUDES_REGISTRAR'',N''Registrar solicitudes'',N''Crear solicitudes de acceso.'',N''SOLICITUDES''),
  (N''SOLICITUDES_MODIFICAR'',N''Modificar solicitudes'',N''Modificar datos sin cambiar estado.'',N''SOLICITUDES''),
  (N''SOLICITUDES_GESTIONAR'',N''Gestionar estado de solicitudes'',N''Ejecutar transiciones e incorporar historial.'',N''SOLICITUDES''),
  (N''NAVEGACION_ADMINISTRAR'',N''Administrar navegación'',N''Administrar opciones, jerarquía y rutas del menú.'',N''SEGURIDAD'');

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
INSERT INTO @NuevasNavegaciones VALUES
  (N''OPERACION'',N''Operación'',N''Operación'',N''Beneficiarios, solicitudes y tarjetas.'',N''MODULO'',NULL,2,NULL),
  (N''SEGURIDAD'',N''Seguridad'',N''Seguridad'',N''Usuarios, perfiles, permisos y navegación.'',N''MODULO'',NULL,1,N''ADMINISTRACION''),
  (N''SOLICITUDES'',N''Solicitudes'',N''Solicitudes'',N''Gestión de solicitudes de acceso.'',N''OPCION'',N''/solicitudes'',2,N''OPERACION''),
  (N''MONITOREO'',N''Monitoreo'',N''Monitoreo'',N''Consulta de registros de acceso e incidentes.'',N''OPCION'',N''/monitoreo'',9,NULL),
  (N''CAMPUS'',N''Campus'',N''Campus'',N''Administración de campus.'',N''OPCION'',N''/campus'',1,N''ACCESOS''),
  (N''EDIFICIOS'',N''Edificios'',N''Edificios'',N''Administración de edificios.'',N''OPCION'',N''/edificios'',2,N''ACCESOS''),
  (N''ELEVADORES'',N''Elevadores'',N''Elevadores'',N''Administración de elevadores.'',N''OPCION'',N''/elevadores'',3,N''ACCESOS''),
  (N''DISPOSITIVOS'',N''Dispositivos'',N''Dispositivos'',N''Administración de dispositivos.'',N''OPCION'',N''/dispositivos'',4,N''ACCESOS''),
  (N''ADMIN_NAVEGACIONES'',N''Navegación'',N''Navegación'',N''Administración de opciones de navegación.'',N''OPCION'',N''/administracion/navegaciones'',4,N''SEGURIDAD'');

DECLARE @RutasVue TABLE (enlace nvarchar(256) NOT NULL PRIMARY KEY);
INSERT INTO @RutasVue VALUES
  (N''/inicio''),(N''/campus''),(N''/edificios''),(N''/elevadores''),(N''/dispositivos''),
  (N''/beneficiarios''),(N''/solicitudes''),(N''/tarjetas''),(N''/monitoreo''),
  (N''/administracion/usuarios''),(N''/administracion/perfiles''),(N''/administracion/permisos''),
  (N''/administracion/navegaciones''),(N''/administracion/configuracion''),(N''/administracion/auditoria'');

/* Preflight 0: verificar base/tablas/columnas contra el catálogo real. Solo SELECT/metadata. */
IF DB_NAME() <> N''DbSigaUNAH''
  THROW 51100, N''La base actual no es DbSigaUNAH; no aplique esta propuesta.'', 1;
IF OBJECT_ID(N''Seguridad.tblPermisos'',N''U'') IS NULL OR OBJECT_ID(N''Seguridad.tblPerfilesPermisos'',N''U'') IS NULL
   OR OBJECT_ID(N''Seguridad.tblNavegaciones'',N''U'') IS NULL OR OBJECT_ID(N''Seguridad.tblPerfilesNavegaciones'',N''U'') IS NULL
  THROW 51101, N''Falta una tabla de seguridad requerida; detenga y revise el esquema.'', 1;
IF ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''codigoPermiso''),-1)<>160 OR ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''nombrePermiso''),-1)<>300
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''descripcionPermiso''),-1)<>1000 OR ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''moduloPermiso''),-1)<>100
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''estadoPermiso''),-1)<>1 OR ISNULL(COL_LENGTH(N''Seguridad.tblPermisos'',N''usuarioRegistro''),-1)<>180
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesPermisos'',N''idPerfil''),-1)<>4 OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesPermisos'',N''idPermiso''),-1)<>4
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesPermisos'',N''estadoPerfilPermiso''),-1)<>1 OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesPermisos'',N''usuarioRegistro''),-1)<>180
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''codigoNavegacion''),-1)<>128 OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''nombreNavegacion''),-1)<>256
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''tituloNavegacion''),-1)<>256 OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''descripcionNavegacion''),-1)<>1024
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''tipoNavegacion''),-1)<>32 OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''enlaceNavegacion''),-1)<>512
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''idNavegacionPadre''),-1)<>4 OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''ordenNavegacion''),-1)<>2
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''esVisible''),-1)<>1 OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''estadoNavegacion''),-1)<>1
   OR ISNULL(COL_LENGTH(N''Seguridad.tblNavegaciones'',N''usuarioRegistro''),-1)<>180
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesNavegaciones'',N''idPerfil''),-1)<>4 OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesNavegaciones'',N''idNavegacion''),-1)<>4
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesNavegaciones'',N''permiteVisualizar''),-1)<>1 OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesNavegaciones'',N''estadoPerfilNavegacion''),-1)<>1
   OR ISNULL(COL_LENGTH(N''Seguridad.tblPerfilesNavegaciones'',N''usuarioRegistro''),-1)<>180
  THROW 51102, N''Las columnas/tipos/longitudes reales difieren del contrato v2; no aplique.'', 1;

/* Preflight 1: PK, unique keys, FKs, supporting indexes y DEFAULTs comprobados en SQL Server. */
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''pkPermiso'' AND type=N''PK'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPermisos''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''ukPermiso_Codigo'' AND type=N''UQ'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPermisos''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''pkPerfilPermiso'' AND type=N''PK'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPerfilesPermisos''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''ukPerfilPermiso_PerfilPermiso'' AND type=N''UQ'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPerfilesPermisos''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''pkNavegacion'' AND type=N''PK'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblNavegaciones''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''ukNavegacion_Codigo'' AND type=N''UQ'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblNavegaciones''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''pkPerfilNavegacion'' AND type=N''PK'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPerfilesNavegaciones''))
 OR NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name=N''ukPerfilNavegacion_PerfilNavegacion'' AND type=N''UQ'' AND parent_object_id=OBJECT_ID(N''Seguridad.tblPerfilesNavegaciones''))
  THROW 51103, N''Falta o cambió una PK/UNIQUE requerida; no aplique.'', 1;
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''fkNavegacion_NavegacionPadre'' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''fkPerfilNavegacion_Navegacion'' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''fkPerfilNavegacion_Perfil'' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''fkPerfilPermiso_Perfil'' AND is_disabled=0 AND is_not_trusted=0)
 OR NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name=N''fkPerfilPermiso_Permiso'' AND is_disabled=0 AND is_not_trusted=0)
  THROW 51104, N''Falta una FK confiable requerida; no aplique.'', 1;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''Seguridad.tblNavegaciones'') AND name=N''ixNavegacion_NavegacionPadre'' AND is_disabled=0)
 OR NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N''Seguridad.tblPerfilesNavegaciones'') AND name=N''ixPerfilNavegacion_Perfil'' AND is_disabled=0)
  THROW 51105, N''Falta un índice de jerarquía/asignación requerido; no aplique.'', 1;
IF EXISTS (
  SELECT 1 FROM (VALUES
    (N''tblPermisos'',N''estadoPermiso''),(N''tblPerfilesPermisos'',N''estadoPerfilPermiso''),
    (N''tblNavegaciones'',N''esVisible''),(N''tblNavegaciones'',N''estadoNavegacion''),
    (N''tblPerfilesNavegaciones'',N''permiteVisualizar''),(N''tblPerfilesNavegaciones'',N''estadoPerfilNavegacion'')
  ) expected(tableName,columnName)
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_SCHEMA=N''Seguridad'' AND c.TABLE_NAME=expected.tableName AND c.COLUMN_NAME=expected.columnName
  WHERE c.COLUMN_DEFAULT IS NULL OR LOWER(REPLACE(REPLACE(REPLACE(c.COLUMN_DEFAULT,N''('',N''''),N'')'',N''''),N'' '',N''''))<>N''1''
) THROW 51106, N''Cambió un DEFAULT activo esperado; revise antes de aplicar.'', 1;
IF EXISTS (
  SELECT 1 FROM (VALUES
    (N''tblPermisos'',N''fechaRegistro''),(N''tblPerfilesPermisos'',N''fechaRegistro''),
    (N''tblNavegaciones'',N''fechaRegistro''),(N''tblPerfilesNavegaciones'',N''fechaRegistro'')
  ) expected(tableName,columnName)
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_SCHEMA=N''Seguridad'' AND c.TABLE_NAME=expected.tableName AND c.COLUMN_NAME=expected.columnName
  WHERE c.COLUMN_DEFAULT IS NULL OR LOWER(c.COLUMN_DEFAULT) NOT LIKE N''%sysdatetime%''
) THROW 51107, N''Cambió un DEFAULT de fechaRegistro esperado; revise antes de aplicar.'', 1;

/* Se muestra metadata real para revisión; son SELECT y no devuelven datos de usuarios. */
SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE,COLUMN_DEFAULT,ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA=N''Seguridad'' AND TABLE_NAME IN (N''tblPermisos'',N''tblPerfilesPermisos'',N''tblNavegaciones'',N''tblPerfilesNavegaciones'')
ORDER BY TABLE_NAME,ORDINAL_POSITION;
SELECT tc.TABLE_NAME,tc.CONSTRAINT_NAME,tc.CONSTRAINT_TYPE,kcu.COLUMN_NAME,kcu.ORDINAL_POSITION
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND kcu.CONSTRAINT_NAME=tc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA=tc.TABLE_SCHEMA AND kcu.TABLE_NAME=tc.TABLE_NAME
WHERE tc.TABLE_SCHEMA=N''Seguridad'' AND tc.TABLE_NAME IN (N''tblPermisos'',N''tblPerfilesPermisos'',N''tblNavegaciones'',N''tblPerfilesNavegaciones'')
ORDER BY tc.TABLE_NAME,tc.CONSTRAINT_NAME,kcu.ORDINAL_POSITION;
SELECT s.name AS schemaName,t.name AS tableName,i.name AS indexName,i.is_unique,i.is_primary_key,i.is_unique_constraint,i.type_desc
FROM sys.indexes i JOIN sys.tables t ON t.object_id=i.object_id JOIN sys.schemas s ON s.schema_id=t.schema_id
WHERE s.name=N''Seguridad'' AND t.name IN (N''tblPermisos'',N''tblPerfilesPermisos'',N''tblNavegaciones'',N''tblPerfilesNavegaciones'') AND i.index_id>0 AND i.is_hypothetical=0
ORDER BY t.name,i.name;

/* Preflight 2: códigos de nueve permisos/catálogo y rutas exactas de Vue. */
IF (SELECT COUNT(1) FROM @NuevosPermisos)<>9 THROW 51108, N''La propuesta debe contener exactamente nueve códigos.'', 1;
IF EXISTS (SELECT codigoPermiso FROM @NuevosPermisos GROUP BY codigoPermiso HAVING COUNT(1)>1)
  THROW 51109, N''Hay códigos duplicados en la propuesta.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevosPermisos propuesta
  JOIN Seguridad.tblPermisos existente ON existente.codigoPermiso=propuesta.codigoPermiso
  WHERE existente.moduloPermiso<>propuesta.moduloPermiso OR existente.estadoPermiso=0
) THROW 51110, N''Un código propuesto ya existe inactivo o con otro módulo; requiere revisión manual.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevosPermisos propuesta
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPermiso=(SELECT p.idPermiso FROM Seguridad.tblPermisos p WHERE p.codigoPermiso=propuesta.codigoPermiso)
  JOIN Seguridad.tblPerfiles perfil ON perfil.idPerfil=pp.idPerfil
  WHERE perfil.codigoPerfil<>N''ADMIN_GENERAL'' AND (pp.estadoPerfilPermiso=1 OR perfil.estadoPerfil=1)
) THROW 51111, N''Un permiso propuesto ya tiene asignaciones fuera del único perfil candidato; revisar privilegios.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevosPermisos propuesta
  JOIN Seguridad.tblPermisos permiso ON permiso.codigoPermiso=propuesta.codigoPermiso
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=(SELECT idPerfil FROM Seguridad.tblPerfiles WHERE codigoPerfil=N''ADMIN_GENERAL'') AND pp.idPermiso=permiso.idPermiso
  WHERE pp.estadoPerfilPermiso=0
) THROW 51142, N''Existe una relación inactiva ADMIN_GENERAL-permiso propuesto; revisar manualmente para no reactivar privilegios.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevasNavegaciones propuesta
  WHERE propuesta.enlaceNavegacion IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM @RutasVue ruta WHERE ruta.enlace=propuesta.enlaceNavegacion)
) THROW 51112, N''Una ruta propuesta no existe en el allowlist Vue verificado.'', 1;
IF EXISTS (SELECT enlaceNavegacion FROM @NuevasNavegaciones WHERE enlaceNavegacion IS NOT NULL GROUP BY enlaceNavegacion HAVING COUNT(1)>1)
  THROW 51113, N''La propuesta repite una ruta.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevasNavegaciones propuesta
  JOIN Seguridad.tblNavegaciones actual ON actual.enlaceNavegacion=propuesta.enlaceNavegacion
  WHERE propuesta.enlaceNavegacion IS NOT NULL AND actual.codigoNavegacion<>propuesta.codigoNavegacion
) THROW 51114, N''Una ruta propuesta ya pertenece a otro código de navegación.'', 1;
IF EXISTS (
  SELECT 1 FROM Seguridad.tblNavegaciones GROUP BY codigoNavegacion HAVING COUNT(1)>1
) OR EXISTS (
  SELECT 1 FROM Seguridad.tblNavegaciones WHERE enlaceNavegacion IS NOT NULL GROUP BY enlaceNavegacion HAVING COUNT(1)>1
) THROW 51115, N''Ya hay códigos/rutas duplicados en tblNavegaciones; resolver antes de aplicar.'', 1;
IF EXISTS (
  SELECT 1 FROM Seguridad.tblPerfilesNavegaciones GROUP BY idPerfil,idNavegacion HAVING COUNT(1)>1
) OR EXISTS (
  SELECT 1 FROM Seguridad.tblPerfilesPermisos GROUP BY idPerfil,idPermiso HAVING COUNT(1)>1
) THROW 51116, N''Hay relaciones duplicadas perfil-navegación/perfil-permiso; resolver antes de aplicar.'', 1;

SELECT @IdPerfilAdmin = idPerfil
FROM Seguridad.tblPerfiles
WHERE codigoPerfil=N''ADMIN_GENERAL'' AND estadoPerfil=1;
IF @IdPerfilAdmin IS NULL
  THROW 51117, N''ADMIN_GENERAL no existe o está inactivo.'', 1;
IF (SELECT COUNT(*) FROM Seguridad.tblPerfiles WHERE codigoPerfil=N''ADMIN_GENERAL'' AND estadoPerfil=1)<>1
  THROW 51143, N''ADMIN_GENERAL no se resuelve a un único perfil activo.'', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblPermisos WHERE codigoPermiso=N''ACCESOS_CONSULTAR'' AND estadoPermiso=1)
 OR NOT EXISTS (SELECT 1 FROM Seguridad.tblPermisos WHERE codigoPermiso=N''ACCESOS_HISTORIAL'' AND estadoPermiso=1)
  THROW 51118, N''Falta un permiso de lectura existente requerido para mantener la navegación actual.'', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N''ADMINISTRACION'' AND estadoNavegacion=1)
 OR NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N''ACCESOS'' AND estadoNavegacion=1)
  THROW 51119, N''Falta un grupo padre activo requerido.'', 1;
IF EXISTS (
  SELECT 1 FROM @NuevasNavegaciones child
  WHERE child.codigoPadre IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones currentParent WHERE currentParent.codigoNavegacion=child.codigoPadre AND currentParent.estadoNavegacion=1)
    AND NOT EXISTS (SELECT 1 FROM @NuevasNavegaciones proposedParent WHERE proposedParent.codigoNavegacion=child.codigoPadre)
) THROW 51127, N''Una navegación propuesta refiere a un padre inexistente/inactivo.'', 1;

/* La transformación de padres es declarativa y forma un bosque sin ciclos. */
DECLARE @ParentChanges TABLE (codigoNavegacion nvarchar(64) NOT NULL PRIMARY KEY,codigoPadreNuevo nvarchar(64) NULL);
INSERT INTO @ParentChanges VALUES
  (N''ACCESOS'',NULL),(N''BENEFICIARIOS'',N''OPERACION''),(N''TARJETAS'',N''OPERACION''),
  (N''ADMIN_USUARIOS'',N''SEGURIDAD''),(N''ADMIN_PERFILES'',N''SEGURIDAD''),(N''ADMIN_PERMISOS'',N''SEGURIDAD''),
  (N''ADMIN_CONFIGURACION'',N''ADMINISTRACION''),(N''ADMIN_AUDITORIA'',N''ADMINISTRACION'');
IF EXISTS (
  SELECT 1 FROM @ParentChanges c LEFT JOIN Seguridad.tblNavegaciones n ON n.codigoNavegacion=c.codigoNavegacion
  WHERE n.idNavegacion IS NULL
) THROW 51120, N''Falta una opción existente que la jerarquía v2 necesita reorganizar.'', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones n WHERE n.codigoNavegacion=N''ACCESOS'' AND n.enlaceNavegacion=N''/accesos'' AND n.idNavegacionPadre IS NULL AND n.tipoNavegacion=N''MODULO'')
 AND NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones n WHERE n.codigoNavegacion=N''ACCESOS'' AND n.enlaceNavegacion IS NULL AND n.idNavegacionPadre IS NULL AND n.tipoNavegacion=N''MODULO'')
  THROW 51121, N''ACCESOS ya no coincide con los valores previos/objetivo documentados.'', 1;
IF NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N''ADMINISTRACION'' AND enlaceNavegacion IS NULL AND idNavegacionPadre IS NULL AND estadoNavegacion=1 AND esVisible=1)
 OR NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N''ADMIN_CONFIGURACION'' AND enlaceNavegacion=N''/administracion/configuracion'' AND estadoNavegacion=1 AND esVisible=1)
 OR NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones WHERE codigoNavegacion=N''ADMIN_AUDITORIA'' AND enlaceNavegacion=N''/administracion/auditoria'' AND estadoNavegacion=1 AND esVisible=1)
  THROW 51134, N''El contenedor Administración o sus secciones Configuración/Auditoría difieren del estado verificado.'', 1;
IF EXISTS (
  SELECT 1 FROM (VALUES (N''BENEFICIARIOS'',N''/beneficiarios'',N''OPERACION''),(N''TARJETAS'',N''/tarjetas'',N''OPERACION'')) expected(code,link,parentCode)
  JOIN Seguridad.tblNavegaciones n ON n.codigoNavegacion=expected.code
  LEFT JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=n.idNavegacionPadre
  WHERE n.enlaceNavegacion<>expected.link OR (n.idNavegacionPadre IS NOT NULL AND ISNULL(parent.codigoNavegacion,N'''')<>N''OPERACION'')
) THROW 51128, N''BENEFICIARIOS/TARJETAS tienen rutas/padres inesperados.'', 1;
IF EXISTS (
  SELECT 1 FROM (VALUES
  (N''ADMIN_USUARIOS'',N''/administracion/usuarios''),
    (N''ADMIN_PERFILES'',N''/administracion/perfiles''),
    (N''ADMIN_PERMISOS'',N''/administracion/permisos'')) expected(code,link)
  LEFT JOIN Seguridad.tblNavegaciones n ON n.codigoNavegacion=expected.code
  LEFT JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=n.idNavegacionPadre
  WHERE n.idNavegacion IS NULL OR n.enlaceNavegacion<>expected.link
    OR ISNULL(parent.codigoNavegacion,N'''') NOT IN (N''ADMINISTRACION'',N''SEGURIDAD'')
) THROW 51129, N''Las opciones de Seguridad tienen ruta o padre inesperado.'', 1;
IF EXISTS (
  SELECT 1 FROM (VALUES (N''ADMIN_CONFIGURACION'',N''/administracion/configuracion''),(N''ADMIN_AUDITORIA'',N''/administracion/auditoria'')) expected(code,link)
  JOIN Seguridad.tblNavegaciones n ON n.codigoNavegacion=expected.code
  LEFT JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=n.idNavegacionPadre
  WHERE n.enlaceNavegacion<>expected.link OR ISNULL(parent.codigoNavegacion,N'''')<>N''ADMINISTRACION''
) THROW 51137, N''Configuración/Auditoría tienen ruta o padre inesperado.'', 1;

/* Validar el árbol objetivo completo en memoria antes de abrir la transacción. */
DECLARE @ParentPlan TABLE (codigoNavegacion nvarchar(64) NOT NULL PRIMARY KEY,codigoPadre nvarchar(64) NULL);
INSERT INTO @ParentPlan(codigoNavegacion,codigoPadre)
SELECT n.codigoNavegacion,parent.codigoNavegacion
FROM Seguridad.tblNavegaciones n LEFT JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=n.idNavegacionPadre;
UPDATE navPlan SET codigoPadre=propuesta.codigoPadre
FROM @ParentPlan navPlan JOIN @NuevasNavegaciones propuesta ON propuesta.codigoNavegacion=navPlan.codigoNavegacion;
INSERT INTO @ParentPlan(codigoNavegacion,codigoPadre)
SELECT propuesta.codigoNavegacion,propuesta.codigoPadre FROM @NuevasNavegaciones propuesta
WHERE NOT EXISTS (SELECT 1 FROM @ParentPlan currentPlan WHERE currentPlan.codigoNavegacion=propuesta.codigoNavegacion);
UPDATE navPlan SET codigoPadre=changePlan.codigoPadreNuevo
FROM @ParentPlan navPlan JOIN @ParentChanges changePlan ON changePlan.codigoNavegacion=navPlan.codigoNavegacion;
IF EXISTS (SELECT 1 FROM @ParentPlan child WHERE child.codigoPadre IS NOT NULL AND NOT EXISTS (SELECT 1 FROM @ParentPlan parent WHERE parent.codigoNavegacion=child.codigoPadre))
  THROW 51130, N''El árbol propuesto contiene un padre no resuelto.'', 1;
IF EXISTS (SELECT 1 FROM @ParentPlan WHERE codigoNavegacion=codigoPadre)
  THROW 51131, N''El árbol propuesto contiene un autoreferenciado.'', 1;
DECLARE @Ciclos int=0;
;WITH ParentWalk AS (
  SELECT codigoNavegacion AS inicio,codigoNavegacion,codigoPadre,CAST(N''|'' + codigoNavegacion + N''|'' AS nvarchar(max)) AS ruta,CAST(0 AS bit) AS ciclo,0 AS profundidad
  FROM @ParentPlan
  UNION ALL
  SELECT walk.inicio,parent.codigoNavegacion,parent.codigoPadre,CAST(walk.ruta+parent.codigoNavegacion+N''|'' AS nvarchar(max)),
    CAST(CASE WHEN CHARINDEX(N''|''+parent.codigoNavegacion+N''|'',walk.ruta)>0 THEN 1 ELSE 0 END AS bit),walk.profundidad+1
  FROM ParentWalk walk JOIN @ParentPlan parent ON parent.codigoNavegacion=walk.codigoPadre
  WHERE walk.codigoPadre IS NOT NULL AND walk.ciclo=0 AND walk.profundidad<100
)
SELECT @Ciclos=COUNT(1) FROM ParentWalk WHERE ciclo=1 OPTION(MAXRECURSION 100);
IF @Ciclos>0 THROW 51132, N''El árbol propuesto contiene un ciclo.'', 1;
IF EXISTS (SELECT codigoPermiso FROM @NuevosPermisos GROUP BY codigoPermiso HAVING COUNT(1)>1)
 OR EXISTS (SELECT codigoNavegacion FROM @NuevasNavegaciones GROUP BY codigoNavegacion HAVING COUNT(1)>1)
  THROW 51135, N''La propuesta repite códigos de permiso o navegación.'', 1;
IF EXISTS (SELECT codigoPermiso FROM Seguridad.tblPermisos GROUP BY codigoPermiso HAVING COUNT(1)>1)
  THROW 51138, N''La base contiene códigos de permiso duplicados; no aplique.'', 1;

IF EXISTS (
  SELECT 1 FROM @NuevasNavegaciones proposed
  JOIN Seguridad.tblNavegaciones currentNav ON currentNav.codigoNavegacion=proposed.codigoNavegacion
  LEFT JOIN Seguridad.tblNavegaciones parent ON parent.idNavegacion=currentNav.idNavegacionPadre
  WHERE currentNav.nombreNavegacion<>proposed.nombreNavegacion OR currentNav.tituloNavegacion<>proposed.tituloNavegacion
    OR currentNav.tipoNavegacion<>proposed.tipoNavegacion
    OR ISNULL(currentNav.enlaceNavegacion,N'''')<>ISNULL(proposed.enlaceNavegacion,N'''')
    OR ISNULL(parent.codigoNavegacion,N'''')<>ISNULL(proposed.codigoPadre,N'''')
    OR currentNav.ordenNavegacion<>proposed.ordenNavegacion OR currentNav.estadoNavegacion=0 OR currentNav.esVisible=0
) THROW 51133, N''Un código de navegación propuesto existe con contenido/estado distinto; revisión manual requerida.'', 1;

/* Muestra el impacto actual. REPORTES, SOPORTE y MI_CUENTA quedan intactos en v2. */
SELECT codigoNavegacion,tituloNavegacion,enlaceNavegacion,idNavegacionPadre,estadoNavegacion,esVisible
FROM Seguridad.tblNavegaciones
WHERE codigoNavegacion IN (N''ACCESOS'',N''BENEFICIARIOS'',N''TARJETAS'',N''ADMINISTRACION'',N''ADMIN_USUARIOS'',N''ADMIN_PERFILES'',N''ADMIN_PERMISOS'',N''ADMIN_CONFIGURACION'',N''ADMIN_AUDITORIA'',N''REPORTES'',N''SOPORTE'',N''MI_CUENTA'',N''MI_INFORMACION'',N''MI_TARJETA'')
ORDER BY idNavegacionPadre,ordenNavegacion,idNavegacion;
SELECT p.codigoPerfil,n.codigoNavegacion,n.enlaceNavegacion,n.idNavegacionPadre,pn.permiteVisualizar,pn.estadoPerfilNavegacion
FROM Seguridad.tblPerfiles p
JOIN Seguridad.tblPerfilesNavegaciones pn ON pn.idPerfil=p.idPerfil
JOIN Seguridad.tblNavegaciones n ON n.idNavegacion=pn.idNavegacion
WHERE p.estadoPerfil=1 AND n.codigoNavegacion IN (N''ACCESOS'',N''ADMINISTRACION'',N''ADMIN_USUARIOS'',N''ADMIN_PERFILES'',N''ADMIN_PERMISOS'',N''ADMIN_CONFIGURACION'',N''ADMIN_AUDITORIA'')
ORDER BY p.codigoPerfil,n.codigoNavegacion;
SELECT p.codigoPerfil,pe.codigoPermiso,pp.estadoPerfilPermiso,pe.estadoPermiso
FROM Seguridad.tblPerfilesPermisos pp
JOIN Seguridad.tblPerfiles p ON p.idPerfil=pp.idPerfil
JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso
WHERE p.estadoPerfil=1 AND pe.codigoPermiso IN (N''ACCESOS_CONSULTAR'',N''ACCESOS_HISTORIAL'',N''PERFILES_ADMINISTRAR'',N''PERMISOS_ADMINISTRAR'',N''USUARIOS_ADMINISTRAR'')
ORDER BY p.codigoPerfil,pe.codigoPermiso;

/* Approval guard is after SELECT-only preflight and before any database DML. */
IF @AprobadoParaAplicar <> 1
  THROW 51122, N''Preflight completado sin escrituras. Revisión/aprobación explícita requerida.'', 1;
IF @AprobadoCambiarEnlaceAccesos <> 1
  THROW 51139, N''Cambiar el enlace existente ACCESOS a NULL requiere aprobación específica.'', 1;
IF @AprobadoJerarquiaOperacion <> 1
  THROW 51140, N''Reubicar Beneficiarios/Tarjetas bajo Operación requiere aprobación específica.'', 1;
IF @AprobadoJerarquiaSeguridad <> 1
  THROW 51141, N''Reubicar Usuarios/Perfiles/Permisos bajo Seguridad requiere aprobación específica.'', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  /* Insert missing permission catalog rows; never overwrite existing metadata. */
  INSERT INTO Seguridad.tblPermisos (codigoPermiso,nombrePermiso,descripcionPermiso,moduloPermiso,estadoPermiso,usuarioRegistro)
  SELECT p.codigoPermiso,p.nombrePermiso,p.descripcionPermiso,p.moduloPermiso,1,@UsuarioRevision
  FROM @NuevosPermisos p
  WHERE NOT EXISTS (SELECT 1 FROM Seguridad.tblPermisos actual WHERE actual.codigoPermiso=p.codigoPermiso);

  /* Revalidar perfil dentro de transacción; evitar asignación a perfil alterado. */
  IF NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfiles WITH (UPDLOCK, HOLDLOCK)
                 WHERE idPerfil=@IdPerfilAdmin AND codigoPerfil=N''ADMIN_GENERAL'' AND estadoPerfil=1)
    THROW 51203, N''ADMIN_GENERAL cambió durante la ejecución.'', 1;

  /* Grant the proposed operation codes only to the explicitly reviewed Admin General profile. */
  INSERT INTO Seguridad.tblPerfilesPermisos (idPerfil,idPermiso,estadoPerfilPermiso,usuarioRegistro)
  SELECT @IdPerfilAdmin,p.idPermiso,1,@UsuarioRevision
  FROM @NuevosPermisos propuesta
  JOIN Seguridad.tblPermisos p ON p.codigoPermiso=propuesta.codigoPermiso AND p.estadoPermiso=1
  WHERE NOT EXISTS (SELECT 1 FROM Seguridad.tblPerfilesPermisos old WHERE old.idPerfil=@IdPerfilAdmin AND old.idPermiso=p.idPermiso);

  /* Insert roots/groups first so child FKs resolve regardless of SELECT row order. */
  INSERT INTO Seguridad.tblNavegaciones
    (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
  SELECT n.codigoNavegacion,n.nombreNavegacion,n.tituloNavegacion,n.descripcionNavegacion,n.tipoNavegacion,n.enlaceNavegacion,n.ordenNavegacion,p.idNavegacion,1,1,@UsuarioRevision
  FROM @NuevasNavegaciones n
  LEFT JOIN Seguridad.tblNavegaciones p ON p.codigoNavegacion=n.codigoPadre
  WHERE n.codigoNavegacion IN (N''OPERACION'',N''SEGURIDAD'',N''MONITOREO'')
    AND NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones old WHERE old.codigoNavegacion=n.codigoNavegacion);

  /* Insert leaves after their proposed parent groups exist. */
  INSERT INTO Seguridad.tblNavegaciones
    (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
  SELECT n.codigoNavegacion,n.nombreNavegacion,n.tituloNavegacion,n.descripcionNavegacion,n.tipoNavegacion,n.enlaceNavegacion,n.ordenNavegacion,p.idNavegacion,1,1,@UsuarioRevision
  FROM @NuevasNavegaciones n
  LEFT JOIN Seguridad.tblNavegaciones p ON p.codigoNavegacion=n.codigoPadre
  WHERE n.codigoNavegacion NOT IN (N''OPERACION'',N''SEGURIDAD'',N''MONITOREO'')
    AND NOT EXISTS (SELECT 1 FROM Seguridad.tblNavegaciones old WHERE old.codigoNavegacion=n.codigoNavegacion);

  /* Explicitly documented existing hierarchy/link updates; invalid unrelated links are untouched. */
  UPDATE n SET enlaceNavegacion=NULL,tipoNavegacion=N''MODULO'',usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  FROM Seguridad.tblNavegaciones n
  WHERE n.codigoNavegacion=N''ACCESOS'' AND n.enlaceNavegacion=N''/accesos'';

  UPDATE n SET idNavegacionPadre=parent.idNavegacion,
    ordenNavegacion=CASE n.codigoNavegacion WHEN N''BENEFICIARIOS'' THEN 1 ELSE 3 END,
    usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  FROM Seguridad.tblNavegaciones n CROSS JOIN Seguridad.tblNavegaciones parent
  WHERE n.codigoNavegacion IN (N''BENEFICIARIOS'',N''TARJETAS'') AND parent.codigoNavegacion=N''OPERACION''
    AND (n.idNavegacionPadre IS NULL OR n.idNavegacionPadre<>parent.idNavegacion);

  UPDATE n SET idNavegacionPadre=parent.idNavegacion,
    usuarioActualizacion=@UsuarioRevision,fechaActualizacion=SYSDATETIME()
  FROM Seguridad.tblNavegaciones n CROSS JOIN Seguridad.tblNavegaciones parent
  WHERE n.codigoNavegacion IN (N''ADMIN_USUARIOS'',N''ADMIN_PERFILES'',N''ADMIN_PERMISOS'')
    AND parent.codigoNavegacion=N''SEGURIDAD'' AND (n.idNavegacionPadre IS NULL OR n.idNavegacionPadre<>parent.idNavegacion);

  /* Build only missing profile-menu links. Existing inactive links are deliberately not reactivated. */
  DECLARE @RelacionesMenu TABLE (idPerfil int NOT NULL,idNavegacion int NOT NULL,PRIMARY KEY(idPerfil,idNavegacion));
  INSERT INTO @RelacionesMenu (idPerfil,idNavegacion)
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesNavegaciones child ON child.idPerfil=p.idPerfil AND child.estadoPerfilNavegacion=1 AND child.permiteVisualizar=1
  JOIN Seguridad.tblNavegaciones childNav ON childNav.idNavegacion=child.idNavegacion AND childNav.codigoNavegacion IN (N''BENEFICIARIOS'',N''TARJETAS'')
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=N''OPERACION''
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesNavegaciones child ON child.idPerfil=p.idPerfil AND child.estadoPerfilNavegacion=1 AND child.permiteVisualizar=1
   JOIN Seguridad.tblNavegaciones childNav ON childNav.idNavegacion=child.idNavegacion AND childNav.codigoNavegacion IN (N''ADMIN_USUARIOS'',N''ADMIN_PERFILES'',N''ADMIN_PERMISOS'',N''ADMIN_NAVEGACIONES'')
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=N''SEGURIDAD''
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
  JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N''ACCESOS_CONSULTAR'' AND pe.estadoPermiso=1
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion IN (N''ACCESOS'',N''CAMPUS'',N''EDIFICIOS'',N''ELEVADORES'',N''DISPOSITIVOS'')
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
  JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N''ACCESOS_HISTORIAL'' AND pe.estadoPermiso=1
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=N''MONITOREO''
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
  JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N''SOLICITUDES_CONSULTAR'' AND pe.estadoPermiso=1
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion IN (N''OPERACION'',N''SOLICITUDES'')
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
  JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N''NAVEGACION_ADMINISTRAR'' AND pe.estadoPermiso=1
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=N''ADMIN_NAVEGACIONES''
  WHERE p.estadoPerfil=1
  UNION
  SELECT DISTINCT p.idPerfil,nav.idNavegacion
  FROM Seguridad.tblPerfiles p
  JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
  JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.codigoPermiso=N''NAVEGACION_ADMINISTRAR'' AND pe.estadoPermiso=1
  JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=N''SEGURIDAD''
  WHERE p.estadoPerfil=1;

  INSERT INTO Seguridad.tblPerfilesNavegaciones (idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
  SELECT rel.idPerfil,rel.idNavegacion,1,1,@UsuarioRevision
  FROM @RelacionesMenu rel
  WHERE NOT EXISTS (
    SELECT 1 FROM Seguridad.tblPerfilesNavegaciones old
    WHERE old.idPerfil=rel.idPerfil AND old.idNavegacion=rel.idNavegacion
  );

  /* Postconditions inside the transaction; any mismatch rolls back. */
  IF EXISTS (SELECT 1 FROM @NuevosPermisos p LEFT JOIN Seguridad.tblPermisos dbp ON dbp.codigoPermiso=p.codigoPermiso WHERE dbp.idPermiso IS NULL OR dbp.estadoPermiso=0)
    THROW 51200, N''No quedaron provisionados todos los permisos propuestos.'', 1;
  IF EXISTS (
    SELECT 1 FROM @NuevosPermisos propuesta
    JOIN Seguridad.tblPermisos permiso ON permiso.codigoPermiso=propuesta.codigoPermiso
    LEFT JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=@IdPerfilAdmin AND pp.idPermiso=permiso.idPermiso
    WHERE pp.idPerfil IS NULL OR pp.estadoPerfilPermiso<>1
  ) THROW 51204, N''No quedaron activos los nueve permisos en ADMIN_GENERAL.'', 1;
  IF EXISTS (SELECT 1 FROM @NuevasNavegaciones p LEFT JOIN Seguridad.tblNavegaciones dbn ON dbn.codigoNavegacion=p.codigoNavegacion WHERE dbn.idNavegacion IS NULL OR dbn.estadoNavegacion=0 OR dbn.esVisible=0)
    THROW 51201, N''No quedaron activas/visibles todas las navegaciones propuestas.'', 1;
  /* Relaciones preexistentes inactivas: no reactivar sin aprobación, pero tampoco aprobar un menú incompleto. */
  IF EXISTS (
    SELECT 1 FROM @RelacionesMenu r
    LEFT JOIN Seguridad.tblPerfilesNavegaciones pn
      ON pn.idPerfil=r.idPerfil AND pn.idNavegacion=r.idNavegacion
    WHERE pn.idPerfil IS NULL OR pn.estadoPerfilNavegacion<>1 OR pn.permiteVisualizar<>1
  ) THROW 51202, N''Hay relaciones de navegación ausentes o inactivas; requieren revisión explícita.'', 1;

  IF EXISTS (
    SELECT 1 FROM (VALUES
      (N''ADMIN_CONFIGURACION'',N''ADMINISTRACION''),
      (N''ADMIN_AUDITORIA'',N''ADMINISTRACION''),
      (N''ADMIN_USUARIOS'',N''SEGURIDAD''),
      (N''ADMIN_PERFILES'',N''SEGURIDAD''),
      (N''ADMIN_PERMISOS'',N''SEGURIDAD''),
      (N''ADMIN_NAVEGACIONES'',N''SEGURIDAD''),
      (N''BENEFICIARIOS'',N''OPERACION''),
      (N''TARJETAS'',N''OPERACION''),
      (N''SOLICITUDES'',N''OPERACION'')
    ) objetivo(codigo, padreCodigo)
    LEFT JOIN Seguridad.tblNavegaciones nav ON nav.codigoNavegacion=objetivo.codigo
    LEFT JOIN Seguridad.tblNavegaciones padre ON padre.idNavegacion=nav.idNavegacionPadre
    WHERE nav.idNavegacion IS NULL OR ISNULL(padre.codigoNavegacion,N'''')<>objetivo.padreCodigo
  ) THROW 51205, N''La jerarquía final difiere de la aprobada.'', 1;


  /* Revisión del resultado dentro de la transacción antes del ROLLBACK por defecto. */
  SELECT codigoPermiso,moduloPermiso,estadoPermiso FROM Seguridad.tblPermisos
  WHERE codigoPermiso IN (SELECT codigoPermiso FROM @NuevosPermisos) ORDER BY codigoPermiso;
  SELECT p.codigoPerfil,n.codigoNavegacion,n.enlaceNavegacion,n.idNavegacionPadre
  FROM Seguridad.tblPerfilesNavegaciones pn JOIN Seguridad.tblPerfiles p ON p.idPerfil=pn.idPerfil
  JOIN Seguridad.tblNavegaciones n ON n.idNavegacion=pn.idNavegacion
  WHERE (p.codigoPerfil=N''ADMIN_GENERAL'' AND n.codigoNavegacion IN (SELECT codigoNavegacion FROM @NuevasNavegaciones))
     OR n.codigoNavegacion IN (N''OPERACION'',N''SEGURIDAD'',N''ACCESOS'')
  ORDER BY p.codigoPerfil,n.idNavegacion;

  ROLLBACK TRANSACTION; -- Seguro por defecto; solo DBA cambia a COMMIT tras aprobación final.
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
';
