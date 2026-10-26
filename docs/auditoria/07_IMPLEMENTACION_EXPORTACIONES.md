# Entrega 2 — Implementación de exportaciones

**Estado:** implementada para revisión técnica.  
**Fecha:** 26 de octubre de 2026.

## Alcance

Se agregaron exportaciones XLSX y PDF para beneficiarios, solicitudes, tarjetas, asignaciones/vigencias e historial consolidado. La exportación CSV del resumen general se mantuvo sin cambios funcionales.

## Archivos

### Backend

- `backend/src/modules/reportes/reportes.export.ts` — generación XLSX/PDF, columnas, nombres y protección de fórmulas.
- `backend/src/modules/reportes/reportes.service.ts` — recolección paginada y límite de exportación.
- `backend/src/modules/reportes/reportes.routes.ts` — endpoint y validación de parámetros.
- `backend/src/modules/reportes/reportes.types.ts` — tipos de reporte y formato.
- `backend/src/modules/auth/authorization.ts` — autorización específica de exportaciones.
- `backend/src/modules/reportes/reportes.export.test.ts` — pruebas de formato y valores peligrosos.

### Frontend

- `frontend/src/services/reportes.ts` — descarga de exportaciones detalladas.
- `frontend/src/views/ReportsView.vue` — controles, estado de generación y errores.

## Dependencias

Se incorporó únicamente `exceljs` en `backend`. El PDF se genera directamente en memoria con un ensamblador PDF pequeño, sin persistir archivos ni requerir un servicio externo.

## Endpoints

```text
GET /api/v1/reportes/{beneficiarios|solicitudes|tarjetas|asignaciones|historial}/exportar?formato=xlsx
GET /api/v1/reportes/{beneficiarios|solicitudes|tarjetas|asignaciones|historial}/exportar?formato=pdf
```

Los filtros se reciben con el mismo contrato de cada consulta detallada. Las consultas existentes del repositorio se reutilizan por páginas para obtener todos los registros filtrados.

## Seguridad y límites

- El endpoint requiere `REPORTES_EXPORTAR`.
- Se validan tipo de reporte, formato y filtros mediante los esquemas existentes de Zod.
- El máximo es `10,000` registros por exportación. Sobre ese valor se devuelve HTTP 413 solicitando restringir filtros.
- Los archivos se transmiten directamente y no se almacenan permanentemente.
- Los valores de texto que comienzan con `=`, `+`, `-` o `@` se protegen en XLSX contra interpretación como fórmulas.

## Formatos

XLSX incluye encabezado institucional, título, generación, filtros, total, encabezados destacados, autofiltro, congelación, anchos y formato de fechas. PDF incluye encabezado institucional, tabla horizontal, encabezados repetidos por página, paginación, total y pie del sistema.

## Pruebas realizadas

- Backend: `npm run typecheck` — correcto.
- Backend: `npm run build` — correcto.
- Backend: `npm test -- --run` — **36 archivos, 138 pruebas correctas**.
- Frontend: `npm run typecheck` — correcto.
- Frontend: `npm run build` — correcto.
- Se validaron buffers XLSX (`PK`) y PDF (`%PDF-`), incluyendo resultado vacío y protección de fórmulas.

No se ejecutaron consultas contra SQL Server real ni pruebas con datos reales.

## Limitaciones y pendientes

El PDF usa tipografía estándar y normaliza caracteres fuera de WinAnsi para conservar compatibilidad sin incorporar otra dependencia; textos muy extensos se acortan en las celdas de tabla. Las alertas administrativas no forman parte de esta entrega y quedan pendientes según el plan de reportería.

No se modificaron tablas, procedimientos, migraciones, datos, reglas de negocio, autenticación institucional, configuración del VPS ni despliegues.
