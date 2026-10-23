# Implementación y validación de Monitoreo

## Funcionalidades verificadas

El módulo existente mantiene dos consultas de solo lectura:

- Registros de acceso.
- Incidentes de acceso.

La vista es `frontend/src/views/MonitoringView.vue` y la ruta es `/monitoreo`. No se generan eventos ni incidentes de demostración. Cuando las tablas no tienen filas, la interfaz muestra estados vacíos explícitos.

## Endpoints y autorización

```http
GET /api/v1/operaciones/monitoreo/accesos
GET /api/v1/operaciones/monitoreo/incidentes
```

Ambos endpoints están registrados en `backend/src/modules/operaciones/monitoreo.routes.ts` y delegan en `monitoreo.service.ts` y `monitoreo.repository.ts`.

El hook global asigna `ACCESOS_HISTORIAL` a las lecturas de `/api/v1/operaciones/monitoreo/*` mediante `backend/src/modules/auth/authorization.ts`. La ruta Vue también declara `requiredPermission: "ACCESOS_HISTORIAL"`.

## Datos y consultas

Las consultas utilizan únicamente datos persistidos:

- `Operaciones.tblRegistrosAcceso` para eventos.
- `Operaciones.tblIncidentesAcceso` para incidentes.
- Relaciones de consulta con `Tarjetas.tblTarjetas`, `Tarjetas.tblAsignaciones`, `Beneficiarios.tblBeneficiarios`, `Beneficiarios.tblPersonas`, `Accesos.tblDispositivos` y `Accesos.tblElevadores`.

Se conservaron los filtros existentes:

- Texto libre.
- Fecha desde/hasta.
- Resultado de acceso.
- Severidad.
- Estado abierto/resuelto.
- Paginación.
- Orden ascendente o descendente por fecha e identificador.

La paginación se cambió de `OFFSET ... FETCH NEXT` a `ROW_NUMBER()` para evitar la incompatibilidad SQL Server confirmada previamente en este proyecto con `FETCH NEXT`. No se modificaron tablas, índices ni registros.

## Cambios realizados

- `backend/src/modules/operaciones/monitoreo.repository.ts`
  - Paginación compatible con SQL Server mediante `ROW_NUMBER()`.
  - Aplicación efectiva de `sortDirection`.
  - Consultas con selección explícita de campos de acceso e incidentes.
- `frontend/src/views/MonitoringView.vue`
  - Grid con anchos estables, filas uniformes y scroll horizontal interno.
  - Footer de paginación con rango visible y total.
  - Estados de error, carga y vacío conservados y explicitados.

No se modificaron otros módulos, el esquema, los datos ni la navegación SQL.

## Pruebas ejecutadas

- Backend typecheck: correcto.
- Backend build: correcto.
- Pruebas backend: **26 archivos, 82 pruebas correctas**.
- Frontend typecheck/build: correcto (`vue-tsc -b` incluido en `npm run build`).
- `git diff --check`: correcto.
- Integración directa contra SQL Server Docker:
  - Accesos sin filtros: `total=0`, `items=0`.
  - Incidentes sin filtros: `total=0`, `items=0`.
  - Accesos con fechas, orden ascendente, página 2 y tamaño 5: `total=0`, `items=0`, metadatos correctos.
  - Incidentes con orden ascendente, página 2 y tamaño 5: `total=0`, `items=0`, metadatos correctos.

Los resultados vacíos son los datos reales disponibles en la base local; no se insertaron datos para probar filas.

## Dependencias pendientes

- La ingestión desde dispositivos/procesos de integración debe poblar `Operaciones.tblRegistrosAcceso` y `tblIncidentesAcceso` para visualizar eventos reales.
- La opción `MONITOREO` debe estar activa y asignada al perfil en SQL Server para aparecer en la navegación dinámica; este trabajo no modificó esas filas.
- La resolución o actualización de incidentes no está implementada y queda fuera del alcance de esta entrega.
- No se realizó una prueba HTTP autenticada en navegador ni despliegue al VPS; la validación de permisos se realizó mediante código, pruebas y consultas directas.
