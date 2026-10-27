# Implementación de alertas administrativas parametrizadas

## 1. Alcance de este ajuste

Este ajuste incorpora la lectura institucional de umbrales para las alertas administrativas y prepara el script idempotente de datos pendiente de ejecución. No se modificó la estructura de tablas, no se ejecutaron instrucciones SQL y no se alteraron permisos almacenados, navegación institucional ni ambientes.

La implementación usa la estructura institucional compuesta por la cabecera `Configuracion.tblParametros` y el detalle `Configuracion.tblParametrosValores`. La cabecera se resuelve por `codigoParametro = CONFIGURACION_GENERAL`; los umbrales se leen exclusivamente desde `tblParametrosValores.valorParametro`.

## 2. Estructura real revisada

### `Configuracion.tblParametros`

Verificada en `database/SIGADll.sql`:

- `idParametro int IDENTITY`, PK.
- `codigoParametro nvarchar(80)`, obligatorio y único.
- `nombreParametro nvarchar(150)`, obligatorio.
- `descripcionParametro nvarchar(500)`, nullable.
- `tipoDato nvarchar(20)`, obligatorio.
- `valorPredeterminado nvarchar(1000)`, nullable.
- `permiteModificacion bit`, default 1.
- `estadoParametro bit`, default 1.
- `usuarioRegistro`, `fechaRegistro`, `usuarioActualizacion`, `fechaActualizacion`.

### `Configuracion.tblParametrosValores`

Tiene FK a `tblParametros`, vigencia propia y restricción única `(idParametro, codigoParametroValor)`. Los cuatro códigos de alertas son valores de detalle relacionados con la cabecera `CONFIGURACION_GENERAL`.

## 3. Servicios y validaciones existentes

El módulo `backend/src/modules/seguridad/administracion.repository.ts` administra ambas tablas y sus relaciones. El lector de alertas no reutiliza `valorPredeterminado`, porque el valor efectivo institucional está en el detalle.

La validación existente reconoce tipos `INT`, `INTEGER`, `SMALLINT`, `BIGINT` y `ENTERO`, pero permite enteros negativos. Para alertas se añadió un lector específico en:

`backend/src/shared/configuration/parameters.ts`

Este lector:

1. Resuelve la cabecera activa mediante `codigoParametro = CONFIGURACION_GENERAL`, sin fijar `idParametro`.
2. Consulta los cuatro códigos desde `Configuracion.tblParametrosValores.valorParametro`, unidos por `idParametro`.
3. Filtra `estadoParametroValor` y las fechas de vigencia con `SYSDATETIME()`.
4. Detecta múltiples valores vigentes para un mismo código y falla sin seleccionar arbitrariamente.
5. Exige tipo de dato entero compatible.
6. Exige una representación decimal de entero no negativo (`0` o entero positivo sin signo).
7. Exige que el valor sea un entero seguro de JavaScript.
8. Exige que el umbral alto sea estrictamente mayor que el umbral medio.
9. Lanza `HttpError(503)` si falta la cabecera, falta un parámetro, es inválido o es inconsistente.
10. No utiliza valores fijos de reemplazo ni `valorPredeterminado`.

Un parámetro ausente o inválido impide calcular la respuesta de alertas y se comunica como indisponibilidad de configuración. Esto evita mostrar resultados aparentemente válidos con reglas incompletas.

## 4. Parámetros requeridos

| Código institucional | Tipo | Valor inicial solicitado | Uso |
|---|---:|---:|---|
| `ALERTAS_SOLICITUD_PENDIENTE_MEDIA_DIAS` | `INT` | `3` | Antigüedad mínima para prioridad media. |
| `ALERTAS_SOLICITUD_PENDIENTE_ALTA_DIAS` | `INT` | `7` | Antigüedad mínima para prioridad alta. Debe ser mayor que media. |
| `ALERTAS_ASIGNACION_PROXIMA_VENCER_DIAS` | `INT` | `30` | Ventana institucional de próxima expiración. |
| `ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS` | `INT` | `0` | Antigüedad mínima desde la resolución sin asignación vigente. |

Los valores iniciales están en los registros de detalle y en el script pendiente, no en constantes TypeScript ni en el frontend.

## 5. Script SQL pendiente

Archivo preparado:

`database/pendientes/11_parametros_alertas_administrativas.sql`

Características:

- Usa la cabecera activa `Configuracion.tblParametros.codigoParametro = CONFIGURACION_GENERAL`.
- Inserta únicamente en `Configuracion.tblParametrosValores`.
- Inserta cada código solo si no existe bajo esa cabecera (`IF NOT EXISTS`).
- Respeta la restricción única `ukParametroValor_ParametroCodigo`.
- Usa `tipoParametroValor = N'INT'` y `valorParametro` para los valores iniciales.
- Usa `usuarioRegistro = N'script-parametros-alertas'`.
- Falla si la cabecera no existe o si el código ya está asociado a otra cabecera.
- No establece IDs identity ni campos de auditoría generados por default.
- Incluye únicamente un `SELECT` de verificación posterior.
- No fue ejecutado.

Si alguno de los códigos ya existe, el script no lo actualiza silenciosamente. La revisión institucional debe decidir si conservarlo, corregirlo mediante el módulo de configuración o detener el despliegue.

## 6. Backend implementado

Se añadió el módulo:

- `backend/src/modules/alertas/alertas.types.ts`
- `backend/src/modules/alertas/alertas.repository.ts`
- `backend/src/modules/alertas/alertas.service.ts`
- `backend/src/modules/alertas/alertas.routes.ts`
- `backend/src/modules/alertas/alertas.types.test.ts`
- `backend/src/shared/configuration/parameters.ts`

Rutas implementadas:

```text
GET /api/v1/alertas/resumen
GET /api/v1/alertas/solicitudes-pendientes
GET /api/v1/alertas/aprobadas-sin-asignacion
GET /api/v1/alertas/asignaciones-proximas
GET /api/v1/alertas/asignaciones-vencidas
GET /api/v1/alertas/inconsistencias
```

Todas las rutas aceptan paginación y búsqueda. Los días institucionales no son parámetros de consulta; se cargan desde SQL Server en cada operación de alertas.

El resumen y los listados utilizan la misma función de lectura y validación de umbrales. El resumen devuelve los umbrales efectivos junto con los totales para que la interfaz pueda mostrarlos.

El servidor registra las rutas desde `backend/src/server.ts`. La autorización de lectura se vincula provisionalmente a `REPORTES_CONSULTAR`, sin crear permisos nuevos ni insertar asignaciones RBAC.

## 7. Reglas calculadas

- Pendientes: solicitud activa con estado de catálogo `PENDIENTE`; la prioridad se calcula con días desde `fechaSolicitud`.
- Pendientes: menos de `MEDIA_DIAS` es `INFORMATIVA`; desde `MEDIA_DIAS` hasta `ALTA_DIAS`, inclusive, es `MEDIA`; más de `ALTA_DIAS` es `ALTA`. Con los valores iniciales: 2=`INFORMATIVA`, 3=`MEDIA`, 7=`MEDIA`, 8=`ALTA`.
- Aprobadas sin asignación: solicitud activa `APROBADA`, días desde `fechaResolucion` iguales o superiores al parámetro y ausencia de asignación con `esAsignacionVigente=1`.
- Próximas: asignación vigente con `fechaFinVigencia` no nula dentro de la ventana institucional.
- Vencidas: asignación vigente con `fechaFinVigencia` anterior a la fecha actual.
- Inconsistencias: reproduce exclusivamente las cuatro combinaciones del diagnóstico existente: `DISPONIBLE` con asignación vigente, `ASIGNADA` sin asignación vigente, `BAJA` con asignación vigente y `BLOQUEADA` con asignación vigente.

Una solicitud aprobada sin `fechaResolucion` no se clasifica porque no existe una fecha confiable desde la cual medir el umbral. Ese caso debe permanecer como posible inconsistencia de datos, no recibir una fecha inventada.

## 8. Interfaz y limitación de navegación

La entrega previa ya dispone de `ReportsView.vue`, `DataGrid.vue`, paginación y servicios HTTP reutilizables. Se mantiene la pestaña **Alertas administrativas** dentro de `ReportsView.vue`, sin agregar una segunda pantalla ni modificar la navegación institucional. `AlertasPanel.vue` consulta `/resumen`, muestra indicadores de las cinco categorías, muestra los umbrales vigentes y carga el detalle paginado por tipo.

El frontend no envía umbrales institucionales ni permite modificarlos mediante filtros. La búsqueda y el cambio de página solo filtran el resultado calculado por el backend. La navegación institucional permanece sin cambios.

## 9. Pruebas requeridas

### Parámetros

- Los cuatro parámetros se leen por código.
- Cambiar `tblParametrosValores.valorParametro` en SQL Server cambia el comportamiento sin recompilar backend.
- Falta de cualquier parámetro produce HTTP 503 y no usa fallback.
- Valor vacío, decimal, texto, signo negativo o tipo no entero produce HTTP 503.
- Umbral alto igual o menor que medio produce HTTP 503.
- Cero para `ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS` es válido.

### Alertas

- Solicitudes con 2, 3, 7 y 8 días reciben `INFORMATIVA`, `MEDIA`, `MEDIA` y `ALTA`, respectivamente.
- Una aprobada con resolución de hoy y parámetro 0 puede alertarse si no tiene asignación vigente.
- Una aprobada sin resolución no se alerta.
- La ventana de próximas a vencer refleja 30 días cuando el parámetro tiene ese valor.
- Un cambio de 30 a otro valor se refleja igualmente en resumen y detalle.
- Fechas nulas no se convierten en vencimientos artificiales.
- La paginación conserva el total de la misma consulta lógica.

### Seguridad

- Sin `REPORTES_CONSULTAR`, las rutas devuelven 403 por el hook global.
- Las rutas no aceptan cambios de umbral mediante query string.
- No hay operaciones POST, PUT, PATCH o DELETE en alertas.

La verificación ejecutada fue:

- Backend typecheck: correcto.
- Backend build: correcto.
- Backend tests: **40 archivos, 174 pruebas correctas**.
- Frontend typecheck: correcto.
- Frontend build: correcto.
- `git diff --check`: correcto.

## 10. Resultado y pendientes

La parametrización backend está preparada sin constantes de negocio para los cuatro días y la interfaz muestra los valores recibidos desde el backend. Las cinco categorías están expuestas en indicadores y detalle. Quedan pendientes antes de considerar la funcionalidad lista para despliegue:

1. Revisar y ejecutar controladamente el script SQL en el ambiente autorizado.
2. Confirmar que no existan códigos equivalentes con nombres distintos.
3. Validar con datos institucionales la interpretación de `fechaResolucion`, `fechaSolicitud` y límites de fechas.
4. Ejecutar pruebas SQL/integración contra un ambiente autorizado, sin sustituir las pruebas unitarias.
5. Confirmar que las cinco categorías y sus totales coinciden con consultas de verificación en SQL Server.

No se ejecutó ningún `INSERT`, `UPDATE` ni `DELETE`, y no se modificó la estructura de SQL Server.
