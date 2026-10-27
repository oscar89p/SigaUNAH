# Diagnóstico técnico: Alertas administrativas internas

## 1. Alcance y método

Este diagnóstico es documental y se basa únicamente en el código TypeScript/Vue y en las definiciones SQL versionadas en el repositorio. No se ejecutó SQL Server, por lo que la existencia de datos, catálogos activos y la aplicación efectiva de scripts pendientes deben validarse en el ambiente institucional.

No se propone crear tablas de alertas. Las cinco situaciones evaluadas pueden calcularse, en principio, como consultas de solo lectura sobre entidades existentes. El diagnóstico no propone marcar alertas como atendidas, cambiar estados ni enviar notificaciones.

## 2. Componentes existentes

### Backend

| Área | Archivos principales | Capacidades reutilizables |
|---|---|---|
| Solicitudes | `backend/src/modules/solicitudes/solicitudes.{routes,service,repository,types}.ts` | Listado paginado, estados, opciones, relación con beneficiario y asignación vigente. |
| Beneficiarios | `backend/src/modules/beneficiarios/*` | Identificación, estado activo y datos de persona/cuenta. |
| Tarjetas y asignaciones | `backend/src/modules/tarjetas/*` | Listado de tarjetas, asignaciones vigentes/históricas, vigencias, disponibilidad y diagnóstico administrativo. |
| Reportes | `backend/src/modules/reportes/*` | Consultas paginadas de solicitudes/asignaciones, filtros, resumen y exportación. |
| Seguridad | `backend/src/modules/auth/authorization.ts` y `auth-context.ts` | Autorización centralizada por método y prefijo de ruta. |
| Persistencia común | `shared/database/pool.ts`, `shared/pagination/query.ts`, `shared/errors/*` | Pool SQL Server, validación de paginación y mapeo de errores. |

### Frontend

| Componente | Evidencia | Reutilización prevista |
|---|---|---|
| `ReportsView.vue` | Tabs, filtros, actualización manual e indicadores | Base visual para una bandeja de alertas o una pestaña administrativa. |
| `DataGrid.vue` | Tabla, estados de carga/error/vacío y paginación | Listado de alertas con acciones de navegación. |
| `StatusBadge.vue` | Estados visuales del BackOffice | Prioridad y estado visual de cada alerta. |
| `PageHeader.vue`, `AppBreadcrumb.vue` | Encabezado y breadcrumb | Nueva vista consistente con el BackOffice. |
| `frontend/src/services/reportes.ts` | Tipos y clientes HTTP paginados | Contratos de consulta; no se debe forzar una alerta a ser un reporte si requiere semántica propia. |
| Router y navegación | `frontend/src/router/index.ts`, `useNavigation.ts` | Protección de vista y menú dinámico existente. |

## 3. Modelo de datos verificado

### Solicitudes y beneficiarios

`Solicitudes.tblSolicitudes` contiene `idSolicitud`, `codigoSolicitud`, `idBeneficiario`, `idEstadoSolicitud`, `fechaSolicitud`, `fechaInicioSolicitada`, `fechaFinSolicitada`, `fechaResolucion`, `idUsuarioResolucion`, `estadoSolicitud` y fechas de auditoría. La FK `fkSolicitud_Beneficiario` vincula la solicitud con `Beneficiarios.tblBeneficiarios`.

El beneficiario contiene `idPersona`, `numeroCuenta`, `codigoCarne`, `estadoAcademico`, `estadoBeneficiario` y `fechaRegistro`. El nombre mostrado se obtiene mediante `tblPersonas`. La solicitud no contiene un `idTarjeta`; esa relación vive en asignaciones.

El estado de solicitud es un catálogo mediante `idEstadoSolicitud` hacia `Tipos.tblTiposValores`. El código `PENDIENTE` se busca explícitamente al crear solicitudes; la transición de gestión solo permite pasar de `PENDIENTE` a `APROBADA` o `RECHAZADA`. La asignación cambia la solicitud aprobada a `ASIGNADA`, siempre que el catálogo activo contenga ese valor.

`Solicitudes.tblSolicitudesEstados` conserva cambios de estado, pero su `fechaRegistro` es fecha de transición, no necesariamente la fecha de creación de la solicitud. Para antigüedad de una pendiente, la fecha base verificable es `tblSolicitudes.fechaSolicitud` o `fechaRegistro`; escoger una de ellas requiere decisión funcional.

### Tarjetas y asignaciones

`Tarjetas.tblAsignaciones` contiene `idSolicitud`, `idBeneficiario`, `idTarjeta`, `idTipoVigencia`, `idEstadoAsignacion`, `fechaAsignacion`, `fechaInicioVigencia`, `fechaFinVigencia`, `fechaDevolucion`, `esAsignacionVigente`, `estadoAsignacion` y fechas de auditoría. Las FKs relacionan la asignación con solicitud, beneficiario y tarjeta en la definición SQL.

`Tarjetas.tblTarjetas` contiene `idTarjeta`, `codigoTarjeta`, `idEstadoTarjeta`, `fechaAlta`, `fechaBaja`, `requiereRevision`, `estadoTarjeta` e `idTipoTarjeta`. El estado administrativo es un catálogo `ESTADO_TARJETA`; el código se muestra mediante `Tipos.tblTiposValores`.

`Tarjetas.tblAsignacionesEstados` y `tblTarjetasEstados` conservan la trazabilidad de estados. La consulta de historial de reportes también combina historiales de solicitudes, asignaciones y tarjetas.

## 4. Consultas y servicios reutilizables

### Solicitudes

`reportes.repository.requests()` ya:

- une solicitud, beneficiario, persona, estado, período y tipo de solicitud;
- obtiene la asignación vigente con `OUTER APPLY` sobre `tblAsignaciones` usando `idSolicitud` y `esAsignacionVigente=1`;
- expone `tieneAsignacionVigente`, `idAsignacion`, `idTarjeta` y `codigoTarjeta`;
- admite `codigoEstadoSolicitud`, beneficiario, período, búsqueda, fechas y `sinAsignacion`;
- devuelve paginación uniforme.

`solicitudes.repository.ts` usa la misma relación para el listado operacional. `tarjetas.repository.ts` usa `validRequests()` para solicitudes `APROBADA` y excluye las que ya tienen asignación vigente.

### Asignaciones

`reportes.repository.assignments()` ya implementa las reglas actuales de:

- `vigentes`: `a.esAsignacionVigente=1` y fecha final nula o no menor que la fecha actual;
- `vencidas`: `a.esAsignacionVigente=1` y `a.fechaFinVigencia < CONVERT(date,GETDATE())`;
- `proximas`: asignación vigente y fecha final desde hoy hasta el límite calculado con `proximasDias`;
- `finalizadas`: `a.esAsignacionVigente=0`.

También calcula `diasRestantes` mediante `DATEDIFF` y devuelve solicitud, beneficiario, tarjeta y estado de asignación.

### Inconsistencias

`tarjetas.repository.ts` expone `availabilityDiagnostics()` y la consulta `availabilityDiagnosticsQuery`. La consulta identifica, entre otros casos, tarjeta `DISPONIBLE` con asignación vigente, tarjeta `ASIGNADA` sin asignación vigente, y tarjeta `BAJA` o `BLOQUEADA` con asignación vigente. El script `database/pendientes/10_diagnostico_consistencia_tarjetas.sql` contiene la misma lógica diagnóstica.

Esta consulta es una base reutilizable para inconsistencias de estado tarjeta/asignación, pero no cubre por sí sola fechas inconsistentes, relación solicitud-beneficiario divergente ni toda posible regla de negocio.

## 5. Estados y reglas reales observados

Los códigos usados explícitamente por el backend son:

- Solicitud: `PENDIENTE`, `APROBADA`, `RECHAZADA`, `ASIGNADA`.
- Tarjeta: `DISPONIBLE`, `ASIGNADA`, `BLOQUEADA`, `BAJA`.
- Asignación: el código se obtiene del catálogo `ESTADO_ASIGNACION`; el repositorio identifica `DEVUELTA` para la devolución, pero no establece un estado universal de `VENCIDA`.

Los códigos son valores de catálogo activos y deben confirmarse en SQL Server. No debe usarse el texto visible como sustituto del catálogo ni suponerse que todos los estados históricos siguen activos.

La vigencia operativa no se reduce al estado de catálogo: el backend utiliza `esAsignacionVigente=1`. En la consulta de reportes, una asignación vigente sin fecha final se considera vigente; una con fecha final anterior a hoy se reporta vencida aunque conserve la bandera vigente. Esto revela una situación potencialmente inconsistente que requiere decisión sobre si debe generar alerta o corregirse mediante operación administrativa.

## 6. Seguridad y autorización

El hook global de Fastify resuelve permisos mediante `permissionFor()`.

- `GET /api/v1/reportes/*` requiere `REPORTES_CONSULTAR`.
- Exportaciones requieren `REPORTES_EXPORTAR`.
- Solicitudes usan `SOLICITUDES_CONSULTAR` para GET y permisos separados para escritura/gestión.
- Tarjetas y asignaciones usan `TARJETAS_CONSULTAR` para GET y permisos operativos para cambios.
- La vista de reportes exige `REPORTES_CONSULTAR` en el router.

No existe actualmente un permiso `ALERTAS_*`. Crear uno sería una decisión de seguridad y requeriría cambios de catálogo, perfiles, backend, navegación y frontend; no está autorizado en esta entrega documental. Como primera alternativa, una consulta de solo lectura podría heredar `REPORTES_CONSULTAR`, sujeto a aprobación institucional.

La autorización del backend es la autoridad; ocultar una opción en Vue no sustituye el control del endpoint.

## 7. Riesgos y dependencias

1. **Catálogos no verificados en ambiente:** el repositorio usa códigos, pero los documentos no prueban qué valores están activos en producción.
2. **Antigüedad de pendientes:** debe decidirse si se mide desde `fechaSolicitud`, `fechaRegistro` o el último cambio en `tblSolicitudesEstados`.
3. **Aprobada sin asignación:** la ausencia de asignación vigente es verificable; no demuestra por sí sola que la asignación ya deba realizarse ni que se haya incumplido un plazo.
4. **Vencimiento:** no existe estado específico de asignación vencida usado por las consultas revisadas; se calcula con fecha y bandera de vigencia.
5. **Conflicto de esquema/índice:** `SIGADll.sql` define `ukAsignacion_TarjetaVigente` como índice único sobre `idTarjeta`, mientras documentación y scripts pendientes hablan de un índice filtrado por `esAsignacionVigente=1`. Debe verificarse el esquema efectivo antes de interpretar históricos o modificar consultas.
6. **Fechas y zona horaria:** SQL usa `GETDATE()`/`SYSDATETIME()` y fechas `date`/`datetime2`; debe aprobarse el criterio de fecha institucional.
7. **Inconsistencias de datos:** las FKs reducen relaciones huérfanas, pero no garantizan que `idBeneficiario` de una asignación coincida con el beneficiario de su solicitud.
8. **Visibilidad:** los reportes muestran nombre, cuenta y códigos operativos; se debe confirmar qué perfiles pueden ver cada dato.
9. **Sin persistencia de alertas:** al ser calculadas, una alerta puede desaparecer cuando cambia el registro. No habrá historial ni “atendida” sin una decisión adicional y almacenamiento.

## 8. Conclusión técnica

Las alertas de solicitudes pendientes, aprobadas sin asignación, próximas a vencer y vencidas son técnicamente calculables mediante consultas de solo lectura y reutilización directa del repositorio de reportes. Las inconsistencias operativas son parcialmente implementables: el diagnóstico tarjeta/asignación está sustentado, mientras que otras reglas requieren validación funcional y datos reales.

La recomendación es iniciar como **módulo de consulta administrativa independiente**, reutilizando consultas y componentes de reportería, sin crear persistencia de alertas. No se recomienda mezclar indicadores de alerta con reportes generales sin definir antes permisos, severidad y navegación.
