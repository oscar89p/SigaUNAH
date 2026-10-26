# Plan de reportería y alertas

El plan conserva la prioridad anterior y añade los requisitos de PROSENE confirmados en las páginas 2–4: uso por edificio/condición, PDF/Excel, alertas de vencimiento y uso irregular. Las estimaciones son días-persona de desarrollo; no incluyen dependencias externas.

## Fase 0 — Reglas y trazabilidad (1–2 días)

1. Vincular cada reporte a la matriz y distinguir requisito PROSENE de mejora operativa.
2. Confirmar códigos de estados de solicitud, tarjeta y asignación.
3. Definir “próxima a vencer”, zona horaria y tratamiento de fechas nulas.
4. Confirmar catálogo de condiciones y protección de datos médicos.
5. Confirmar perfiles PROSENE, mantenimiento, beneficiario y soporte.

**Aceptación:** reglas aprobadas y cada consulta tiene criterio de inclusión/exclusión.

## Fase 1 — Reportería administrativa (5–8 días)

- Beneficiarios activos/inactivos por categoría/condición.
- Solicitudes por estado, período y fechas; pendientes de aprobación.
- Aprobadas pendientes de asignación.
- Tarjetas disponibles, asignadas, bloqueadas y liberadas.
- Filtros por campus/edificio cuando la relación persistida sea confiable.

**Aceptación:** consultas parametrizadas, detalle paginado, totales reproducibles y sin mutaciones.

## Fase 2 — Vigencias e historial (3–5 días)

- Vigentes, vencidas y próximas a vencer.
- Historial de asignación, devolución/liberación, renovación y cambios administrativos.
- Actor, motivo, fecha, tarjeta, beneficiario y solicitud cuando existan.

No se modifican automáticamente estados de tarjetas/asignaciones.

## Fase 3 — Exportaciones PDF y Excel (3–5 días)

El backend actual solo entrega CSV. Implementar, previa autorización, XLSX y PDF con columnas, filtros, fecha de generación, paginación, límites y permisos. La exportación de uso por edificio/condición queda bloqueada hasta contar con eventos BMS.

## Fase 4 — Alertas administrativas internas (4–6 días)

| Alerta | Fuente | Dependencia |
|---|---|---|
| Vencimiento próximo | `tblAsignaciones.fechaFinVigencia` | Regla de umbral aprobada. |
| Asignación vencida | Fecha fin/estado | Regla de negocio aprobada. |
| Solicitud pendiente | `tblSolicitudes` + catálogo | Estados oficiales. |
| Aprobada sin asignación | Solicitud + ausencia de asignación vigente | Regla de aprobación. |
| Uso irregular/excesivo/fuera de horario | `tblRegistrosAcceso` | Eventos BMS y umbrales externos. |

La bandeja debe mostrar severidad, entidad, origen, fecha, estado y responsable. Debe permitir marcar atención con auditoría, pero no enviar correo/SMS ni autocambiar tarjetas/asignaciones.

## Fase 5 — Otros pendientes bajo control (prioridad posterior)

1. Gestión documental de constancia médica, F03, hoja de compromiso y copia de carné.
2. Flujo explícito de aprobación PROSENE.
3. Perfiles de acceso y roles específicos.
4. Proceso registral del carné UNAH, dejando la habilitación SEAPI como dependencia.
5. Cobertura de auditoría de operaciones.

## Dependencias que bloquean cierre funcional

Autenticación institucional, matrícula/registro, notificaciones y Building Management siguen fuera del alcance ejecutable. El proceso especial de página 7 requiere además oficio VOAE y habilitación SEAPI; SIGA puede preparar/registrar el expediente, pero no sustituir la actuación institucional.
