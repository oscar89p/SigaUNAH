/*
  Estado requerido para cerrar el ciclo de solicitudes.
  Idempotente: resuelve el catálogo por código y no asume valores identity.
  Ejecutar manualmente con autorización en cada ambiente.
*/
SET XACT_ABORT ON;
BEGIN TRANSACTION;

INSERT INTO DbSigaUNAH.Tipos.tblTiposValores
  (idTipo, codigoTipoValor, nombreTipoValor, descripcionTipoValor, ordenTipoValor, usuarioRegistro)
SELECT t.idTipo, N'ASIGNADA', N'Asignada', N'Solicitud con una tarjeta asignada vigente', 50, N'script-08-estado-asignada'
FROM DbSigaUNAH.Tipos.tblTipos t
WHERE t.codigoTipo = N'ESTADO_SOLICITUD'
  AND t.estadoTipo = 1
  AND NOT EXISTS (
    SELECT 1
    FROM DbSigaUNAH.Tipos.tblTiposValores tv
    WHERE tv.idTipo = t.idTipo AND tv.codigoTipoValor = N'ASIGNADA'
  );

COMMIT TRANSACTION;

SELECT t.codigoTipo, tv.codigoTipoValor, tv.nombreTipoValor, tv.estadoTipoValor
FROM DbSigaUNAH.Tipos.tblTipos t
INNER JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipo = t.idTipo
WHERE t.codigoTipo = N'ESTADO_SOLICITUD' AND tv.codigoTipoValor = N'ASIGNADA';
