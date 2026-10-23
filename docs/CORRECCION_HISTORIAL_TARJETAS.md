# Corrección del historial de tarjetas

## Diagnóstico

Se revisaron la ruta Fastify, servicio, repositorio, esquema SQL Server y serialización:

- Ruta: `GET /api/v1/tarjetas/:id/historial`.
- Validación: `historyQuerySchema` acepta `page >= 1` y `pageSize` entre 1 y 50.
- Servicio: valida primero que la tarjeta exista y conserva la paginación.
- Repositorio: consulta `Tarjetas.tblAsignaciones` con sus relaciones reales a tarjeta, beneficiario, persona, solicitud y estado.
- El esquema local confirma las columnas usadas (`fechaRegistro`, `fechaAsignacion`, `fechaDevolucion`, `estadoAsignacion`, etc.).
- Los identificadores `bigint` son serializados por el hook global existente.

El log autenticado entregado para `GET /api/v1/tarjetas/1/historial?page=1&pageSize=10` confirmó la excepción real:

```text
RequestError: Invalid usage of the option NEXT in the FETCH statement.
code: EREQUEST, number: 153, state: 2, class: 15
preceding error: Incorrect syntax near the keyword 'FROM'.
```

El stack trace termina en `mssql/lib/tedious/request.js:427`; Fastify registra `backend/src/server.ts` como manejador. La sentencia que fallaba era la paginación del método `history` en `backend/src/modules/tarjetas/tarjetas.repository.ts`: `ORDER BY ... OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`.

La causa raíz confirmada es la incompatibilidad de esa forma de paginación con la configuración/compatibilidad de la instancia SQL Server que atiende la solicitud. La consulta de datos y sus relaciones no fueron modificadas. Se sustituyó únicamente la paginación por `ROW_NUMBER()`.

## Corrección implementada

1. El servicio ahora valida la existencia de la tarjeta. Una tarjeta inexistente devuelve `404 Tarjeta no encontrada`, no un historial vacío ambiguo.
2. El repositorio usa `ROW_NUMBER()` con `@offset` y `@pageEnd`; no requiere `FETCH NEXT`.
3. El repositorio captura errores SQL del historial y los transforma mediante `mapSqlError`, manteniendo los códigos existentes para conexión no disponible y errores de relación.
4. Se agregaron pruebas de regresión para la estrategia de paginación y sus parámetros.
5. La pantalla distingue estados excluyentes:
   - carga;
   - error con mensaje y botón **Reintentar**;
   - historial vacío cuando la consulta fue exitosa y no tiene registros;
   - historial con registros.
5. El estado anterior del historial se limpia al reintentar, evitando mostrar registros o “sin eventos” mientras existe un error.

## Archivos modificados

- `backend/src/modules/tarjetas/tarjetas.service.ts`
- `backend/src/modules/tarjetas/tarjetas.repository.ts`
- `backend/src/modules/tarjetas/tarjetas.types.test.ts`
- `frontend/src/views/GestionTarjetaView.vue`

No se modificó SQL Server, no se ejecutaron migraciones y no se alteró auditoría ni RBAC.

## Pruebas ejecutadas

- Backend typecheck/build: correcto.
- Backend tests: correcto; 24 archivos y 79 pruebas.
- Frontend typecheck/build: correcto.
- Prueba de integración SQL directa de historial sin registros: correcta, 0 filas.
- Prueba de integración SQL directa de historial con registro local: correcta, 1 fila.
- Prueba de la consulta corregida con `ROW_NUMBER()`: correcta contra SQL Server Docker.
- Endpoint HTTP sin autenticación: `401`, esperado por RBAC.

## Verificación pendiente

La solicitud HTTP autenticada posterior no pudo ejecutarse desde esta sesión porque las cookies proporcionadas devolvieron `401 La sesión no es válida`. Por tanto, no se declara validado el endpoint HTTP `200` ni el renderizado autenticado del frontend. Falta ejecutar el backend corregido con una sesión válida y comprobar tarjeta `10003`, una tarjeta con historial, página posterior, usuario sin permiso y serialización de `bigint`.
