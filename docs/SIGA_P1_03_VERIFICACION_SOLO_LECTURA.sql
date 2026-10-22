/* SIGA UNAH P1 - verificación de permisos y menú. SOLO SELECT; no modifica datos. */
SET NOCOUNT ON;
IF DB_NAME() <> N'DbSigaUNAH'
  THROW 51300, N'Conectarse a DbSigaUNAH antes de verificar.', 1;

DECLARE @Esperados TABLE (codigo nvarchar(80) PRIMARY KEY);
INSERT INTO @Esperados(codigo) VALUES
 (N'CAMPUS_ADMINISTRAR'),(N'EDIFICIOS_ADMINISTRAR'),(N'ELEVADORES_ADMINISTRAR'),
 (N'DISPOSITIVOS_ADMINISTRAR'),(N'SOLICITUDES_CONSULTAR'),(N'SOLICITUDES_REGISTRAR'),
 (N'SOLICITUDES_MODIFICAR'),(N'SOLICITUDES_GESTIONAR'),(N'NAVEGACION_ADMINISTRAR');

/* 1. Deben existir nueve permisos activos y asignados a ADMIN_GENERAL. */
SELECT e.codigo AS permisoEsperado,
       pe.idPermiso, pe.estadoPermiso,
       p.codigoPerfil, p.estadoPerfil,
       pp.estadoPerfilPermiso,
       CASE WHEN pe.estadoPermiso=1 AND p.estadoPerfil=1 AND pp.estadoPerfilPermiso=1
            THEN N'OK' ELSE N'PENDIENTE' END AS resultado
FROM @Esperados e
LEFT JOIN Seguridad.tblPermisos pe ON pe.codigoPermiso=e.codigo
LEFT JOIN Seguridad.tblPerfiles p ON p.codigoPerfil=N'ADMIN_GENERAL'
LEFT JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.idPermiso=pe.idPermiso
ORDER BY e.codigo;

/* 2. Jerarquía y visibilidad efectivas de los módulos P1. */
SELECT nav.codigoNavegacion,
       padre.codigoNavegacion AS codigoPadre,
       nav.tipoNavegacion,nav.enlaceNavegacion,
       nav.esVisible,nav.estadoNavegacion
FROM Seguridad.tblNavegaciones nav
LEFT JOIN Seguridad.tblNavegaciones padre ON padre.idNavegacion=nav.idNavegacionPadre
WHERE nav.codigoNavegacion IN (
 N'OPERACION',N'SEGURIDAD',N'ACCESOS',N'ADMINISTRACION',N'MONITOREO',
 N'BENEFICIARIOS',N'SOLICITUDES',N'TARJETAS',N'CAMPUS',N'EDIFICIOS',N'ELEVADORES',N'DISPOSITIVOS',
 N'ADMIN_USUARIOS',N'ADMIN_PERFILES',N'ADMIN_PERMISOS',N'ADMIN_NAVEGACIONES',N'ADMIN_CONFIGURACION',N'ADMIN_AUDITORIA')
ORDER BY padre.codigoNavegacion,nav.ordenNavegacion;

/* 3. Enlaces de menú de ADMIN_GENERAL, incluyendo relaciones inactivas. */
SELECT p.codigoPerfil,nav.codigoNavegacion,nav.enlaceNavegacion,
       pn.permiteVisualizar,pn.estadoPerfilNavegacion,nav.esVisible,nav.estadoNavegacion
FROM Seguridad.tblPerfiles p
JOIN Seguridad.tblPerfilesNavegaciones pn ON pn.idPerfil=p.idPerfil
JOIN Seguridad.tblNavegaciones nav ON nav.idNavegacion=pn.idNavegacion
WHERE p.codigoPerfil=N'ADMIN_GENERAL'
ORDER BY nav.codigoNavegacion;

/* 4. Opciones existentes que NO deben ocultarse ni desactivarse por el paquete P1. */
SELECT codigoNavegacion,enlaceNavegacion,esVisible,estadoNavegacion
FROM Seguridad.tblNavegaciones
WHERE codigoNavegacion IN (N'REPORTES',N'SOPORTE',N'MI_CUENTA',N'MI_INFORMACION',N'MI_TARJETA')
ORDER BY codigoNavegacion;
