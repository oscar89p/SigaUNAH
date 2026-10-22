# Análisis de reutilización de tarjetas

## Causa exacta

El DDL fuente `database/SIGADll.sql` define:

```sql
CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente
ON DbSigaUNAH.Tarjetas.tblAsignaciones (idTarjeta);
```

El nombre sugiere vigencia, pero el índice no tiene `WHERE`. Por tanto, SQL Server permite como máximo una fila histórica total por `idTarjeta`, aunque `tblAsignaciones` también tiene `esAsignacionVigente bit NOT NULL`, `fechaDevolucion` y `estadoAsignacion`.

La relación histórica no es un error del modelo: `tblAsignacionesEstados` conserva transiciones y `tblTarjetasReemplazos` conserva sustituciones. El conflicto es únicamente el alcance de la unicidad.

## Inspección de solo lectura

El script `database/pendientes/02_reutilizacion_tarjetas.sql` contiene consultas para verificar en la instancia real:

- columnas de `Tarjetas.tblAsignaciones`;
- definición, columnas y filtro del índice;
- duplicados de tarjetas vigentes;
- tarjetas con historial y sus estados;
- relaciones con `tblTarjetas`, `tblBeneficiarios`, solicitudes, estados, perfiles y auditoría.

No se ejecutaron esas consultas contra datos institucionales desde este entorno porque no se dispone de una conexión autorizada. El análisis estructural se basa en `database/SIGADll.sql` y el código P2.

## Revisión de P2

- **Asignación:** valida tarjeta activa, beneficiario y solicitud; usa transacción y bloqueos `UPDLOCK,HOLDLOCK`.
- **Devolución:** marca `esAsignacionVigente=0`, registra devolución y agrega `tblAsignacionesEstados`.
- **Renovación:** modifica vigencia y perfiles asociados dentro de la misma transacción.
- **Reemplazo:** cierra la asignación anterior, crea la nueva y registra `tblTarjetasReemplazos`.
- **Historial:** consulta filas vigentes o históricas sin borrar registros.

Se ajustaron las consultas de disponibilidad, asignación y reemplazo para comprobar únicamente `a.esAsignacionVigente=1`. Esto es compatible con el índice filtrado propuesto; mientras el índice actual siga instalado, SQL Server continuará rechazando la reutilización y el cambio no debe aplicarse funcionalmente antes de la migración.

## Solución recomendada

Reemplazar el índice por el mínimo cambio estructural:

```sql
CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente
ON DbSigaUNAH.Tarjetas.tblAsignaciones (idTarjeta)
WHERE esAsignacionVigente = 1;
```

Esto garantiza:

1. Una sola asignación vigente por tarjeta.
2. Reutilización de una tarjeta cuando todas sus asignaciones anteriores sean no vigentes.
3. Conservación de filas históricas y sus relaciones.
4. Protección contra carreras concurrentes mediante la unicidad física del índice; los bloqueos P2 añaden validación temprana y mensajes funcionales.

Antes de aplicar se debe comprobar que no existen dos filas con `esAsignacionVigente=1` para la misma tarjeta. Si existen, la operación se detiene y requiere resolución funcional; no se deben borrar ni modificar registros automáticamente.

## Alternativas descartadas

- **Eliminar el índice:** no garantiza unicidad concurrente.
- **Índice único sobre `(idTarjeta, esAsignacionVigente)`:** permitiría múltiples filas vigentes con el mismo valor `1`, por lo que es incorrecto.
- **Reutilizar la misma fila:** destruye trazabilidad y contradice el historial existente.
- **Agregar una columna calculada o migración adicional:** innecesario para el modelo actual.

## Riesgos y decisión requerida

- El índice filtrado debe ser soportado por la versión y configuración de SQL Server institucional; el script verifica la metadata antes de operar.
- Debe confirmarse funcionalmente que `esAsignacionVigente=1` es la única condición de simultaneidad. El DDL no define otra regla de vigencia por fechas o estado.
- Debe aprobarse la reutilización de tarjetas inactivas/revisadas según las reglas operativas. El backend conserva la validación existente `estadoTarjeta=1` y no inventa estados.
- No se ejecutó DDL/DML, no se modificaron índices reales y no se borraron registros.

## Validación local

- Backend typecheck: aprobado.
- Backend pruebas automatizadas: **63/63 aprobadas**.
- Backend build: aprobado.
- Frontend typecheck/build: aprobado.
- Pruebas autenticadas contra SQL Server institucional: no ejecutadas.
