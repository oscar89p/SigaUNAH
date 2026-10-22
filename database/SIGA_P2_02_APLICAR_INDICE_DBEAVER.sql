/* SIGA UNAH - APLICACION DDL LOCAL AUTORIZADA
   DBeaver: seleccionar DbSigaUNAH y ejecutar TODO con Execute SQL Statement.
   Una sola sentencia; no usar Execute SQL Script.
   MODIFICA EL INDICE REAL. SOLO EN ENTORNO LOCAL CON RESPALDO Y AUTORIZACION.
*/
EXEC sys.sp_executesql N'/*
  SIGA UNAH - Reutilización segura de tarjetas
  Modo predeterminado: solo lectura/simulación (@Aplicar = 0).
  No ejecutar con @Aplicar = 1 sin aprobación funcional, respaldo y ventana de cambio.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 1;
DECLARE @Schema sysname = N''Tarjetas'';
DECLARE @Tabla sysname = N''tblAsignaciones'';
DECLARE @Indice sysname = N''ukAsignacion_TarjetaVigente'';
DECLARE @ObjectId int = OBJECT_ID(QUOTENAME(@Schema) + N''.'' + QUOTENAME(@Tabla), N''U'');
DECLARE @IndexId int;
IF DB_NAME() <> N''DbSigaUNAH'' THROW 51019, N''Seleccione DbSigaUNAH antes de ejecutar.'', 1;

IF @ObjectId IS NULL THROW 51020, N''No existe Tarjetas.tblAsignaciones; operación detenida.'', 1;

/* Inspección de columnas reales. */
SELECT c.name AS columna, ty.name AS tipo, c.max_length, c.is_nullable
FROM sys.columns c
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE c.object_id = @ObjectId
  AND c.name IN (N''idAsignacion'', N''idTarjeta'', N''esAsignacionVigente'', N''fechaDevolucion'', N''estadoAsignacion'')
ORDER BY c.column_id;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectId AND name=N''idTarjeta'')
   OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectId AND name=N''esAsignacionVigente'')
  THROW 51021, N''Faltan columnas requeridas para un índice filtrado seguro.'', 1;

/* Metadata exacta del índice: unicidad, filtro y columna cubierta. */
SELECT i.name, i.index_id, i.is_unique, i.type_desc, i.has_filter, i.filter_definition,
       ic.key_ordinal, ic.is_included_column, ic.is_descending_key, c.name AS columnaIndice
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE i.object_id=@ObjectId AND i.name=@Indice;

SELECT @IndexId = index_id
FROM sys.indexes
WHERE object_id=@ObjectId AND name=@Indice;

IF @IndexId IS NULL THROW 51022, N''No existe el índice esperado; no se realizará una sustitución implícita.'', 1;

/* Verificar estructura exacta antes de decidir idempotencia o reemplazo. */
IF EXISTS (
 SELECT 1 FROM sys.indexes i
 WHERE i.object_id=@ObjectId AND i.index_id=@IndexId AND
 (i.type<>2 OR i.is_unique<>1 OR i.is_primary_key<>0 OR i.is_unique_constraint<>0
  OR i.is_disabled<>0 OR i.is_hypothetical<>0)
) THROW 51023, N''Índice con tipo o propiedades no esperadas; revisar manualmente.'', 1;

IF (SELECT COUNT(*) FROM sys.index_columns WHERE object_id=@ObjectId AND index_id=@IndexId)<>1
 OR NOT EXISTS (
  SELECT 1 FROM sys.index_columns ic
  JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE ic.object_id=@ObjectId AND ic.index_id=@IndexId
   AND ic.key_ordinal=1 AND ic.is_included_column=0 AND ic.is_descending_key=0
   AND c.name=N''idTarjeta''
 ) THROW 51024, N''Índice tiene columnas adicionales, incluidas o clave diferente; revisar.'', 1;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=@ObjectId AND index_id=@IndexId AND has_filter=1)
BEGIN
 IF EXISTS (
 SELECT 1 FROM sys.indexes i WHERE i.object_id=@ObjectId AND i.index_id=@IndexId
 AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition,N''['',N''''),N'']'',N''''),N'' '',N''''),N''('',N''''),N'')'',N''''),CHAR(9),N'''')=N''esAsignacionVigente=1''
 )
 BEGIN
  SELECT N''YA APLICADO: índice filtrado correcto; sin cambios.'' AS resultado;
  RETURN;
 END;
 THROW 51028, N''Índice filtrado con definición distinta; revisar manualmente.'', 1;
END;

/* No sustituir índices con INCLUDE, claves compuestas o propiedades inesperadas. */
/* Conflictos que impedirían crear el índice filtrado. No se modifican filas. */
SELECT idTarjeta, COUNT_BIG(*) AS asignacionesVigentes
FROM Tarjetas.tblAsignaciones
WHERE esAsignacionVigente = 1
GROUP BY idTarjeta
HAVING COUNT_BIG(*) > 1;

IF EXISTS (
  SELECT 1 FROM Tarjetas.tblAsignaciones
  WHERE esAsignacionVigente = 1
  GROUP BY idTarjeta
  HAVING COUNT_BIG(*) > 1
)
  THROW 51025, N''Existen tarjetas con más de una asignación vigente; resolver antes de cambiar el índice.'', 1;

/* Contar asignaciones sin multiplicarlas por las filas de estados. */
SELECT a.idTarjeta,
       COUNT_BIG(*) AS totalAsignaciones,
       SUM(CASE WHEN a.esAsignacionVigente=1 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) AS vigentes,
       SUM(CASE WHEN a.esAsignacionVigente=0 THEN CONVERT(bigint,1) ELSE CONVERT(bigint,0) END) AS noVigentes,
       SUM(COALESCE(e.cambiosEstado,CONVERT(bigint,0))) AS cambiosEstado,
       COUNT(DISTINCT a.idBeneficiario) AS beneficiariosRelacionados
FROM Tarjetas.tblAsignaciones a
OUTER APPLY (
 SELECT COUNT_BIG(*) AS cambiosEstado
 FROM Tarjetas.tblAsignacionesEstados ae WHERE ae.idAsignacion=a.idAsignacion
) e
GROUP BY a.idTarjeta
HAVING COUNT_BIG(*) > 1
ORDER BY a.idTarjeta;

SELECT tv.codigoTipoValor, tv.nombreTipoValor, COUNT_BIG(*) AS filas
FROM Tarjetas.tblAsignaciones a
JOIN Tipos.tblTiposValores tv ON tv.idTipoValor=a.idEstadoAsignacion
GROUP BY tv.codigoTipoValor, tv.nombreTipoValor
ORDER BY tv.codigoTipoValor;

IF @Aplicar = 0
BEGIN
  SELECT N''SIMULACIÓN: no se ejecutó DDL ni DML. Los resultados anteriores son de solo lectura.'' AS resultado;
  RETURN;
END;

BEGIN TRY
  BEGIN TRANSACTION;
  /* Revalidación dentro de la transacción para evitar cambiar sobre un estado observado obsoleto. */
  IF EXISTS (
    SELECT 1 FROM Tarjetas.tblAsignaciones
    WHERE esAsignacionVigente = 1
    GROUP BY idTarjeta
    HAVING COUNT_BIG(*) > 1
  ) THROW 51026, N''La revalidación detectó duplicados vigentes; rollback.'', 1;

  DROP INDEX ukAsignacion_TarjetaVigente ON Tarjetas.tblAsignaciones;
  CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente
    ON Tarjetas.tblAsignaciones (idTarjeta)
    WHERE esAsignacionVigente = 1;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    WHERE i.object_id=@ObjectId AND i.name=@Indice AND i.is_unique=1 AND i.has_filter=1
      AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition,N''['',N''''),N'']'',N''''),N'' '',N''''),N''('',N''''),N'')'',N''''),CHAR(9),N'''')=N''esAsignacionVigente=1''
  ) THROW 51027, N''La verificación posterior del índice filtrado falló.'', 1;

  COMMIT TRANSACTION;
  SELECT N''APLICADO: índice único filtrado creado correctamente.'' AS resultado;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;

/* REVERSIÓN: solo antes de reutilizar tarjetas y tras verificar que
   no hay idTarjeta repetidos en el historial. No es reversible automáticamente
   una vez que existan múltiples asignaciones históricas por tarjeta. */
';
