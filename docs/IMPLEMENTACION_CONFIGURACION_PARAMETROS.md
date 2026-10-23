# Implementación de Configuración: parámetros y valores

## Estructura real encontrada

`Configuracion.tblParametros` contiene:

- `idParametro` `int` PK identity.
- `codigoParametro` `nvarchar(80)` único y obligatorio.
- `nombreParametro` `nvarchar(150)` obligatorio.
- `descripcionParametro` `nvarchar(500)` nullable.
- `tipoDato` `nvarchar(20)` obligatorio.
- `valorPredeterminado` `nvarchar(1000)` nullable.
- `permiteModificacion` `bit` default 1.
- `estadoParametro` `bit` default 1.
- Campos de auditoría `usuarioRegistro`, `fechaRegistro`, `usuarioActualizacion`, `fechaActualizacion`.

`Configuracion.tblParametrosValores` contiene:

- `idParametroValor` `bigint` PK identity.
- `idParametro` `int` obligatorio con FK a `tblParametros`.
- `valorParametro` `nvarchar(1000)` obligatorio.
- `fechaInicioVigencia` y `fechaFinVigencia` `datetime2` nullable.
- `estadoParametroValor` `bit` default 1.
- `codigoParametroValor` `nvarchar(80)` obligatorio.
- `nombreParametroValor` `nvarchar(150)` obligatorio.
- `descripcionParametroValor` `nvarchar(500)` nullable.
- `tipoParametroValor` `nvarchar(64)` obligatorio.
- Campos de auditoría.
- Restricción única `(idParametro, codigoParametroValor)`.

No se modificó el esquema SQL Server ni se ejecutaron migraciones.

## Endpoints implementados

Todos requieren `CONFIGURACION_ADMINISTRAR` mediante el hook global:

```http
GET   /api/v1/seguridad/admin/configuracion/parametros
POST  /api/v1/seguridad/admin/configuracion/parametros
PUT   /api/v1/seguridad/admin/configuracion/parametros/:id
PATCH /api/v1/seguridad/admin/configuracion/parametros/:id/estado

GET   /api/v1/seguridad/admin/configuracion/valores
POST  /api/v1/seguridad/admin/configuracion/valores
PUT   /api/v1/seguridad/admin/configuracion/valores/:id
PATCH /api/v1/seguridad/admin/configuracion/valores/:id/estado
```

Se mantuvieron los endpoints legados `/configuracion` y `/configuracion/:id` para no alterar consumidores existentes.

## Operaciones implementadas

- Pestaña **Parámetros** con búsqueda, estado, paginación, creación, edición, activación/desactivación y acceso a valores asociados.
- Pestaña **Valores de parámetros** con búsqueda, paginación, filtro por parámetro, creación, edición y estado.
- El parámetro relacionado se muestra por nombre y código, no solo por ID.
- No existe eliminación física.
- Todas las escrituras usan transacciones y registran `Auditoria.tblBitacoras`.
- La FK y la restricción única de valores son respetadas por validación y SQL Server.

## Seguridad y validaciones

- Zod valida IDs, longitudes, códigos, tipos, fechas y rangos de vigencia.
- Los códigos de parámetros son inmutables durante edición.
- No se exponen ni permiten administrar contraseñas, hashes, tokens, secretos, cookies o cadenas de conexión.
- Las consultas de parámetros y valores filtran nombres/códigos sensibles.
- Los valores de parámetros se muestran mediante consultas parametrizadas.
- No se implementó eliminación física.

## Archivos modificados

- `backend/src/modules/seguridad/administracion.types.ts`
- `backend/src/modules/seguridad/administracion.routes.ts`
- `backend/src/modules/seguridad/administracion.repository.ts`
- `backend/src/modules/seguridad/administracion.types.test.ts`
- `frontend/src/services/administracion.ts`
- `frontend/src/views/ConfigurationView.vue`

## Pruebas y resultados

- Backend typecheck: correcto.
- Backend build: correcto.
- Backend tests: **28 archivos, 86 pruebas correctas**.
- Frontend typecheck/build: correcto.
- `git diff --check`: correcto.
- Consulta directa contra SQL Server local:
  - Parámetros visibles: 3.
  - Valores visibles: 9.
  - Relación por `idParametro` y nombres del parámetro: correcta.

No se insertaron ni modificaron datos durante la validación.

## Restricciones funcionales

- La administración depende de que el perfil tenga `CONFIGURACION_ADMINISTRAR`.
- Los parámetros sensibles quedan excluidos deliberadamente.
- El valor efectivo de un parámetro continúa siendo responsabilidad del consumidor institucional; esta pantalla administra registros, no cambia la forma en que otros módulos resuelven su configuración.
- La interfaz no administra otras tablas de Configuración, como listas, idiomas, procesos o versiones del sistema.
