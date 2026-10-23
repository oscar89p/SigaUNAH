# Implementación de catálogos institucionales

## Arquitectura

Se implementó una pantalla enlazada desde Administración → Configuración:

```text
/administracion/configuracion/catalogos
```

La pantalla tiene dos pestañas:

- **Catálogos**: `Tipos.tblTipos`.
- **Valores de catálogos**: `Tipos.tblTiposValores`.

No se creó una opción adicional en SQL Server ni se modificaron tablas de navegación.

## Estructura verificada

`Tipos.tblTipos`:

- `idTipo` PK identity.
- `idCategoria` obligatorio, FK a `Tipos.tblCategorias`.
- `codigoTipo` único por categoría.
- `nombreTipo`, `descripcionTipo`, `estadoTipo`.
- Campos de auditoría.

`Tipos.tblTiposValores`:

- `idTipoValor` PK identity.
- `idTipo` obligatorio, FK a `Tipos.tblTipos`.
- `codigoTipoValor` único por catálogo.
- `nombreTipoValor`, `descripcionTipoValor`, `ordenTipoValor`.
- `valorAdicionalTipoValor` no se expone en esta pantalla.
- `estadoTipoValor` y campos de auditoría.

## Endpoints

Todos requieren `CONFIGURACION_ADMINISTRAR`:

```http
GET   /api/v1/seguridad/admin/configuracion/catalogos
POST  /api/v1/seguridad/admin/configuracion/catalogos
PUT   /api/v1/seguridad/admin/configuracion/catalogos/:id
PATCH /api/v1/seguridad/admin/configuracion/catalogos/:id/estado

GET   /api/v1/seguridad/admin/configuracion/catalogos/valores
POST  /api/v1/seguridad/admin/configuracion/catalogos/valores
PUT   /api/v1/seguridad/admin/configuracion/catalogos/valores/:id
PATCH /api/v1/seguridad/admin/configuracion/catalogos/valores/:id/estado
```

Las operaciones usan Zod, consultas parametrizadas, transacciones y auditoría. No existe eliminación física. Los códigos se mantienen inmutables durante edición y las relaciones se validan antes de insertar.

## Integración con Beneficiarios

La pantalla de condiciones consulta `TIPO_CONDICION` mediante `Tipos.tblTiposValores`. Los nuevos valores activos creados en este módulo estarán disponibles automáticamente en el selector de condiciones, sin cambiar el frontend de Beneficiarios.

La base local verificó:

- 12 catálogos.
- 30 valores.
- `CATEGORIA_CONDICION` y `TIPO_CONDICION` existen, aunque su disponibilidad de valores depende de los registros activos reales.

No se insertaron valores institucionales.

## Archivos principales

Backend:

- `backend/src/modules/seguridad/administracion.types.ts`
- `backend/src/modules/seguridad/administracion.routes.ts`
- `backend/src/modules/seguridad/administracion.repository.ts`

Frontend:

- `frontend/src/views/CatalogsView.vue`
- `frontend/src/services/administracion.ts`
- `frontend/src/views/ConfigurationView.vue`
- `frontend/src/router/index.ts`

## Pruebas

- Backend typecheck: correcto.
- Backend build: correcto.
- Backend tests: **30 archivos, 92 pruebas correctas**.
- Frontend typecheck: correcto.
- Frontend build: correcto.
- `git diff --check`: correcto.
- Consultas directas contra SQL Server local: 12 catálogos y 30 valores, con relación por `idTipo` verificada.

No se ejecutaron operaciones de escritura contra SQL Server, migraciones, despliegues ni `git push`.
