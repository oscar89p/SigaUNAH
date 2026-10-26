/* SIGA UNAH — Navegación de Configuración
   Ejecutar en DbSigaUNAH con DBeaver: seleccionar TODO y ejecutar como una sola sentencia.
   @Aplicar = 0: ENSAYO (ROLLBACK); @Aplicar = 1: CONFIRMAR (COMMIT).
   No altera datos operativos, permisos RBAC ni registros académicos.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0; -- CAMBIAR A 1 SOLO DESPUÉS DE VALIDAR EL ENSAYO
DECLARE @idConfiguracion int;
DECLARE @usuario nvarchar(128) = N'script-configuracion';

BEGIN TRY
    IF DB_NAME() <> N'DbSigaUNAH'
        THROW 51149, N'Base incorrecta: debe conectarse a DbSigaUNAH.', 1;

    IF OBJECT_ID(N'Seguridad.tblNavegaciones', N'U') IS NULL
       OR OBJECT_ID(N'Seguridad.tblPerfilesNavegaciones', N'U') IS NULL
       OR OBJECT_ID(N'Seguridad.tblPerfiles', N'U') IS NULL
        THROW 51148, N'Faltan tablas de Seguridad requeridas.', 1;

    IF (SELECT COUNT(*) FROM Seguridad.tblNavegaciones
        WHERE codigoNavegacion = N'ADMIN_CONFIGURACION') <> 1
        THROW 51150, N'Debe existir exactamente una navegación ADMIN_CONFIGURACION.', 1;

    SELECT @idConfiguracion = idNavegacion
    FROM Seguridad.tblNavegaciones
    WHERE codigoNavegacion = N'ADMIN_CONFIGURACION' AND estadoNavegacion = 1;

    IF @idConfiguracion IS NULL
        THROW 51151, N'La navegación ADMIN_CONFIGURACION está inactiva.', 1;

    BEGIN TRANSACTION;

    /* El contenedor mantiene su visibilidad, estado y permisos actuales. */
    UPDATE Seguridad.tblNavegaciones
       SET enlaceNavegacion = NULL,
           usuarioActualizacion = @usuario,
           fechaActualizacion = SYSDATETIME()
     WHERE idNavegacion = @idConfiguracion
       AND enlaceNavegacion IS NOT NULL;

    /* Declaración de las tres opciones esperadas. */
    DECLARE @Opciones TABLE (
        codigo nvarchar(64) PRIMARY KEY,
        nombre nvarchar(128) NOT NULL,
        descripcion nvarchar(512) NOT NULL,
        enlace nvarchar(512) NOT NULL,
        orden int NOT NULL
    );

    INSERT INTO @Opciones (codigo, nombre, descripcion, enlace, orden)
    VALUES
    (N'ADMIN_PARAMETROS', N'Parámetros', N'Administración de parámetros institucionales.', N'/administracion/configuracion/parametros', 10),
    (N'ADMIN_CATALOGOS', N'Catálogos', N'Administración de catálogos institucionales.', N'/administracion/configuracion/catalogos', 20),
    (N'ADMIN_PERIODOS_ACADEMICOS', N'Períodos académicos', N'Administración de períodos académicos institucionales.', N'/administracion/configuracion/periodos-academicos', 30);

    /* Evitar cambios sobre opciones existentes inactivas: requieren revisión explícita. */
    IF EXISTS (
        SELECT 1 FROM Seguridad.tblNavegaciones n
        JOIN @Opciones o ON o.codigo = n.codigoNavegacion
        WHERE n.estadoNavegacion = 0 OR n.esVisible = 0
    )
        THROW 51152, N'Hay opciones hijas existentes inactivas u ocultas. Revisarlas antes de continuar.', 1;

    /* Actualizar únicamente datos de navegación de opciones activas existentes. */
    UPDATE n
       SET n.nombreNavegacion = o.nombre,
           n.tituloNavegacion = o.nombre,
           n.descripcionNavegacion = o.descripcion,
           n.tipoNavegacion = N'OPCION',
           n.enlaceNavegacion = o.enlace,
           n.ordenNavegacion = o.orden,
           n.idNavegacionPadre = @idConfiguracion,
           n.usuarioActualizacion = @usuario,
           n.fechaActualizacion = SYSDATETIME()
    FROM Seguridad.tblNavegaciones n
    JOIN @Opciones o ON o.codigo = n.codigoNavegacion
    WHERE n.estadoNavegacion = 1 AND n.esVisible = 1
      AND (ISNULL(n.nombreNavegacion,N'') <> o.nombre
        OR ISNULL(n.tituloNavegacion,N'') <> o.nombre
        OR ISNULL(n.descripcionNavegacion,N'') <> o.descripcion
        OR ISNULL(n.tipoNavegacion,N'') <> N'OPCION'
        OR ISNULL(n.enlaceNavegacion,N'') <> o.enlace
        OR n.ordenNavegacion <> o.orden
        OR n.idNavegacionPadre IS NULL OR n.idNavegacionPadre <> @idConfiguracion);

    INSERT INTO Seguridad.tblNavegaciones
        (codigoNavegacion, nombreNavegacion, tituloNavegacion, descripcionNavegacion,
         tipoNavegacion, enlaceNavegacion, ordenNavegacion, idNavegacionPadre,
         esVisible, usuarioRegistro)
    SELECT o.codigo, o.nombre, o.nombre, o.descripcion, N'OPCION', o.enlace,
           o.orden, @idConfiguracion, 1, @usuario
    FROM @Opciones o
    WHERE NOT EXISTS (
        SELECT 1 FROM Seguridad.tblNavegaciones n
        WHERE n.codigoNavegacion = o.codigo
    );

    /* Heredar acceso SOLO de perfiles con acceso activo y visible al contenedor.
       Respetar asignaciones existentes, incluso las denegadas/inactivas. */
    INSERT INTO Seguridad.tblPerfilesNavegaciones
        (idPerfil, idNavegacion, permiteVisualizar, estadoPerfilNavegacion, usuarioRegistro)
    SELECT parentAssignment.idPerfil, child.idNavegacion, 1, 1, @usuario
    FROM Seguridad.tblPerfilesNavegaciones parentAssignment
    JOIN Seguridad.tblNavegaciones child
      ON child.idNavegacionPadre = @idConfiguracion
     AND child.codigoNavegacion IN (SELECT codigo FROM @Opciones)
    WHERE parentAssignment.idNavegacion = @idConfiguracion
      AND parentAssignment.estadoPerfilNavegacion = 1
      AND parentAssignment.permiteVisualizar = 1
      AND NOT EXISTS (
          SELECT 1 FROM Seguridad.tblPerfilesNavegaciones existing
          WHERE existing.idPerfil = parentAssignment.idPerfil
            AND existing.idNavegacion = child.idNavegacion
      );

    /* Evidencia del estado resultante, también visible durante el ensayo. */
    SELECT n.codigoNavegacion, n.nombreNavegacion, n.tipoNavegacion,
           n.enlaceNavegacion, padre.codigoNavegacion AS codigoPadre,
           n.ordenNavegacion, n.estadoNavegacion, n.esVisible
    FROM Seguridad.tblNavegaciones n
    LEFT JOIN Seguridad.tblNavegaciones padre ON padre.idNavegacion = n.idNavegacionPadre
    WHERE n.codigoNavegacion IN (N'ADMIN_CONFIGURACION',N'ADMIN_PARAMETROS',
                                 N'ADMIN_CATALOGOS',N'ADMIN_PERIODOS_ACADEMICOS')
    ORDER BY n.idNavegacionPadre, n.ordenNavegacion;

    SELECT p.codigoPerfil, n.codigoNavegacion,
           pn.estadoPerfilNavegacion, pn.permiteVisualizar
    FROM Seguridad.tblPerfilesNavegaciones pn
    JOIN Seguridad.tblPerfiles p ON p.idPerfil = pn.idPerfil
    JOIN Seguridad.tblNavegaciones n ON n.idNavegacion = pn.idNavegacion
    WHERE n.codigoNavegacion IN (N'ADMIN_CONFIGURACION',N'ADMIN_PARAMETROS',
                                 N'ADMIN_CATALOGOS',N'ADMIN_PERIODOS_ACADEMICOS')
    ORDER BY p.codigoPerfil, n.codigoNavegacion;

    IF @Aplicar = 1
    BEGIN
        COMMIT TRANSACTION;
        SELECT N'APLICADO: COMMIT confirmado' AS resultado, DB_NAME() AS baseDatos;
    END
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT N'ENSAYO: ROLLBACK; no se guardaron cambios' AS resultado, DB_NAME() AS baseDatos;
    END;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

/* Verificación académica no invasiva: confirmar existencia, sin suponer columnas. */
SELECT CASE WHEN OBJECT_ID(N'Academico.tblPeriodosAcademicos',N'U') IS NULL
            THEN N'NO EXISTE' ELSE N'EXISTE' END AS tablaPeriodosAcademicos;
