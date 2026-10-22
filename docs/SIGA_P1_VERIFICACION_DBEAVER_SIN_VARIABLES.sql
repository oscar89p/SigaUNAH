/* SIGA UNAH P1 — CONSULTAS INDEPENDIENTES DE SOLO LECTURA.
   En DBeaver: conectar explícitamente a DbSigaUNAH.
   Ejecutar cada SELECT por separado (Ctrl+Enter). No usa variables ni GO.
   No ejecuta DML ni modifica registros. */

/* CONSULTA 1: los nueve permisos esperados, incluso si no existen. */
SELECT esperado.codigoPermiso,
       pe.idPermiso, pe.estadoPermiso,
       p.codigoPerfil, p.estadoPerfil,
       pp.estadoPerfilPermiso,
       CASE WHEN pe.idPermiso IS NOT NULL AND pe.estadoPermiso=1
                  AND p.estadoPerfil=1 AND pp.estadoPerfilPermiso=1
            THEN N'OK' ELSE N'PENDIENTE' END AS resultado
FROM (VALUES
 (N'CAMPUS_ADMINISTRAR'),(N'EDIFICIOS_ADMINISTRAR'),(N'ELEVADORES_ADMINISTRAR'),
 (N'DISPOSITIVOS_ADMINISTRAR'),(N'SOLICITUDES_CONSULTAR'),(N'SOLICITUDES_REGISTRAR'),
 (N'SOLICITUDES_MODIFICAR'),(N'SOLICITUDES_GESTIONAR'),(N'NAVEGACION_ADMINISTRAR')
) AS esperado(codigoPermiso)
LEFT JOIN Seguridad.tblPermisos pe ON pe.codigoPermiso=esperado.codigoPermiso
LEFT JOIN Seguridad.tblPerfiles p ON p.codigoPerfil=N'ADMIN_GENERAL'
LEFT JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.idPermiso=pe.idPermiso
ORDER BY esperado.codigoPermiso;

/* CONSULTA 2: jerarquía real y visibilidad. */
SELECT nav.codigoNavegacion,padre.codigoNavegacion AS codigoPadre,
       nav.tipoNavegacion,nav.enlaceNavegacion,
       nav.esVisible,nav.estadoNavegacion
FROM Seguridad.tblNavegaciones nav
LEFT JOIN Seguridad.tblNavegaciones padre ON padre.idNavegacion=nav.idNavegacionPadre
WHERE nav.codigoNavegacion IN (
 N'OPERACION',N'SEGURIDAD',N'ACCESOS',N'ADMINISTRACION',N'MONITOREO',
 N'BENEFICIARIOS',N'SOLICITUDES',N'TARJETAS',N'CAMPUS',N'EDIFICIOS',N'ELEVADORES',N'DISPOSITIVOS',
 N'ADMIN_USUARIOS',N'ADMIN_PERFILES',N'ADMIN_PERMISOS',N'ADMIN_NAVEGACIONES',N'ADMIN_CONFIGURACION',N'ADMIN_AUDITORIA')
ORDER BY padre.codigoNavegacion,nav.ordenNavegacion;

/* CONSULTA 3: relaciones de navegación del administrador. */
SELECT p.codigoPerfil,nav.codigoNavegacion,nav.enlaceNavegacion,
       pn.permiteVisualizar,pn.estadoPerfilNavegacion,nav.esVisible,nav.estadoNavegacion
FROM Seguridad.tblPerfiles p
JOIN Seguridad.tblPerfilesNavegaciones pn ON pn.idPerfil=p.idPerfil
JOIN Seguridad.tblNavegaciones nav ON nav.idNavegacion=pn.idNavegacion
WHERE p.codigoPerfil=N'ADMIN_GENERAL'
ORDER BY nav.codigoNavegacion;

/* CONSULTA 4: opciones existentes que no deben ocultarse. */
SELECT codigoNavegacion,enlaceNavegacion,esVisible,estadoNavegacion
FROM Seguridad.tblNavegaciones
WHERE codigoNavegacion IN (N'REPORTES',N'SOPORTE',N'MI_CUENTA',N'MI_INFORMACION',N'MI_TARJETA')
ORDER BY codigoNavegacion;
