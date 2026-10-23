# Auditoría de base de datos local vs VPS — SIGA UNAH

## Estado y límites

No se ejecutaron consultas SQL en esta tarea. La evidencia histórica documentada en `docs/INVENTARIO_BASE_DATOS.md` indica que `DbSigaUNAH` local fue inspeccionada previamente mediante `SELECT` sobre metadatos, con 16 esquemas, 83 tablas y 125 FK. El DDL versionado (`database/SIGADll.sql`) declara 82 tablas; la diferencia registrada es `Migracion.tblCargaBeneficiariosDemo`, presente en el SQL Server consultado y ausente del DDL.

La existencia y contenido actual de las bases **Local-MacBook-Docker** y **Linux STC - DEV - MSSQL** no fue comparada en esta sesión. Se requiere acceso autorizado a ambas conexiones y ejecutar las consultas de `CONSULTAS_COMPARACION_SQL.md` por separado.

## Objetos y cambios identificados en archivos

### Seguridad y navegación

El DDL de referencia contiene:

- `Seguridad.tblPermisos`: PK `idPermiso`, único `codigoPermiso`, estado y auditoría.
- `Seguridad.tblPerfilesPermisos`: relación única `(idPerfil,idPermiso)`, estado y FK a perfil/permiso.
- `Seguridad.tblNavegaciones`: único `codigoNavegacion`, jerarquía por `idNavegacionPadre`, estados `esVisible` y `estadoNavegacion`, índice `ixNavegacion_NavegacionPadre`.
- `Seguridad.tblPerfilesNavegaciones`: relación única `(idPerfil,idNavegacion)`, `permiteVisualizar`, estado y `ixPerfilNavegacion_Perfil`.

Los scripts `docs/SIGA_P1_*`, `docs/propuesta-permisos-navegacion-p1*.sql` y `database/pendientes/05_catalogos_navegacion.sql` contienen validaciones y propuestas de DML para permisos/navegación. El último script de catálogos termina deliberadamente en `ROLLBACK`; no debe ejecutarse sin autorización.

### Catálogos y configuración

- `Tipos.tblTipos`: código único por categoría `(idCategoria,codigoTipo)`, estado, auditoría e índice por categoría/estado.
- `Tipos.tblTiposValores`: código único por catálogo `(idTipo,codigoTipoValor)`, estado, auditoría e índice por tipo/estado.
- `Configuracion.tblParametros`: código único, tipo de dato, valor predeterminado, `permiteModificacion` y estado.
- `Configuracion.tblParametrosValores`: código único por parámetro `(idParametro,codigoParametroValor)`, vigencia, tipo y estado.
- La pantalla de catálogos y parámetros está documentada como código pendiente local; no implica que todos sus registros deban copiarse al VPS.

### Tarjetas y asignaciones

El modelo de referencia contiene `Tarjetas.tblTarjetas`, `Tarjetas.tblAsignaciones`, `Tarjetas.tblAsignacionesEstados`, `Tarjetas.tblTarjetasReemplazos`, `Tarjetas.tblTarjetasRevisiones` y `Operaciones.tblTarjetasMovimientos`. Son datos operativos/históricos y no deben sincronizarse como catálogos.

El script `database/pendientes/02_reutilizacion_tarjetas.sql` es principalmente de simulación/lectura y propone un índice único filtrado sobre `Tarjetas.tblAsignaciones(idTarjeta)` cuando `esAsignacionVigente=1`. `database/SIGA_P2_02_APLICAR_INDICE_DBEAVER.sql` sí contiene DDL aplicable con `@Aplicar=1`, pero no se ejecutó ni se autoriza como parte de este despliegue.

## DDL, índices y constraints a verificar

Comparar en ambos ambientes, como mínimo:

1. Tablas, columnas, tipos, longitud, nulabilidad y columnas identity.
2. PK, UQ, FK y sus columnas referenciadas.
3. Índices, unicidad, filtros, columnas incluidas y estado habilitado.
4. Defaults y checks.
5. Conteo y códigos funcionales de tablas de configuración y seguridad.

No usar solo IDs identity para comparar ambientes; las relaciones deben resolverse por códigos funcionales (`codigoPermiso`, `codigoPerfil`, `codigoNavegacion`, `codigoTipo`, `codigoTipoValor`).

## Clasificación para sincronización

| Grupo | Política preliminar |
|---|---|
| Permisos, perfiles, navegaciones y relaciones RBAC | Comparar por códigos; requiere aprobación de Seguridad antes de modificar estados o relaciones. |
| Tipos y valores institucionales | Puede proponerse alta de faltantes por código; requiere dueño funcional del catálogo. |
| Parámetros institucionales | Comparar por código; no sobrescribir valores efectivos/operativos sin autorización. |
| Tarjetas, asignaciones, estados, movimientos e historial | No copiar automáticamente; son datos operativos y requieren plan independiente. |
| Sesiones, auditoría, logs y accesos | No sincronizar desde local. |
| DDL/índices/constraints | Aplicar solo como cambio técnico separado, con respaldo, ventana y autorización DBA. |
