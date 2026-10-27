/*
  SIGA UNAH - Valores de parámetros para alertas administrativas.
  Pendiente de revisión y ejecución controlada por ambiente.
  No crea cabeceras y no actualiza registros existentes.
*/

DECLARE @usuario nvarchar(90) = N'script-parametros-alertas';
DECLARE @idParametro int;

SELECT @idParametro = idParametro
FROM Configuracion.tblParametros
WHERE codigoParametro = N'CONFIGURACION_GENERAL'
  AND estadoParametro = 1;

IF @idParametro IS NULL
    THROW 51210, N'No existe una cabecera CONFIGURACION_GENERAL activa.', 1;

IF EXISTS (
    SELECT 1
    FROM Configuracion.tblParametrosValores pv
    WHERE pv.codigoParametroValor IN (
        N'ALERTAS_SOLICITUD_PENDIENTE_MEDIA_DIAS',
        N'ALERTAS_SOLICITUD_PENDIENTE_ALTA_DIAS',
        N'ALERTAS_ASIGNACION_PROXIMA_VENCER_DIAS',
        N'ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS'
    )
    AND pv.idParametro <> @idParametro
)
    THROW 51211, N'Existe un código de alerta asociado a una cabecera distinta de CONFIGURACION_GENERAL.', 1;

INSERT INTO Configuracion.tblParametrosValores
    (idParametro, valorParametro, fechaInicioVigencia, fechaFinVigencia,
     codigoParametroValor, nombreParametroValor, descripcionParametroValor,
     tipoParametroValor, usuarioRegistro)
SELECT @idParametro, v.valorParametro, NULL, NULL,
       v.codigoParametroValor, v.nombreParametroValor, v.descripcionParametroValor,
       N'INT', @usuario
FROM (VALUES
    (N'ALERTAS_SOLICITUD_PENDIENTE_MEDIA_DIAS', N'3', N'Días para prioridad media de solicitudes pendientes.', N'Días para prioridad media de solicitudes pendientes.'),
    (N'ALERTAS_SOLICITUD_PENDIENTE_ALTA_DIAS', N'7', N'Días para prioridad alta de solicitudes pendientes.', N'Días para prioridad alta de solicitudes pendientes.'),
    (N'ALERTAS_ASIGNACION_PROXIMA_VENCER_DIAS', N'30', N'Días de ventana para asignaciones próximas a vencer.', N'Días de ventana para asignaciones próximas a vencer.'),
    (N'ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS', N'0', N'Días para solicitudes aprobadas sin asignación vigente.', N'Días para solicitudes aprobadas sin asignación vigente.')
) v(codigoParametroValor, valorParametro, nombreParametroValor, descripcionParametroValor)
WHERE NOT EXISTS (
    SELECT 1
    FROM Configuracion.tblParametrosValores pv
    WHERE pv.idParametro = @idParametro
      AND pv.codigoParametroValor = v.codigoParametroValor
);

/* Verificación posterior; no modifica datos. */
SELECT p.codigoParametro,
       pv.idParametroValor,
       pv.codigoParametroValor,
       pv.valorParametro,
       pv.tipoParametroValor,
       pv.estadoParametroValor,
       pv.fechaInicioVigencia,
       pv.fechaFinVigencia
FROM Configuracion.tblParametros p
INNER JOIN Configuracion.tblParametrosValores pv
    ON pv.idParametro = p.idParametro
WHERE p.codigoParametro = N'CONFIGURACION_GENERAL'
  AND pv.codigoParametroValor IN (
      N'ALERTAS_SOLICITUD_PENDIENTE_MEDIA_DIAS',
      N'ALERTAS_SOLICITUD_PENDIENTE_ALTA_DIAS',
      N'ALERTAS_ASIGNACION_PROXIMA_VENCER_DIAS',
      N'ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS'
  )
ORDER BY pv.codigoParametroValor;
