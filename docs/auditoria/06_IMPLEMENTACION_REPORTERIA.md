# Entrega 1 — Implementación de reportería operativa

**Estado:** implementada para revisión técnica.  
**Alcance:** consultas de solo lectura, filtros, paginación y visualización operativa.  
**Fecha:** 26 de octubre de 2026.

## Archivos modificados

### Backend

- `backend/src/modules/reportes/reportes.types.ts`
- `backend/src/modules/reportes/reportes.types.test.ts`
- `backend/src/modules/reportes/reportes.repository.ts`
- `backend/src/modules/reportes/reportes.service.ts`
- `backend/src/modules/reportes/reportes.routes.ts`

### Frontend

- `frontend/src/services/reportes.ts`
- `frontend/src/views/ReportsView.vue`

No se modificaron los cinco documentos originales de auditoría, SQL, migraciones, autenticación ni módulos de gestión.

## Endpoints

Se conservaron:

- `GET /api/v1/reportes/opciones`
- `GET /api/v1/reportes/resumen`
- `GET /api/v1/reportes/exportar` — continúa siendo CSV; no se implementaron XLSX/PDF.

Se agregaron, todos de consulta y protegidos por `REPORTES_CONSULTAR` mediante el hook global:

- `GET /api/v1/reportes/beneficiarios`
- `GET /api/v1/reportes/solicitudes`
- `GET /api/v1/reportes/tarjetas`
- `GET /api/v1/reportes/asignaciones`
- `GET /api/v1/reportes/historial`

## Contratos y filtros

Todos los endpoints detallados aceptan `page`, `pageSize` (1–100), `search`, `desde`, `hasta` y orden estable descendente por defecto. Las fechas se validan como ISO `YYYY-MM-DD` y `hasta` no puede preceder a `desde`.

### Beneficiarios

`estado`, `idTipoBeneficiario`, `idTipoCondicion`, `desde`, `hasta`, `search`.

Devuelve identificación, nombre, tipo, condición más reciente activa, estado, registro, cuenta, correo institucional, carné y datos académicos disponibles.

### Solicitudes

`codigoEstadoSolicitud`, `idEstadoSolicitud`, `idPeriodoAcademico`, `idBeneficiario`, `sinAsignacion`, `desde`, `hasta`, `search`.

Los estados se filtran por `codigoTipoValor` unido al catálogo `ESTADO_SOLICITUD`; no se comparan descripciones arbitrarias. `sinAsignacion=true` determina ausencia de una asignación vigente. La interfaz permite seleccionar los códigos reales del catálogo para revisar pendientes, aprobadas y rechazadas.

### Tarjetas

`idEstadoTarjeta`, `idTipoTarjeta`, `disponibilidad=all|available|assigned`, `desde`, `hasta`, `search`.

La tarjeta se consulta una sola vez y la asignación se obtiene mediante `OUTER APPLY` sobre la relación más reciente, priorizando la vigente. Se exponen por separado el estado administrativo y la disponibilidad derivada de la asignación vigente.

### Asignaciones y vigencias

`estado=all|vigentes|vencidas|proximas|finalizadas`, `idEstadoAsignacion`, `idBeneficiario`, `idTarjeta`, `proximasDias` (predeterminado 15), `desde`, `hasta`, `search`.

Las vencidas se identifican por fecha y las finalizadas por `esAsignacionVigente=0`. Ninguna consulta modifica estados ni registros. `diasRestantes` se calcula para la consulta y no se persiste.

### Historial consolidado

`tipoMovimiento=all|asignacion|solicitud|tarjeta`, `idBeneficiario`, `idTarjeta`, `desde`, `hasta`.

Consolida únicamente eventos existentes de `tblAsignacionesEstados`, `tblSolicitudesEstados` y `tblTarjetasEstados`. Incluye actor, estados anterior/nuevo, fecha y motivo cuando estén registrados. No se generan eventos sintéticos.

## Tablas utilizadas

- `Beneficiarios.tblBeneficiarios`, `tblPersonas`, `tblBeneficiariosCondiciones`.
- `Academico.tblCarreras`, `tblPeriodosAcademicos`.
- `Solicitudes.tblSolicitudes`, `tblSolicitudesAprobaciones`, `tblSolicitudesEstados`, `tblTiposSolicitudes`.
- `Tarjetas.tblTarjetas`, `tblTiposTarjetas`, `tblAsignaciones`, `tblAsignacionesEstados`, `tblTarjetasEstados`.
- `Tipos.tblTipos`, `Tipos.tblTiposValores`.
- Las consultas son parametrizadas, paginadas en SQL Server y no ejecutan `INSERT`, `UPDATE`, `DELETE`, DDL ni migraciones.

## Frontend

`ReportsView.vue` conserva el resumen y CSV existentes y añade pestañas para:

1. Resumen general.
2. Beneficiarios.
3. Solicitudes.
4. Tarjetas.
5. Asignaciones y vigencias.
6. Historial.

Se reutiliza `DataGrid.vue` para tablas detalladas, con estados de carga, error, vacío, totales y paginación real. Los filtros de solicitudes usan códigos provenientes de `GET /opciones`; no se hardcodean estados de negocio.

## Permisos

El hook de `backend/src/server.ts` resuelve todas las rutas nuevas bajo `/api/v1/reportes` a `REPORTES_CONSULTAR`. No se crearon permisos nuevos. La exportación CSV existente conserva `REPORTES_EXPORTAR`.

## Pruebas ejecutadas

- Backend `npm run typecheck`: **correcto**.
- Backend `npm run build`: **correcto**.
- Backend `npm test -- --run`: **132 pruebas correctas en 34 archivos**, incluyendo los nuevos contratos detallados.
- Frontend `npm run typecheck`: **correcto**.
- Frontend `npm run build`: **correcto**.
- Pruebas añadidas en `reportes.types.test.ts`: defaults, filtros individuales/combinados, fechas, paginación, ventana de vencimiento y valores inválidos.

No se ejecutaron consultas contra SQL Server ni pruebas end-to-end autenticadas porque no se dispuso de una base de datos/ambiente de integración en esta sesión. Por tanto, la consistencia de totales, existencia de datos y comportamiento de los joins deben validarse con SQL Server autorizado.

## Limitaciones conocidas

- No se implementaron XLSX/PDF ni alertas.
- No se cambia automáticamente el estado de asignaciones vencidas o tarjetas.
- Las estadísticas de uso por edificio/condición y uso irregular requieren eventos reales de Building Management.
- La consulta histórica de tarjetas presupone la tabla `Tarjetas.tblTarjetasEstados`, ya utilizada por el módulo existente; debe verificarse en el SQL Server objetivo sin ejecutar DDL.
- La aprobación de solicitudes y las categorías de condición dependen de catálogos institucionales activos.
- No se modificaron estructuras SQL ni registros.

## Pendientes para siguientes entregas

1. Validación integrada con SQL Server y datos autorizados.
2. Exportaciones XLSX/PDF.
3. Alertas administrativas internas.
4. Integración institucional académica y eventos BMS.
5. Pruebas end-to-end por perfil y revisión funcional de estados.
