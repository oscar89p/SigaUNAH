/*
  SIGA UNAH - Reutilización segura de tarjetas
  Modo predeterminado: solo lectura/simulación (@Aplicar = 0).
  No ejecutar con @Aplicar = 1 sin aprobación funcional, respaldo y ventana de cambio.
*/
USE DbSigaUNAH;
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Aplicar bit = 0;
DECLARE @Schema sysname = N'Tarjetas';
DECLARE @Tabla sysname = N'tblAsignaciones';
DECLARE @Indice sysname = N'ukAsignacion_TarjetaVigente';
DECLARE @ObjectId int = OBJECT_ID(QUOTENAME(@Schema) + N'.' + QUOTENAME(@Tabla), N'U');
DECLARE @IndexId int;

IF @ObjectId IS NULL THROW 51020, N'No existe Tarjetas.tblAsignaciones; operación detenida.', 1;

/* Inspección de columnas reales. */
SELECT c.name AS columna, ty.name AS tipo, c.max_length, c.is_nullable
FROM sys.columns c
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE c.object_id = @ObjectId
  AND c.name IN (N'idAsignacion', N'idTarjeta', N'esAsignacionVigente', N'fechaDevolucion', N'estadoAsignacion')
ORDER BY c.column_id;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectId AND name=N'idTarjeta')
   OR NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=@ObjectId AND name=N'esAsignacionVigente')
  THROW 51021, N'Faltan columnas requeridas para un índice filtrado seguro.', 1;

/* Metadata exacta del índice: unicidad, filtro y columna cubierta. */
SELECT i.name, i.index_id, i.is_unique, i.type_desc, i.has_filter, i.filter_definition,
       ic.key_ordinal, c.name AS columnaIndice
FROM sys.indexes i
JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE i.object_id=@ObjectId AND i.name=@Indice;

SELECT @IndexId = index_id
FROM sys.indexes
WHERE object_id=@ObjectId AND name=@Indice;

IF @IndexId IS NULL THROW 51022, N'No existe el índice esperado; no se realizará una sustitución implícita.', 1;

/* Idempotencia: si ya es el índice correcto, no se vuelve a tocar. */
IF EXISTS (
  SELECT 1 FROM sys.indexes i
  WHERE i.object_id=@ObjectId AND i.index_id=@IndexId AND i.is_unique=1 AND i.has_filter=1
    AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition,N'[',N''),N']',N''),N' ',N''),N'(',N''),N')',N'') LIKE N'%esAsignacionVigente=1%'
)
BEGIN
  SELECT N'YA APLICADO: el índice ya es único y filtrado por esAsignacionVigente=1; no se realizaron cambios.' AS resultado;
  RETURN;
END;

IF EXISTS (
  SELECT 1 FROM sys.indexes i
  WHERE i.object_id=@ObjectId AND i.index_id=@IndexId
    AND (i.is_unique <> 1 OR i.has_filter <> 0)
)
  THROW 51023, N'El índice existente no coincide con el índice único no filtrado esperado.', 1;

IF EXISTS (
  SELECT 1 FROM sys.index_columns ic
  JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
  WHERE ic.object_id=@ObjectId AND ic.index_id=@IndexId
    AND (ic.key_ordinal <> 1 OR c.name <> N'idTarjeta')
)
  THROW 51024, N'El índice existente no cubre únicamente idTarjeta como se esperaba.', 1;

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
  THROW 51025, N'Existen tarjetas con más de una asignación vigente; resolver antes de cambiar el índice.', 1;

/* Evidencia del historial y relaciones, solo lectura. */
SELECT a.idTarjeta, COUNT_BIG(*) AS totalAsignaciones,
       SUM(CASE WHEN a.esAsignacionVigente=1 THEN 1 ELSE 0 END) AS vigentes,
       SUM(CASE WHEN a.esAsignacionVigente=0 THEN 1 ELSE 0 END) AS noVigentes,
       COUNT_BIG(e.idAsignacionEstado) AS cambiosEstado,
       COUNT_BIG(DISTINCT b.idBeneficiario) AS beneficiariosRelacionados
FROM Tarjetas.tblAsignaciones a
LEFT JOIN Tarjetas.tblAsignacionesEstados e ON e.idAsignacion=a.idAsignacion
LEFT JOIN Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario
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
  SELECT N'SIMULACIÓN: no se ejecutó DDL ni DML. Los resultados anteriores son de solo lectura.' AS resultado;
  RETURN;
END;

BEGIN TRANSACTION;
BEGIN TRY
  /* Revalidación dentro de la transacción para evitar cambiar sobre un estado observado obsoleto. */
  IF EXISTS (
    SELECT 1 FROM Tarjetas.tblAsignaciones
    WHERE esAsignacionVigente = 1
    GROUP BY idTarjeta
    HAVING COUNT_BIG(*) > 1
  ) THROW 51026, N'La revalidación detectó duplicados vigentes; rollback.', 1;

  DROP INDEX ukAsignacion_TarjetaVigente ON Tarjetas.tblAsignaciones;
  CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente
    ON Tarjetas.tblAsignaciones (idTarjeta)
    WHERE esAsignacionVigente = 1;

  IF NOT EXISTS (
    SELECT 1 FROM sys.indexes i
    WHERE i.object_id=@ObjectId AND i.name=@Indice AND i.is_unique=1 AND i.has_filter=1
      AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.filter_definition,N'[',N''),N']',N''),N' ',N''),N'(',N''),N')',N'') LIKE N'%esAsignacionVigente=1%'
  ) THROW 51027, N'La verificación posterior del índice filtrado falló.', 1;

  COMMIT TRANSACTION;
  SELECT N'APLICADO: índice único filtrado creado correctamente.' AS resultado;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;

/*
  REVERSIÓN MANUAL — ejecutar por separado y con aprobación.
  No se incluye en el flujo automático para evitar revertir accidentalmente
  después de haber creado asignaciones reutilizadas.

  BEGIN TRANSACTION;
  BEGIN TRY
    DROP INDEX ukAsignacion_TarjetaVigente ON Tarjetas.tblAsignaciones;
    CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente
      ON Tarjetas.tblAsignaciones (idTarjeta);
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH;
*/
