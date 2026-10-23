# Consultas SELECT para comparar Local y Linux STC

Estas consultas son exclusivamente de lectura. Ejecutarlas por separado en cada conexión SQL Server apuntando a `DbSigaUNAH`, exportar cada resultado con una etiqueta de ambiente y comparar los conjuntos. No ejecutar `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `ALTER`, `CREATE`, `DROP`, `USE` ni procedimientos de escritura en esta fase.

## 1. Identificación y metadatos

```sql
SELECT DB_NAME() AS baseDatos, @@SERVERNAME AS servidor, SYSDATETIME() AS fechaConsulta;

SELECT s.name AS esquema, t.name AS tabla, t.is_ms_shipped
FROM DbSigaUNAH.sys.tables t
JOIN DbSigaUNAH.sys.schemas s ON s.schema_id=t.schema_id
WHERE t.is_ms_shipped=0
ORDER BY s.name,t.name;

SELECT s.name AS esquema, t.name AS tabla, c.column_id, c.name AS columna,
       ty.name AS tipo, c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity
FROM DbSigaUNAH.sys.tables t
JOIN DbSigaUNAH.sys.schemas s ON s.schema_id=t.schema_id
JOIN DbSigaUNAH.sys.columns c ON c.object_id=t.object_id
JOIN DbSigaUNAH.sys.types ty ON ty.user_type_id=c.user_type_id
WHERE s.name IN (N'Seguridad',N'Tipos',N'Configuracion',N'Tarjetas',N'Operaciones')
ORDER BY s.name,t.name,c.column_id;
```

## 2. Conteos y estados

```sql
SELECT N'Seguridad.tblPermisos' AS objeto, COUNT_BIG(*) AS total,
       SUM(CASE WHEN estadoPermiso=1 THEN 1 ELSE 0 END) AS activos,
       SUM(CASE WHEN estadoPermiso=0 THEN 1 ELSE 0 END) AS inactivos
FROM DbSigaUNAH.Seguridad.tblPermisos
UNION ALL SELECT N'Seguridad.tblPerfilesPermisos',COUNT_BIG(*),SUM(CASE WHEN estadoPerfilPermiso=1 THEN 1 ELSE 0 END),SUM(CASE WHEN estadoPerfilPermiso=0 THEN 1 ELSE 0 END) FROM DbSigaUNAH.Seguridad.tblPerfilesPermisos
UNION ALL SELECT N'Seguridad.tblNavegaciones',COUNT_BIG(*),SUM(CASE WHEN estadoNavegacion=1 THEN 1 ELSE 0 END),SUM(CASE WHEN estadoNavegacion=0 THEN 1 ELSE 0 END) FROM DbSigaUNAH.Seguridad.tblNavegaciones
UNION ALL SELECT N'Seguridad.tblPerfilesNavegaciones',COUNT_BIG(*),SUM(CASE WHEN estadoPerfilNavegacion=1 THEN 1 ELSE 0 END),SUM(CASE WHEN estadoPerfilNavegacion=0 THEN 1 ELSE 0 END) FROM DbSigaUNAH.Seguridad.tblPerfilesNavegaciones
UNION ALL SELECT N'Tipos.tblTipos',COUNT_BIG(*),SUM(CASE WHEN estadoTipo=1 THEN 1 ELSE 0 END),SUM(CASE WHEN estadoTipo=0 THEN 1 ELSE 0 END) FROM DbSigaUNAH.Tipos.tblTipos
UNION ALL SELECT N'Tipos.tblTiposValores',COUNT_BIG(*),SUM(CASE WHEN estadoTipoValor=1 THEN 1 ELSE 0 END),SUM(CASE WHEN estadoTipoValor=0 THEN 1 ELSE 0 END) FROM DbSigaUNAH.Tipos.tblTiposValores;
```

## 3. Códigos funcionales de seguridad

```sql
SELECT codigoPermiso,nombrePermiso,moduloPermiso,estadoPermiso
FROM DbSigaUNAH.Seguridad.tblPermisos
ORDER BY codigoPermiso;

SELECT codigoPerfil,nombrePerfil,estadoPerfil
FROM DbSigaUNAH.Seguridad.tblPerfiles
ORDER BY codigoPerfil;

SELECT n.codigoNavegacion,n.nombreNavegacion,n.enlaceNavegacion,n.tipoNavegacion,
       parent.codigoNavegacion AS codigoPadre,n.ordenNavegacion,n.esVisible,n.estadoNavegacion
FROM DbSigaUNAH.Seguridad.tblNavegaciones n
LEFT JOIN DbSigaUNAH.Seguridad.tblNavegaciones parent ON parent.idNavegacion=n.idNavegacionPadre
ORDER BY codigoPadre,n.ordenNavegacion,n.codigoNavegacion;

SELECT p.codigoPerfil,pe.codigoPermiso,pp.estadoPerfilPermiso
FROM DbSigaUNAH.Seguridad.tblPerfilesPermisos pp
JOIN DbSigaUNAH.Seguridad.tblPerfiles p ON p.idPerfil=pp.idPerfil
JOIN DbSigaUNAH.Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso
ORDER BY p.codigoPerfil,pe.codigoPermiso;

SELECT p.codigoPerfil,n.codigoNavegacion,pn.permiteVisualizar,pn.estadoPerfilNavegacion
FROM DbSigaUNAH.Seguridad.tblPerfilesNavegaciones pn
JOIN DbSigaUNAH.Seguridad.tblPerfiles p ON p.idPerfil=pn.idPerfil
JOIN DbSigaUNAH.Seguridad.tblNavegaciones n ON n.idNavegacion=pn.idNavegacion
ORDER BY p.codigoPerfil,n.codigoNavegacion;
```

## 4. Códigos de catálogos y configuración

```sql
SELECT c.codigoCategoria,t.codigoTipo,t.nombreTipo,t.estadoTipo
FROM DbSigaUNAH.Tipos.tblTipos t
JOIN DbSigaUNAH.Tipos.tblCategorias c ON c.idCategoria=t.idCategoria
ORDER BY c.codigoCategoria,t.codigoTipo;

SELECT c.codigoCategoria,t.codigoTipo,v.codigoTipoValor,v.nombreTipoValor,
       v.ordenTipoValor,v.estadoTipoValor
FROM DbSigaUNAH.Tipos.tblTiposValores v
JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=v.idTipo
JOIN DbSigaUNAH.Tipos.tblCategorias c ON c.idCategoria=t.idCategoria
ORDER BY c.codigoCategoria,t.codigoTipo,v.ordenTipoValor,v.codigoTipoValor;

SELECT codigoParametro,nombreParametro,tipoDato,valorPredeterminado,
       permiteModificacion,estadoParametro
FROM DbSigaUNAH.Configuracion.tblParametros
ORDER BY codigoParametro;

SELECT p.codigoParametro,v.codigoParametroValor,v.nombreParametroValor,
       v.valorParametro,v.tipoParametroValor,v.estadoParametroValor,
       v.fechaInicioVigencia,v.fechaFinVigencia
FROM DbSigaUNAH.Configuracion.tblParametrosValores v
JOIN DbSigaUNAH.Configuracion.tblParametros p ON p.idParametro=v.idParametro
ORDER BY p.codigoParametro,v.codigoParametroValor;
```

## 5. Tarjetas y asignaciones: solo evidencia, no sincronización automática

```sql
SELECT COUNT_BIG(*) AS tarjetas,
       SUM(CASE WHEN estadoTarjeta=1 THEN 1 ELSE 0 END) AS activas,
       SUM(CASE WHEN estadoTarjeta=0 THEN 1 ELSE 0 END) AS inactivas
FROM DbSigaUNAH.Tarjetas.tblTarjetas;

SELECT COUNT_BIG(*) AS asignaciones,
       SUM(CASE WHEN esAsignacionVigente=1 THEN 1 ELSE 0 END) AS vigentes,
       SUM(CASE WHEN esAsignacionVigente=0 THEN 1 ELSE 0 END) AS historicas
FROM DbSigaUNAH.Tarjetas.tblAsignaciones;

SELECT tv.codigoTipoValor AS codigoEstado,COUNT_BIG(*) AS filas
FROM DbSigaUNAH.Tarjetas.tblAsignaciones a
JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=a.idEstadoAsignacion
GROUP BY tv.codigoTipoValor
ORDER BY tv.codigoTipoValor;

SELECT COUNT_BIG(*) AS movimientos FROM DbSigaUNAH.Operaciones.tblTarjetasMovimientos;
SELECT COUNT_BIG(*) AS reemplazos FROM DbSigaUNAH.Tarjetas.tblTarjetasReemplazos;
SELECT COUNT_BIG(*) AS revisiones FROM DbSigaUNAH.Tarjetas.tblTarjetasRevisiones;
```

## 6. Registros faltantes y diferencias por códigos

Para cada bloque, ejecutar la consulta cambiando únicamente el prefijo de conexión o exportar ambos resultados y comparar externamente. No se debe consultar una base remota desde la otra sin autorización.

```sql
-- Duplicados que impedirían una sincronización idempotente.
SELECT codigoPermiso,COUNT_BIG(*) AS filas FROM DbSigaUNAH.Seguridad.tblPermisos GROUP BY codigoPermiso HAVING COUNT_BIG(*)>1;
SELECT codigoNavegacion,COUNT_BIG(*) AS filas FROM DbSigaUNAH.Seguridad.tblNavegaciones GROUP BY codigoNavegacion HAVING COUNT_BIG(*)>1;
SELECT t.idCategoria,t.codigoTipo,COUNT_BIG(*) AS filas FROM DbSigaUNAH.Tipos.tblTipos t GROUP BY t.idCategoria,t.codigoTipo HAVING COUNT_BIG(*)>1;
SELECT v.idTipo,v.codigoTipoValor,COUNT_BIG(*) AS filas FROM DbSigaUNAH.Tipos.tblTiposValores v GROUP BY v.idTipo,v.codigoTipoValor HAVING COUNT_BIG(*)>1;

-- Integridad de relaciones por código dentro de cada ambiente.
SELECT p.codigoPerfil,pe.codigoPermiso
FROM DbSigaUNAH.Seguridad.tblPerfilesPermisos pp
JOIN DbSigaUNAH.Seguridad.tblPerfiles p ON p.idPerfil=pp.idPerfil
JOIN DbSigaUNAH.Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso
WHERE p.codigoPerfil IS NULL OR pe.codigoPermiso IS NULL;

SELECT t.codigoTipo,v.codigoTipoValor
FROM DbSigaUNAH.Tipos.tblTiposValores v
JOIN DbSigaUNAH.Tipos.tblTipos t ON t.idTipo=v.idTipo
WHERE t.codigoTipo IS NULL OR v.codigoTipoValor IS NULL;
```

La comparación de diferencias debe usar claves naturales y campos autorizados, no `id*` identity. Un registro que exista solo en local no es automáticamente candidato a copiarse al VPS.

## 7. Índices, constraints y defaults

```sql
SELECT s.name AS esquema,t.name AS tabla,i.name AS indice,i.is_unique,
       i.type_desc,i.has_filter,i.filter_definition,i.is_disabled,
       c.name AS columna,ic.key_ordinal,ic.is_included_column
FROM DbSigaUNAH.sys.tables t
JOIN DbSigaUNAH.sys.schemas s ON s.schema_id=t.schema_id
JOIN DbSigaUNAH.sys.indexes i ON i.object_id=t.object_id
LEFT JOIN DbSigaUNAH.sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
LEFT JOIN DbSigaUNAH.sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE s.name IN (N'Seguridad',N'Tipos',N'Configuracion',N'Tarjetas',N'Operaciones')
ORDER BY s.name,t.name,i.name,ic.key_ordinal;

SELECT s.name AS esquema,t.name AS tabla,k.name AS constraintName,k.type_desc,
       c.name AS columna
FROM DbSigaUNAH.sys.tables t
JOIN DbSigaUNAH.sys.schemas s ON s.schema_id=t.schema_id
JOIN DbSigaUNAH.sys.key_constraints k ON k.parent_object_id=t.object_id
JOIN DbSigaUNAH.sys.index_columns ic ON ic.object_id=k.parent_object_id AND ic.index_id=k.unique_index_id
JOIN DbSigaUNAH.sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
ORDER BY s.name,t.name,k.name,ic.key_ordinal;

SELECT s.name AS esquema,t.name AS tabla,dc.name AS defaultName,c.name AS columna,dc.definition
FROM DbSigaUNAH.sys.default_constraints dc
JOIN DbSigaUNAH.sys.tables t ON t.object_id=dc.parent_object_id
JOIN DbSigaUNAH.sys.schemas s ON s.schema_id=t.schema_id
JOIN DbSigaUNAH.sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id
ORDER BY s.name,t.name,c.column_id;
```
