/*
  Consecutivo de solicitudes.
  Aplicar manualmente y con autorización del ambiente. Este script no se ejecuta
  desde la aplicación y no modifica los códigos históricos.
*/
USE DbSigaUNAH;
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.sequences AS s
  INNER JOIN sys.schemas AS sc ON sc.schema_id = s.schema_id
  WHERE sc.name = N'Solicitudes' AND s.name = N'seqCodigoSolicitud'
)
BEGIN
  EXEC(N'CREATE SEQUENCE DbSigaUNAH.Solicitudes.seqCodigoSolicitud AS bigint START WITH 1 INCREMENT BY 1 NO CYCLE;');
END;
GO

SELECT sc.name AS esquema, s.name AS secuencia, s.current_value, s.increment
FROM sys.sequences AS s
INNER JOIN DbSigaUNAH.sys.schemas AS sc ON sc.schema_id = s.schema_id
WHERE sc.name = N'Solicitudes' AND s.name = N'seqCodigoSolicitud';
GO
