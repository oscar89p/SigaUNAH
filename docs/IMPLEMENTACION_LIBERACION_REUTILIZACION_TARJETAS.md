# Liberación y reutilización de tarjetas

## Componentes modificados

- `frontend/src/views/BeneficiarioDetalleView.vue`: acción **Liberar tarjeta** únicamente en asignaciones vigentes y para `TARJETAS_DESACTIVAR`; actualización local de vigentes/históricas tras éxito.
- `frontend/src/components/LiberarTarjetaModal.vue`: confirmación con código, serie, beneficiario, fecha y motivo; conserva el modal abierto ante errores.
- `frontend/src/services/tarjetas.ts`: contrato de asignación con número de serie.
- `backend/src/modules/tarjetas/tarjetas.repository.ts`: endurecimiento de la devolución existente con bloqueo transaccional y validación de unicidad vigente.

## Diagnóstico posterior

El endpoint `GET /api/v1/tarjetas/asignacion-opciones` ya consultaba y devolvía correctamente `idTipoValor`, `codigoTipoValor` y `nombreTipoValor` para los valores activos de `ESTADO_ASIGNACION`. La causa estaba en el modal: buscaba `DEVOL`, `LIBER` o `RETOR`, pero el código funcional real es `DEVUELTA`; por tanto `find()` no encontraba la opción y `stateId` permanecía en cero.

La corrección ahora resuelve exactamente `codigoTipoValor.trim().toUpperCase() === "DEVUELTA"`. No se usa el ID 29. Si el catálogo no está disponible, el estado está ausente o inactivo, el modal conserva el error y el botón permanece deshabilitado.

## Endpoint y reglas aplicadas

Se reutiliza `PATCH /api/v1/tarjetas/asignaciones/:id/devolucion`, protegido por `TARJETAS_DESACTIVAR`; no se creó un endpoint duplicado.

La operación:

1. valida que la asignación exista y siga vigente;
2. bloquea la tarjeta y la asignación dentro de una transacción SQL Server;
3. marca `esAsignacionVigente=0`, registra fecha de devolución y responsable;
4. registra el motivo en `Tarjetas.tblAsignacionesEstados` y auditoría;
5. rechaza una segunda liberación y cualquier asignación vigente residual;
6. conserva la fila histórica. La consulta existente de disponibles la vuelve elegible solo si sigue activa y no tiene asignación vigente.

## Validaciones ejecutadas

- Backend typecheck: correcto.
- Backend build: correcto.
- Backend pruebas automatizadas: **112/112 aprobadas**.
- Frontend typecheck: correcto.
- Frontend build: correcto.
- `git diff --check`: correcto.
- No se ejecutaron scripts SQL, no se modificaron datos reales, no se hicieron commits, push ni despliegue.

## Pendiente SQL indispensable

El código depende de que SQL Server institucional tenga aplicado/verificado el índice único filtrado `ukAsignacion_TarjetaVigente` sobre `idTarjeta WHERE esAsignacionVigente = 1`. El script existente `database/pendientes/02_reutilizacion_tarjetas.sql` debe ser revisado y ejecutado por el DBA con autorización; no se ejecutó durante esta implementación.

No se requieren tablas nuevas ni cambios de esquema para registrar el motivo: `tblAsignacionesEstados.motivoCambio` ya lo soporta.
