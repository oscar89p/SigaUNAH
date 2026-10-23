# Implementación de condiciones de beneficiarios

## Relaciones reales verificadas

`Beneficiarios.tblBeneficiariosCondiciones` contiene:

- `idBeneficiarioCondicion` bigint, PK identity.
- `idBeneficiario` bigint, obligatorio, FK a `Beneficiarios.tblBeneficiarios`.
- `idTipoCondicion` int, obligatorio, FK a `Tipos.tblTiposValores`.
- `descripcionCondicion` nvarchar(1000), nullable.
- `esTemporal` bit, default 0.
- `fechaInicio` date, nullable.
- `fechaFinEstimada` date, nullable.
- `requiereRevision` bit, default 0.
- `estadoBeneficiarioCondicion` bit, default 1.
- Campos de auditoría.

El catálogo institucional consultado es `Tipos.tblTipos` con `codigoTipo='TIPO_CONDICION'`. En la base SQL Server local existe el tipo, pero actualmente no tiene valores activos registrados. La interfaz no genera valores de demostración y por eso el botón de nueva condición permanece sin opciones hasta que el catálogo sea provisionado por el proceso autorizado.

## Endpoints

```http
GET   /api/v1/beneficiarios/condiciones/opciones
GET   /api/v1/beneficiarios/:id/condiciones
POST  /api/v1/beneficiarios/:id/condiciones
PUT   /api/v1/beneficiarios/:id/condiciones/:idCondicion
PATCH /api/v1/beneficiarios/:id/condiciones/:idCondicion/estado
```

Los endpoints reutilizan los permisos existentes de Beneficiarios mediante el mapeo global:

- GET: `BENEFICIARIOS_CONSULTAR`.
- POST: `BENEFICIARIOS_REGISTRAR`.
- PUT: `BENEFICIARIOS_MODIFICAR`.
- PATCH: `BENEFICIARIOS_VALIDAR`.

Cada operación valida que el beneficiario exista. Para editar o cambiar estado, la consulta exige simultáneamente `idBeneficiario` e `idBeneficiarioCondicion`, evitando modificar una condición perteneciente a otro beneficiario.

## Pantalla

Se integró la gestión dentro de `frontend/src/views/BeneficiariosView.vue`:

- Pestaña Información general.
- Pestaña Condiciones disponible al editar un beneficiario existente.
- Grid con tipo, descripción, temporalidad, fechas, revisión, estado y acciones.
- Formulario de nueva/edición de condición.
- Combobox cargado desde SQL Server.
- Estados de carga, error, vacío y confirmación para cambios de estado.
- No existe módulo nuevo en el menú lateral.

## Validaciones

- Zod valida tipos, longitudes, IDs y fechas.
- La fecha final no puede ser anterior a la inicial.
- El tipo debe pertenecer al catálogo activo `TIPO_CONDICION`.
- No existe eliminación física.
- Las escrituras usan transacciones y auditoría en `Auditoria.tblBitacoras`.
- No se modificó el esquema ni se insertaron datos.

## Archivos modificados

- `backend/src/modules/beneficiarios/beneficiarios.types.ts`
- `backend/src/modules/beneficiarios/beneficiarios.service.ts`
- `backend/src/modules/beneficiarios/beneficiarios.routes.ts`
- `backend/src/modules/beneficiarios/beneficiarios.repository.ts`
- `frontend/src/services/beneficiarios.ts`
- `frontend/src/views/BeneficiariosView.vue`

## Pruebas y resultados

- Backend typecheck: correcto.
- Backend build: correcto.
- Backend tests: **28 archivos, 88 pruebas correctas**.
- Frontend typecheck: correcto.
- Frontend build: correcto.
- `git diff --check`: correcto.
- Consulta directa SQL Server local de opciones: 0 valores activos en `TIPO_CONDICION`.
- Consulta directa de condiciones para un beneficiario local: 0 registros; respuesta paginada válida.

## Limitaciones

No es posible crear condiciones desde la interfaz mientras el catálogo `TIPO_CONDICION` no tenga valores activos. Esto es una condición real de los datos institucionales y no se solventó con valores inventados. El catálogo debe ser provisionado mediante el procedimiento autorizado de SQL Server antes de probar altas funcionales.
