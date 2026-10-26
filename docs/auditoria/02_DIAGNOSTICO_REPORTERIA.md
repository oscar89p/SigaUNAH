# Diagnóstico de reportería contra PROSENE

La matriz fue contrastada con `Requerimiento Unah - Prosene.pdf`, páginas 2–4. La inspección es estática; no se inventan resultados de SQL Server, pruebas de producción ni eventos de elevadores.

## Alcance explícito de PROSENE

PROSENE solicita en página 3, sección VI, número de beneficiarios activos, uso por edificio, uso por tipo de condición y descargas PDF/Excel. En página 2, sección IV, también solicita estadísticas, monitoreo de uso e historial individual. Estas dos clases deben separarse: los reportes administrativos pueden usar datos actuales; los reportes de uso requieren eventos externos.

## Estado del módulo actual

| Capacidad | Evidencia | Estado |
|---|---|---|
| Opciones de filtros | `GET /api/v1/reportes/opciones`; `reportes.repository.ts:5-13` | IMPLEMENTADO técnico |
| Beneficiarios total/por tipo | `GET /api/v1/reportes/resumen`; `tblBeneficiarios` | PARCIAL frente a PROSENE: permite activos/inactivos y tipo, no reporte detallado por condición. |
| Solicitudes por estado | Agrupación en `reportes.repository.ts` | PARCIAL; no es un reporte PROSENE explícito, pero es necesario para operación administrativa. |
| Tarjetas por estado | Agrupación de `tblTarjetas` | PARCIAL; no separa completamente asignación vigente, disponible y liberación histórica. |
| Asignaciones/vigencias | Conteo de `esAsignacionVigente=1`; fechas en `tblAsignaciones` | PARCIAL; faltan vencidas/próximas e historial transversal. |
| Uso por edificio | `tblRegistrosAcceso` y joins en monitoreo | DEPENDENCIA EXTERNA; no hay evidencia de eventos reales. |
| Uso por condición | Condiciones persistidas, pero sin agregación desde eventos | DEPENDENCIA EXTERNA. |
| Exportación | `/api/v1/reportes/exportar` devuelve CSV | PENDIENTE para PDF/XLSX solicitados por PROSENE. |

## Reportes priorizados

| Reporte | Fuente | Estado | Acción de cierre |
|---|---|---|---|
| Beneficiarios activos | `Beneficiarios.tblBeneficiarios.estadoBeneficiario` | PARCIAL | Reporte detallado/agregado y validación de categorías. |
| Beneficiarios por condición | `tblBeneficiariosCondiciones`, tipos y fechas | PARCIAL | Confirmar catálogo y exponer consulta; proteger datos médicos. |
| Solicitudes por estado | `Solicitudes.tblSolicitudes`, tipos de estado | PARCIAL | Detalle, periodo, fecha y estados pendientes/aprobados. |
| Tarjetas asignadas/disponibles | `tblTarjetas` + `tblAsignaciones` | PARCIAL | Definir estados oficiales y evitar confundir “liberada” con “disponible”. |
| Vigentes/vencidas/próximas | Fechas de asignación/vigencia | PARCIAL | Aprobar umbral, zona horaria y regla de fecha nula. |
| Historial de movimientos | `tblAsignacionesEstados`, `tblTarjetasEstados` si está aplicado, bitácora | PARCIAL | Consulta transversal con actor, motivo y evento. |
| Estadísticas por edificio | `tblRegistrosAcceso` + edificio/elevador | DEPENDENCIA EXTERNA | Esperar eventos BMS confiables. |
| PDF y Excel | Datos de reportes | PENDIENTE | Crear formatos, filtros visibles, límites y pruebas. |

## Alertas relacionadas

Reutilizables sin servicios externos: vencimientos próximos, asignaciones vencidas, solicitudes pendientes y aprobadas sin asignación. Las alertas de uso irregular/excesivo/fuera de horario son dependientes de eventos de `Operaciones.tblRegistrosAcceso` y reglas de BMS. No deben simularse con conteos de tarjetas o catálogos.

## APIs y pruebas revisadas

- Rutas: `backend/src/modules/reportes/reportes.routes.ts` — `/opciones`, `/resumen`, `/exportar`.
- Servicio/repositorio: `reportes.service.ts`, `reportes.repository.ts`.
- Frontend: `frontend/src/services/reportes.ts`, `frontend/src/views/ReportsView.vue`.
- Permisos: `REPORTES_CONSULTAR` y `REPORTES_EXPORTAR` en `authorization.ts`.
- Pruebas: `reportes.types.test.ts` y autorización en `auth.service.test.ts`; no se encontró integración SQL ni prueba end-to-end de la vista.
- Monitoreo: `monitoreo.routes.ts` y `monitoreo.repository.ts` leen eventos, pero la existencia de la ruta no prueba que BMS los entregue.
