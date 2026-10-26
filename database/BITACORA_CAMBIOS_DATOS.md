# Bitácora de cambios de datos — Períodos académicos

## Entrega: estados administrativos de tarjetas (pendiente de aplicación)

- Se preparó `pendientes/09_estados_administrativos_tarjetas.sql`, con `Tarjetas.tblTarjetasEstados`, claves foráneas, auditoría e índice por tarjeta/fecha. No se ejecutó.
- Se preparó `pendientes/10_diagnostico_consistencia_tarjetas.sql`, consulta de solo lectura. No se corrigieron registros; en particular no se modificó DEMO-TARJ-008.
- Ambiente local: cambios de código preparados; la tabla nueva aún debe aplicarse manualmente antes de habilitar operaciones administrativas y asignación/devolución.
- VPS/producción: verificar definiciones reales, permisos existentes y catálogo `ESTADO_TARJETA` antes de aplicar el DDL; no asumir que la estructura local existe.
- Dependencia de despliegue: aplicar DDL autorizado, ejecutar diagnóstico y aprobar regularización controlada de hallazgos antes de activar la funcionalidad.

## Alcance

Esta entrega reutiliza `Academico.tblPeriodosAcademicos`; no crea una tabla duplicada ni modifica TableroUNAH. Los scripts son pendientes y **no se ejecutan automáticamente**. No se asume que existan registros locales en Linux STC.

| Tabla | Código funcional | Descripción | Motivo | Script SQL | Ambiente | Estado de aplicación |
|---|---|---|---|---|---|---|
| `Academico.tblPeriodosAcademicos` | `PERIODOS_ACADEMICOS` | Períodos institucionales con código, descripción, fechas y estado administrativo | Alimentar Solicitudes desde catálogo administrable; conservar histórico por FK, sin eliminación física | No requiere DDL. CRUD vía API; fechas funcionales se escriben en las columnas existentes `fechaInicioPeriodoAcademico`/`fechaFinPeriodoAcademico` y se mantienen también `fechaInicio`/`fechaFin` | Desarrollo / STC / Producción | Pendiente de autorización; sin ejecución |
| `Solicitudes.tblSolicitudes` | `SOLICITUD_PERIODO_ACADEMICO` | Validación de existencia y estado habilitado del período en altas y cambios | Evitar confiar exclusivamente en el frontend; permitir conservar un período histórico ya asociado | No requiere DDL. Validación backend en módulo Solicitudes | Desarrollo / STC / Producción | Implementado en código; pendiente de pruebas contra BD autorizada |
| `Solicitudes.seqCodigoSolicitud` | `SOLICITUD_CONSECUTIVO_AUTOMATICO` | Consecutivo persistente para nuevas solicitudes con formato `SOL-AAAA-NNNNNN` | Generar códigos únicos bajo concurrencia sin modificar códigos históricos | `database/pendientes/07_consecutivo_solicitudes.sql` | Desarrollo / STC / Producción | Script idempotente pendiente de aplicación manual |
| `Seguridad.tblPermisos` | `CONFIGURACION_ADMINISTRAR` | Permiso existente reutilizado para administrar períodos | Mantener el esquema RBAC institucional sin conceder permisos automáticamente | `database/pendientes/06_periodos_academicos_configuracion.sql` (consulta de verificación) | STC / Producción | No se inserta ni asigna; pendiente de verificación |
| `Seguridad.tblNavegaciones` | `ADMIN_CONFIGURACION`, `ADMIN_PARAMETROS`, `ADMIN_CATALOGOS`, `ADMIN_PERIODOS_ACADEMICOS` | Configuración como contenedor expandible con Parámetros, Catálogos y Períodos académicos | Mantener una navegación lateral consistente, escalable y sin menú paralelo | `database/pendientes/06_periodos_academicos_configuracion.sql` | STC / Producción | Pendiente de autorización y ejecución |
| `Academico.tblPeriodosAcademicos` | `PERIODO_VIGENCIA_CALCULADA` | Estado calculado `PROGRAMADO`, `VIGENTE` o `FINALIZADO` según fechas | Distinguir vigencia temporal del estado administrativo | No requiere DDL; `CASE` en consulta del endpoint | Desarrollo / STC / Producción | Implementado en código; pendiente de validación |

## Catálogos, tipos y valores

### Incorporación de `ASIGNADA`

| Código | Catálogo | Ambiente | Fecha | Motivo | Script utilizado | Estado |
|---|---|---|---|---|---|---|
| `ASIGNADA` | `ESTADO_SOLICITUD` | SQL Server local | 2026-10-25 | Representar que una solicitud aprobada ya tiene una tarjeta asignada vigente | `database/pendientes/08_estado_asignada_solicitudes.sql` | Aplicado localmente; pendiente en VPS |

No se crean catálogos nuevos. Se incorpora únicamente el valor `ASIGNADA` al catálogo existente `ESTADO_SOLICITUD`; la vigencia calculada no se almacena como valor de `Tipos.tblTiposValores`, para evitar duplicar una condición derivable de fechas. El estado administrativo continúa siendo el `bit` existente de `tblPeriodosAcademicos`.

## Reglas de aplicación

- El script solo agrega navegación si no existe; no usa `DELETE` ni copia IDs identity.
- Para perfiles que ya tenían `ADMIN_CONFIGURACION` visible, agrega únicamente las tres opciones hijas en `tblPerfilesNavegaciones`; no agrega permisos, no altera asignaciones existentes y no concede acceso RBAC nuevo.
- El script contiene consultas de verificación y debe ejecutarse manualmente, con autorización del ambiente correspondiente.
