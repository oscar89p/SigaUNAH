# Plan de implementación: Alertas administrativas internas

## 1. Recomendación arquitectónica

Implementar un módulo de consulta independiente, por ejemplo `backend/src/modules/alertas`, que reúna resultados calculados de solicitudes, asignaciones e inconsistencias. Debe ser de solo lectura en la primera fase y no debe crear registros de alerta.

La vista puede ser independiente de `ReportsView.vue`, pero reutilizará sus patrones visuales y tipos de resultado. Esto separa:

- reportería histórica y exportable;
- alertas operativas accionables;
- futura evolución hacia atención, responsables o auditoría, si se aprueba.

No se recomienda agregar simplemente otra pestaña a reportes si se desea prioridad, navegación y estado de atención. Sí se recomienda reutilizar las consultas y componentes existentes.

## 2. API propuesta

Los endpoints de consulta quedaron implementados; no tienen operaciones de modificación.

| Endpoint propuesto | Propósito | Permiso inicial sugerido |
|---|---|---|
| `GET /api/v1/alertas/resumen` | Totales por tipo de alerta y prioridad calculada. | Reutilizar `REPORTES_CONSULTAR`, sujeto a decisión. |
| `GET /api/v1/alertas` | Listado unificado paginado de alertas. | Reutilizar `REPORTES_CONSULTAR`, sujeto a decisión. |
| `GET /api/v1/alertas/opciones` | Catálogos y valores de filtro necesarios. | `REPORTES_CONSULTAR`. |
| `GET /api/v1/alertas/solicitudes-pendientes` | Detalle específico de pendientes. | `REPORTES_CONSULTAR`. |
| `GET /api/v1/alertas/aprobadas-sin-asignacion` | Detalle específico de aprobadas sin asignación vigente. | `REPORTES_CONSULTAR`. |
| `GET /api/v1/alertas/asignaciones-proximas` | Asignaciones próximas a vencer, con días restantes. | `REPORTES_CONSULTAR`. |
| `GET /api/v1/alertas/asignaciones-vencidas` | Asignaciones vencidas, con días restantes. | `REPORTES_CONSULTAR`. |
| `GET /api/v1/alertas/inconsistencias` | Diagnóstico de combinaciones incompatibles verificables. | `REPORTES_CONSULTAR`. |

La alternativa mínima es un solo endpoint paginado con `tipo`, `page`, `pageSize`, búsqueda, beneficiario, fechas y `diasProximos`. La decisión depende de si el frontend necesita cargar un tablero resumido y luego detalles especializados.

## 3. Backend propuesto

### Archivos nuevos

- `backend/src/modules/alertas/alertas.routes.ts`
- `backend/src/modules/alertas/alertas.service.ts`
- `backend/src/modules/alertas/alertas.repository.ts`
- `backend/src/modules/alertas/alertas.types.ts`
- pruebas unitarias y de integración del módulo.

### Archivos a modificar posteriormente

- `backend/src/server.ts`, para registrar las rutas.
- `backend/src/modules/auth/authorization.ts`, para mapear el permiso elegido.
- eventualmente tipos/pruebas de autorización.

### Reutilización obligatoria

1. Copiar/adaptar, no duplicar sin criterio, la paginación de `reportes.repository.ts` (`page`, `pageSize`, `total`, `totalPages`).
2. Reutilizar joins de `requests()` para solicitud-beneficiario-asignación vigente.
3. Reutilizar filtros de `assignments()` para vigencia y días restantes.
4. Reutilizar `availabilityDiagnosticsQuery` para inconsistencias tarjeta/asignación.
5. Usar parámetros SQL de `mssql`, sin interpolar valores del usuario.
6. Mantener `mapSqlError()` y `HttpError` con el patrón actual.

### Contrato sugerido

Cada fila debería devolver, cuando exista:

- `tipoAlerta`;
- `prioridad` calculada por regla aprobada;
- `idSolicitud`, `codigoSolicitud`;
- `idAsignacion`, `idTarjeta`, `codigoTarjeta`;
- `idBeneficiario`, `nombreBeneficiario`;
- estado actual;
- fecha base y días de antigüedad/restantes;
- descripción técnica de la condición.

Los campos exactos deben cerrarse con los tipos reales antes de codificar.

## 4. Frontend propuesto

### Archivos nuevos

- `frontend/src/services/alertas.ts`
- `frontend/src/views/AlertasView.vue`
- opcionalmente `frontend/src/components/AlertSummaryCard.vue` y `AlertTypeBadge.vue` si el patrón se repite.

### Reutilización

- `DataGrid.vue` para listado y paginación.
- `PageHeader.vue` y `AppBreadcrumb.vue`.
- `StatusBadge.vue` o una variante visual para prioridad.
- `useAuthSession.ts` para visibilidad por permiso.
- estilos existentes de `ReportsView.vue` y `main.css`.

### Interfaz propuesta

1. Indicadores superiores: pendientes, aprobadas sin asignación, próximas a vencer, vencidas e inconsistencias.
2. Filtro por tipo de alerta.
3. Filtro de prioridad, si la prioridad funcional es aprobada.
4. Búsqueda por solicitud, tarjeta, cuenta o beneficiario.
5. Filtro de beneficiario y fechas cuando aplique.
6. Campo configurable de días próximos, con propuesta inicial de 30 días.
7. Botón explícito `Actualizar`; no se requiere actualización automática.
8. Tabla paginada con fecha, descripción, estado, beneficiario y acciones.
9. Acciones de navegación a `/solicitudes/:id`, `/tarjetas/:id/gestionar` o `/beneficiarios/:id` solo cuando exista el identificador y el usuario tenga acceso.

No debe existir botón de “resolver”, “marcar atendida” o cambio de estado mientras no exista persistencia y auditoría aprobadas.

## 5. Permisos y navegación

La opción conservadora es proteger los endpoints y la vista con `REPORTES_CONSULTAR`, porque todas las fuentes son actualmente reportería de solo lectura. `REPORTES_EXPORTAR` solo sería necesario si se autoriza exportar alertas.

La opción separada (`ALERTAS_CONSULTAR`) ofrece mejor segregación, pero exige crear el permiso en catálogos, asociarlo a perfiles y actualizar autorización/navegación. No se recomienda crear ese permiso durante la implementación sin aprobación funcional y de seguridad.

La ruta frontend propuesta sería `/alertas` bajo `AdminLayout`, con `requiredPermission` igual al permiso aprobado. El menú debe integrarse mediante el mecanismo dinámico existente; no se debe asumir que agregar la ruta Vue por sí solo hace visible la navegación.

## 6. Parámetros y reglas a cerrar

- Fecha de antigüedad para solicitudes pendientes: `fechaSolicitud`, `fechaRegistro` o último cambio.
- Umbral de solicitud pendiente y de aprobada sin asignación.
- Valor inicial para próximas a vencer: se propone 30 días, pero el reporte actual usa default 15.
- Inclusión del día actual y tratamiento del límite final.
- Tratamiento de `fechaFinVigencia IS NULL`.
- Si una asignación vencida pero `esAsignacionVigente=1` es alerta, inconsistencia o ambas.
- Si `esAsignacionVigente=0` excluye siempre una asignación vencida.
- Prioridades y responsables por tipo.
- Visibilidad de cuenta, identificación y datos de beneficiario.
- Si la ausencia de tarjeta disponible debe ser alerta: no existe actualmente una regla de negocio que lo establezca.

## 7. Pruebas requeridas

### Tipos y reglas

- Validar query params, límites de `pageSize` y días próximos.
- Validar que fechas desde/hasta sean coherentes.
- Probar clasificación de los cinco tipos sin acceso a SQL real mediante fixtures.

### Repositorio/SQL

- Solicitud `PENDIENTE` incluida y estados distintos excluidos.
- Solicitud `APROBADA` con y sin asignación vigente.
- Asignación sin fecha final excluida de próximas/vencidas.
- Asignación con fecha final exactamente hoy.
- Asignación con fecha final en 30 días.
- Asignación vencida pero bandera vigente.
- Tarjeta `DISPONIBLE` con asignación vigente.
- Tarjeta `ASIGNADA` sin asignación vigente.
- Tarjeta `BAJA` o `BLOQUEADA` con asignación vigente.
- Paginación y total consistentes.

### Seguridad

- GET permitido con el permiso aprobado.
- GET rechazado sin permiso.
- Exportación, si se agrega, separada por `REPORTES_EXPORTAR`.
- Navegación a detalles respetando permisos existentes.

### Frontend

- Indicadores coinciden con el resumen.
- Filtros reinician la página.
- Actualización manual conserva criterios.
- Estados de carga, error y vacío.
- No se muestran acciones operativas no autorizadas.

## 8. Orden de implementación posterior

1. Revisar y ejecutar controladamente el script de parámetros, sin modificar el esquema.
2. Verificar catálogos activos y esquema efectivo del índice de asignaciones en SQL Server.
3. Ejecutar pruebas SQL/integración y autorización en ambiente autorizado.
4. Validar resultados con personal administrativo antes de cualquier despliegue.

## 9. Archivos que se modificarían en fase de desarrollo

| Archivo | Tipo de cambio futuro |
|---|---|
| `backend/src/server.ts` | Registrar rutas del módulo. |
| `backend/src/modules/auth/authorization.ts` | Mapear permiso elegido. |
| `backend/src/modules/alertas/*` | Crear módulo de consulta y pruebas. |
| `frontend/src/services/alertas.ts` | Cliente HTTP y tipos de respuesta. |
| `frontend/src/views/AlertasView.vue` | Bandeja de alertas. |
| `frontend/src/router/index.ts` | Ruta protegida. |
| configuración dinámica de navegación | Registrar menú únicamente si se aprueba y mediante el mecanismo existente. |
| `frontend/src/components/*` | Solo si se justifican componentes nuevos. |

No se prevén modificaciones de tablas ni migraciones para la primera versión de consulta. Si posteriormente se requiere historial de atención, deberán diseñarse tabla, permisos, auditoría y flujo separados.

## 10. Resultado esperado de la primera versión

Una pantalla administrativa de solo lectura que calcule alertas en tiempo real bajo demanda, con paginación, filtros y navegación a registros existentes. No cambiará automáticamente solicitudes, tarjetas o asignaciones y no presentará alertas cuya regla no esté sustentada por el modelo o aprobada funcionalmente.
