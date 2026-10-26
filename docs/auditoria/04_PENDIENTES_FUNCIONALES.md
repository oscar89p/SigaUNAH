# Pendientes funcionales priorizados

Este documento fue actualizado contra las 7 páginas de `Requerimiento Unah - Prosene.pdf`. Excluye como incumplimientos del equipo las dependencias que UNAH no ha proporcionado.

## P1 — Cierre inmediato bajo control del equipo

| Pendiente | Requisito PROSENE | Evidencia de brecha | Cierre esperado |
|---|---|---|---|
| Reportería de beneficiarios por condición | P3, VI Reportes | Resumen actual por tipo; falta detalle por `tblBeneficiariosCondiciones` | Activos, condición, fechas y exportación autorizada. |
| Reportería de solicitudes | Operación administrativa necesaria | No hay detalle completo por estado/período/fecha | Pendientes, aprobadas sin asignación y estados trazables. |
| Reportería de tarjetas/vigencias | P2, IV.c; P3, VI | Resumen limitado a estados y contador vigente | Disponibles, asignadas, bloqueadas, liberadas, vencidas y próximas. |
| Historial transversal | P2, IV.h; P3, VI | Historial principalmente por tarjeta | Movimientos filtrables por actor, beneficiario, tarjeta y fecha. |
| Exportación PDF/XLSX | P3, VI | Solo CSV en `reportes.routes.ts` | Formatos PDF y Excel con filtros y permisos. |
| Alertas de vencimiento | P2, IV.g | No hay módulo de alertas | Bandeja interna, sin cambios automáticos. |
| Documentación médica y respaldos | P3, V–VI | Tablas existen, sin API/vista de documentos | Carga/consulta de constancia, F03, compromiso, copia de carné y observación. |
| Aprobación PROSENE | P3, VI | Transiciones genéricas, sin flujo/rol PROSENE verificable | Estado, responsable, fecha y motivo de aprobación. |
| Roles específicos | P4, VII | RBAC genérico, perfiles efectivos no demostrados | Administrador, PROSENE, mantenimiento, beneficiario y soporte con mínimo privilegio. |
| Auditoría de operaciones | P4, VI | Bitácora no cubre todos los eventos de negocio | Registrar asignación, renovación, bloqueo, devolución, aprobación y alertas. |

## P2 — Bajo control, condicionado por decisiones funcionales

- Parámetros administrativos completos.
- Perfil de acceso a elevadores y asociación a asignaciones.
- Proceso interno para preparar solicitudes de carnés UNAH con oficio, respaldos y estado de envío.
- Pruebas end-to-end con perfiles no administrativos y datos autorizados.

## Dependencias externas, no pendientes atribuibles al equipo

- Registro automático de uso por edificio, fecha/hora y uso individual.
- Detección de uso irregular y alertas por exceso/fuera de horario.
- Estadísticas de uso por edificio y condición.
- Sincronización con matrícula/registro.
- Habilitación efectiva del carné por SEAPI.
- Autenticación institucional, notificaciones y Building Management.

## Funcionalidades existentes que se preservan

Beneficiarios, solicitudes, asignación, bloqueo/liberación, renovación, vigencias, historial administrativo y administración base no se rediseñan. Solo se amplían para cubrir una brecha comprobada contra PROSENE.
