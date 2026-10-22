# Implementación P2 — Tarjetas y accesos

## Alcance

Se implementó el flujo operativo sobre el modelo existente de `DbSigaUNAH`, sin migraciones ni cambios de permisos:

- Consulta de asignaciones vigentes e históricas.
- Consulta de tarjetas disponibles (tarjetas activas sin registro previo de asignación).
- Asignación transaccional a beneficiario y solicitud compatible.
- Relación opcional de la asignación con un perfil de acceso.
- Consulta de perfiles de acceso y elevadores autorizables.
- Devolución, renovación y reemplazo con transacciones SQL.
- Historial de estados en `Tarjetas.tblAsignacionesEstados`.
- Reemplazos en `Tarjetas.tblTarjetasReemplazos`.
- Auditoría en `Auditoria.tblBitacoras`.
- Pantalla Vue 3/TypeScript orientada a operación; no administra inventario físico.

## Endpoints

| Operación | Endpoint | Permiso |
|---|---|---|
| Asignaciones | `GET /api/v1/tarjetas/asignaciones` | `TARJETAS_CONSULTAR` |
| Disponibles | `GET /api/v1/tarjetas/disponibles` | `TARJETAS_CONSULTAR` |
| Opciones de acceso | `GET /api/v1/tarjetas/acceso-opciones` | `TARJETAS_CONSULTAR` |
| Asignar | `POST /api/v1/tarjetas/asignaciones` | `TARJETAS_ASIGNAR` |
| Devolver | `PATCH /api/v1/tarjetas/asignaciones/:id/devolucion` | `TARJETAS_DESACTIVAR` |
| Renovar | `POST /api/v1/tarjetas/asignaciones/:id/renovacion` | `TARJETAS_RENOVAR` |
| Reemplazar | `POST /api/v1/tarjetas/asignaciones/:id/reemplazo` | `TARJETAS_ASIGNAR` |

Los identificadores de estados y vigencias se reciben desde las opciones de SQL Server. No se codificaron IDs ni nombres de estados en la aplicación.

## Dependencias y bloqueos del modelo

1. `ukAsignacion_TarjetaVigente` es un índice único sobre `tblAsignaciones(idTarjeta)`, no filtrado por `esAsignacionVigente`. Por seguridad, una tarjeta devuelta no se ofrece como disponible y no se reutiliza. Para permitir reutilización conservando historial se requiere una modificación de esquema autorizada; no se ejecutó.
2. El esquema no contiene una tabla específica de “elevadores por asignación”. La relación disponible es `tblAsignacionesPerfilesAcceso -> tblPerfilesAcceso -> tblPerfilesAccesoElevadores`; la aplicación asigna el perfil y consulta sus elevadores. La administración de perfiles y elevadores queda fuera de esta entrega.
3. No se inventaron transiciones de solicitud ni se cambia automáticamente el estado de una solicitud al asignar; el modelo no define una regla inequívoca para esa transición.
4. Las operaciones requieren que el actor tenga los permisos existentes en SQL Server. No se modificaron permisos ni se ejecutaron escrituras institucionales de prueba.

## Estado

### Terminadas

Backend, transacciones, validaciones de beneficiario/solicitud/tarjeta, auditoría, historial, RBAC y pantalla operativa de asignación.

### Pendientes

Pruebas autenticadas contra un SQL Server institucional con datos autorizados; interfaz específica para ejecutar devolución, renovación y reemplazo desde el detalle de una asignación; administración de perfiles de acceso y sus elevadores.

### Bloqueadas

Reutilización de tarjetas devueltas, por el índice único no filtrado descrito arriba. Requiere aprobación explícita antes de una migración.

## Validación ejecutada

- Backend typecheck: aprobado.
- Frontend typecheck: aprobado.
- Backend build: aprobado.
- Frontend build: aprobado.
- Pruebas automatizadas P1 existentes: **60/60 aprobadas**.
- Pruebas de contratos P2 agregadas: **3/3 aprobadas**; total actual **63/63**.
- Pruebas autenticadas/integración contra datos institucionales: no ejecutadas.
