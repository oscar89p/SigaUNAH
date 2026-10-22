# Matriz de cobertura funcional — SIGA UNAH

## Método y recuento

Matriz para las 83 tablas verificadas en SQL Server. Los estados son por inspección de código; no implican validación de navegador. “API existente” indica handler declarado, no acceso efectivo.

**Recuento:** COMPLETO 5 · PARCIAL 10 · PENDIENTE 42 · NO REQUIERE CRUD independiente 26. De las tablas verificadas, 57 tienen interfaz/workflow CRUD identificado; 42 flujos CRUD siguen pendientes. Las 26 filas restantes son relaciones, historial, sistema o datos sensibles, y se gestionan como lectura o desde su entidad padre.

## Inventario API

Backend: `backend/src/server.ts`, `backend/src/modules/*/*.routes.ts`, contratos en `*.types.ts`, validación Zod y repositorios SQL parametrizados. 75 declaraciones Fastify: GET 37, POST 13, PUT 14, PATCH 11. No hay DELETE físico. Listados paginados hasta pageSize 100 con search/sort/filtros descritos. Toda escritura exige sesión, RBAC y CSRF.

| Recurso | Métodos/operación | Paging/búsqueda/filtros | Validación, permiso, estado |
|---|---|---|---|
| `/health`, `/health/database` | GET estado | — | Públicos; el segundo hace SELECT de salud SQL. |
| `/api/v1/auth/login`, `/me`, `/logout` | POST/GET/POST | — | Zod/Argon2id, cookie persistente; logout CSRF. |
| `/api/v1/campus`, `/edificios`, `/elevadores`, `/dispositivos` y subrutas | GET/POST/PUT/PATCH estado | paging, search, estado (all/active/inactive), sortBy/direction | GET usa `ACCESOS_CONSULTAR`; 12 writes usan cuatro códigos nuevos aún no provisionados. |
| `/api/v1/beneficiarios[/:id]`, `/opciones` | GET/POST/PUT/PATCH estado | paging, search, sort | Cuatro códigos BENEFICIARIOS; acceso backend mapeado. |
| `/api/v1/solicitudes[/:id]`, `/opciones`, `/:id/estado` | GET/POST/PUT/PATCH transición | paging, search, idEstadoSolicitud, sort | Zod/rango de fechas/transacción; cuatro códigos propuestos no están en catálogo, las 6 declaraciones son denegadas. |
| `/api/v1/tarjetas[/:id]`, `/opciones`, `/:id/estado` | GET/POST/PUT/PATCH | paging, search, sort | Códigos CONSULTAR/ASIGNAR/ACTIVAR; PATCH también se usa para desactivar; códigos separados del catálogo sin uso. |
| `/api/v1/seguridad/usuarios[/:id]`, `/seguridad/perfiles` | GET/POST/PUT/PATCH | paging, search, estado, sort | `USUARIOS_ADMINISTRAR`; Zod, Argon2id, auditoría y protección último admin. |
| `/api/v1/seguridad/admin/perfiles...` | CRUD perfil, usuarios, permisos, navegación | paging/search/estado | Zod, transacción/auditoría; `PERFILES_ADMINISTRAR`. |
| `/api/v1/seguridad/admin/permisos...` | GET/POST/PUT/PATCH y perfiles | paging/search/módulo/perfil/estado | Códigos acotados; alta API no admite los códigos P1 nuevos; `PERMISOS_ADMINISTRAR`. |
| `/api/v1/seguridad/admin/navegaciones...` | GET/POST/PUT/PATCH | paging/search/estado/perfil | valida ruta/duplicado/padre/ciclo; requiere `NAVEGACION_ADMINISTRAR` (propuesto, no provisionado). |
| `/api/v1/seguridad/admin/configuracion...` | GET/PUT | sin paging | Sólo `valorPredeterminado`, Zod tipo/filtro sensible heurístico; `CONFIGURACION_ADMINISTRAR`. |
| `/api/v1/seguridad/admin/auditoria...` | GET lista/detalle | paging, fechas, user, evento, resultado; fecha desc | Read-only; bitácora e intentos; logs sistema excluidos; `AUDITORIA_CONSULTAR`. |
| `/api/v1/operaciones/monitoreo/accesos`, `/incidentes` | GET solo lectura | paging, search, fecha desde/hasta, resultado/tarjeta/elevador/dispositivo; severidad/resuelto | Zod, fechas orden desc; permiso existente `ACCESOS_HISTORIAL`. |
| `/api/v1/seguridad/mi-navegacion` | GET navegación dinámica | — | Sesión obligatoria; perfiles/asignaciones activas y opciones visibles. |

**RBAC P1:** las 4 lecturas de infraestructura usan `ACCESOS_CONSULTAR` existente; sus writes están mapeados en código a `CAMPUS_ADMINISTRAR`, `EDIFICIOS_ADMINISTRAR`, `ELEVADORES_ADMINISTRAR`, `DISPOSITIVOS_ADMINISTRAR`, pendientes de aprobación/provisión. Solicitudes usa `SOLICITUDES_CONSULTAR/REGISTRAR/MODIFICAR/GESTIONAR`, también pendientes de provisión. Monitoreo usa `ACCESOS_HISTORIAL`; navegación usa `NAVEGACION_ADMINISTRAR`, pendiente. Sin filas/asignaciones nuevas, el backend deniega por defecto; no se reutiliza permiso de lectura para writes. La propuesta SQL separada está en `docs/propuesta-permisos-navegacion-p1.sql` y no se ejecutó.

## Matriz por tabla

Las rutas/opciones muestran menú actual de SQL Server. “Sin opción DB” es diferencia verificada, no inferida del archivo comentado.

| Esquema | Tabla | Tipo de entidad | API existente | CRUD backend | Vista frontend | CRUD frontend | Ruta | Opción de navegación | Estado | Prioridad | Acción recomendada |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Academico | tblCarreras | Catálogo/configuración | GET indirecto en `/api/v1/beneficiarios/opciones` | Solo lectura de opciones; sin CRUD | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API CRUD si SIGA será dueño del catálogo; confirmar fuente académica. |
| Academico | tblCentrosUniversitarios | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Academico | tblFacultades | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Academico | tblInstituciones | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Academico | tblMatriculas | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Confirmar dueño del dato; solo lectura si proviene de sistema académico. |
| Academico | tblPeriodosAcademicos | Catálogo/configuración | GET indirecto en `/api/v1/solicitudes/opciones` | Solo lectura de opciones; sin CRUD | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API CRUD si SIGA será dueño del catálogo; confirmar fuente académica. |
| Accesos | tblAsignacionesPerfilesAcceso | Transaccional | — | —; resource API pending | — | —; pantalla pendiente | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Accesos | tblCampus | Catálogo/configuración | GET/POST/PUT/PATCH /api/v1/campus[/:id[/estado]] | GET ACCESOS_CONSULTAR; writes CAMPUS_ADMINISTRAR (no provisionado) | CampusView.vue | Lectura; CRUD visible solo con permiso nuevo | /campus | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y asignar opción de menú a perfiles autorizados. |
| Accesos | tblDispositivos | Transaccional | GET/POST/PUT/PATCH /api/v1/dispositivos[/:id[/estado]] | GET ACCESOS_CONSULTAR; writes DISPOSITIVOS_ADMINISTRAR (no provisionado) | DevicesView.vue | Lectura; CRUD visible solo con permiso nuevo | /dispositivos | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y asignar opción de menú a perfiles autorizados. |
| Accesos | tblEdificios | Transaccional | GET/POST/PUT/PATCH /api/v1/edificios[/:id[/estado]] | GET ACCESOS_CONSULTAR; writes EDIFICIOS_ADMINISTRAR (no provisionado) | BuildingsView.vue | Lectura; CRUD visible solo con permiso nuevo | /edificios | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y asignar opción de menú a perfiles autorizados. |
| Accesos | tblElevadores | Transaccional | GET/POST/PUT/PATCH /api/v1/elevadores[/:id[/estado]] | GET ACCESOS_CONSULTAR; writes ELEVADORES_ADMINISTRAR (no provisionado) | ElevatorsView.vue | Lectura; CRUD visible solo con permiso nuevo | /elevadores | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y asignar opción de menú a perfiles autorizados. |
| Accesos | tblPerfilesAcceso | Catálogo/configuración | — | —; resource API pendiente | — | —; pantalla pendiente | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Accesos | tblPerfilesAccesoElevadores | Transaccional | — | —; resource API pendiente | — | —; pantalla pendiente | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Accesos | tblVersionesPerfilesAcceso | Transaccional | — | —; resource API pendiente | — | —; pantalla pendiente | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Auditoria | tblBitacoras | Relación/historial/técnica | GET auditoría (BITACORA) | Sin CRUD propio; relación/historial/sistema | AuditView.vue, solo lectura | Lectura/detalle; no muta | /administracion/auditoria | ADMIN_AUDITORIA | NO REQUIERE CRUD | — | Solo lectura; AuditView ya consulta. |
| Auditoria | tblIntentosAutenticacion | Relación/historial/técnica | Auth escribe; GET auditoría (AUTENTICACION) | Sin CRUD propio; relación/historial/sistema | AuditView.vue, solo lectura | Lectura/detalle; no muta | /administracion/auditoria | ADMIN_AUDITORIA | NO REQUIERE CRUD | — | Solo lectura; AuditView ya consulta. |
| Auditoria | tblLogsSistema | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (visor pendiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Añadir visor de logs P3, sin mutaciones. |
| Beneficiarios | tblBeneficiarios | Transaccional | GET/POST/PUT/PATCH /api/v1/beneficiarios; GET opciones | R/C/U/estado (Zod) | BeneficiariosView.vue | R/C/U/estado, formulario compuesto | /beneficiarios | BENEFICIARIOS | COMPLETO | — | Mantener; falta prueba funcional visual. |
| Beneficiarios | tblBeneficiariosCondiciones | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Beneficiarios | tblExpedientes | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Beneficiarios | tblExpedientesDocumentos | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Vincular desde expediente/solicitud. |
| Beneficiarios | tblPersonas | Transaccional | Composición /api/v1/beneficiarios | R/C/U, sin estadoPersona | BeneficiariosView.vue | R/C/U de campos personales; no gestiona estadoPersona | /beneficiarios | BENEFICIARIOS | PARCIAL | P1 | Gestionar `estadoPersona` o documentar que el estado operativo pertenece solo al beneficiario. |
| Comunicacion | tblAlertas | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Comunicacion | tblConversaciones | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Comunicacion | tblMensajes | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Comunicacion | tblNotificacionesEnviadas | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblErrores | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblErroresIdiomas | Administración/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblIdiomas | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblListas | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblListasValores | Administración/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblMacroProcesos | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblParametros | Catálogo/configuración | GET/PUT /api/v1/seguridad/admin/configuracion | R + PUT valorPredeterminado | ConfigurationView.vue | Leer/editar valor predeterminado | /administracion/configuracion | ADMIN_CONFIGURACION | PARCIAL | P1 | Aclarar valor efectivo y cubrir tblParametrosValores. |
| Configuracion | tblParametrosValores | Administración/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblProcesos | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Configuracion | tblVersionesSistema | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Generado por despliegue; solo lectura. |
| Documentos | tblAdjuntos | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Gestionar vínculo desde documento. |
| Documentos | tblDocumentos | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Documentos | tblDocumentosVersiones | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Versionar desde documento; no editar/borrar versiones. |
| Documentos | tblTiposDocumentos | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Indicadores | tblIndicadores | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Indicadores | tblIndicadoresFormulas | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P3 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Indicadores | tblIndicadoresValores | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Valores ingestados; lectura/graficación. |
| Integracion | tblCredenciales | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | No exponer secretos; rotar mediante gestor seguro. |
| Integracion | tblEndpoints | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Integracion | tblIntegraciones | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Integracion | tblSistemas | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Migracion | tblCargaBeneficiariosDemo | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Confirmar con DBA si staging/demo; no incluir en CRUD de producción. |
| Migracion | tblCargasMigracion | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Registro técnico, no editar manualmente. |
| Migracion | tblRespaldoTarjetas | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Snapshot; no CRUD manual. |
| Operaciones | tblIncidentesAcceso | Operacional/auditoría | GET /api/v1/operaciones/monitoreo/incidentes | R solo lectura; sin acciones de resolución | MonitoringView.vue | R/filtros; no muta | /monitoreo | MONITOREO (pendiente DB) | PARCIAL | P1 | Añadir opción SQL aprobada y definir si se implementa resolución. |
| Operaciones | tblRegistrosAcceso | Relación/historial/técnica | GET /api/v1/operaciones/monitoreo/accesos | R solo lectura | MonitoringView.vue | R/filtros, inmutable | /monitoreo | MONITOREO (pendiente DB) | NO REQUIERE CRUD | — | Mantener visor de consulta y verificar ingestión real. |
| Operaciones | tblRespuestasIntegracion | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Consulta de solo lectura en Monitoreo. |
| Operaciones | tblResumenesAccesos | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Consumir en tablero de lectura, no CRUD. |
| Operaciones | tblSincronizaciones | Operacional/auditoría | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Operaciones | tblSolicitudesIntegracion | Operacional/auditoría | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Operaciones | tblTarjetasMovimientos | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Consultar historial desde tarjeta. |
| Organizacion | tblTiposUnidadesOrganizativas | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Organizacion | tblUnidadesOrganizativas | Administración/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P2 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Organizacion | tblUsuariosUnidadesOrganizativas | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Gestionar desde usuario/unidad. |
| Seguridad | tblNavegaciones | Administración/configuración | CRUD /api/v1/seguridad/admin/navegaciones; GET mi-navegacion | R/C/U/estado (Zod); NAVEGACION_ADMINISTRAR no provisionado | NavigationAdminView.vue | CRUD condicionado al permiso y menú aprobados | /administracion/navegaciones | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y agregar opción de menú. |
| Seguridad | tblNavegacionesIdiomas | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | No implementar i18n hasta definir alcance. |
| Seguridad | tblPerfiles | Administración/configuración | CRUD /api/v1/seguridad/admin/perfiles | R/C/U/estado (Zod); PERFILES_ADMINISTRAR | ProfilesView.vue + ProfileConfigurationView.vue | R/C/U/estado | /administracion/perfiles | ADMIN_PERFILES | COMPLETO | — | Mantener; validación funcional manual pendiente. |
| Seguridad | tblPerfilesNavegaciones | Relación/historial/técnica | GET/PUT perfiles/:id/navegaciones | Sin CRUD propio; relación/historial/sistema | ProfileConfigurationView.vue (Navegación) | Asignar/revocar en perfil | /administracion/perfiles/:id/configuracion | ADMIN_PERFILES (pestaña) | NO REQUIERE CRUD | — | Gestionar desde Configuración de perfil. |
| Seguridad | tblPerfilesPermisos | Relación/historial/técnica | GET/PUT perfiles/:id/permisos | Sin CRUD propio; relación/historial/sistema | ProfileConfigurationView.vue (Permisos) | Asignar/revocar en perfil | /administracion/perfiles/:id/configuracion | ADMIN_PERFILES (pestaña) | NO REQUIERE CRUD | — | Gestionar desde Configuración de perfil. |
| Seguridad | tblPermisos | Administración/configuración | CRUD /api/v1/seguridad/admin/permisos | R/C/U/estado (Zod); PERMISOS_ADMINISTRAR | PermissionsView.vue | R/C/U/estado | /administracion/permisos | ADMIN_PERMISOS | COMPLETO | — | Mantener; validar con un perfil no ADMIN_GENERAL. |
| Seguridad | tblSesionesUsuarios | Relación/historial/técnica | Escrituras internas de auth; sin CRUD | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Mantener ciclo auth; opcional consulta/revocación segura. |
| Seguridad | tblUsuarios | Administración/configuración | GET/POST/PUT/PATCH /api/v1/seguridad/usuarios | R/C/U/estado (Zod) | UsersView.vue | R/C/U/estado | /administracion/usuarios | ADMIN_USUARIOS | COMPLETO | — | Mantener; falta prueba funcional visual. |
| Seguridad | tblUsuariosPerfiles | Relación/historial/técnica | Asignación dentro de usuarios; GET perfiles | Sin CRUD propio; relación/historial/sistema | UsersView.vue (perfiles) | Asignar desde Usuario | /administracion/usuarios | ADMIN_USUARIOS (formulario) | NO REQUIERE CRUD | — | Gestionar desde Usuarios. |
| Solicitudes | tblSolicitudes | Transaccional | GET/POST/PUT/PATCH /api/v1/solicitudes; GET opciones | Códigos SOLICITUDES_* propuestos, no provisionados | SolicitudesView.vue | R/C/U/transición con historial; acciones condicionadas a permiso | /solicitudes | Sin opción DB | PARCIAL | P1 | Aplicar propuesta aprobada y agregar opción de menú. |
| Solicitudes | tblSolicitudesAprobaciones | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Solicitudes | tblSolicitudesDocumentos | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Gestionar desde solicitud/documento. |
| Solicitudes | tblSolicitudesEstados | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Mostrar historial; generar al transicionar. |
| Solicitudes | tblTiposSolicitudes | Catálogo/configuración | GET indirecto en `/api/v1/solicitudes/opciones` | Solo lectura de opciones; sin CRUD | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API CRUD de catálogo y vista; el GET opciones está bloqueado junto con Solicitudes. |
| Tarjetas | tblAsignaciones | Transaccional | POST opcional al crear tarjeta; GET por JOIN; sin recurso propio | C indirecto; sin R/U/estado propio | TarjetasView.vue (asignación al crear) | Crear al alta; sin gestión posterior | /tarjetas | TARJETAS (embebida) | PARCIAL | P1 | Añadir gestión posterior de asignaciones y su historial. |
| Tarjetas | tblAsignacionesEstados | Relación/historial/técnica | — | Sin CRUD propio; relación/historial/sistema | — (sin CRUD independiente) | No independiente; parent/solo lectura | — | — | NO REQUIERE CRUD | — | Mostrar historial generado por transición. |
| Tarjetas | tblTarjetas | Transaccional | GET/POST/PUT/PATCH /api/v1/tarjetas; GET opciones | R/C/U/estado (Zod) | TarjetasView.vue | R/C/U/estado | /tarjetas | TARJETAS | COMPLETO | — | Mantener; falta prueba funcional visual. |
| Tarjetas | tblTarjetasReemplazos | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Tarjetas | tblTarjetasRevisiones | Transaccional | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Tarjetas | tblTiposTarjetas | Catálogo/configuración | GET indirecto en `/api/v1/tarjetas/opciones` | Solo lectura de opciones; sin CRUD | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API CRUD de catálogo y vista. |
| Tipos | tblCategorias | Catálogo/configuración | — | —; API faltante | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API y vista según prioridad; respetar FK/RBAC/auditoría. |
| Tipos | tblTipos | Catálogo/configuración | Solo lectura indirecta por consultas de opciones | Sin CRUD de catálogo | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear API CRUD tipo/categoría tras confirmar dueño del catálogo. |
| Tipos | tblTiposValores | Catálogo/configuración | GET indirecto en opciones de beneficiarios/solicitudes/tarjetas | Solo lectura de opciones; sin CRUD | — | —; sin pantalla | — | — | PENDIENTE | P1 | Crear CRUD con filtros por tipo; proteger valores de estado en uso. |

## Frontend evaluado

Rutas app en `frontend/src/router/index.ts`: `/inicio`, `/campus`, `/edificios`, `/elevadores`, `/dispositivos`, `/beneficiarios`, `/solicitudes`, `/tarjetas`, `/administracion/usuarios`, `/administracion/perfiles`, `/administracion/perfiles/:id/configuracion`, `/administracion/permisos`, `/administracion/navegaciones`, `/administracion/configuracion`, `/administracion/auditoria`; también login y fallback 404.

| Vista | Servicio | Evaluación funcional |
|---|---|---|
| `CampusView.vue` | `campus.ts` | Lista/busca/crea/edita/estado y filtro de estado; GET usa ACCESOS_CONSULTAR, los writes esperan el código nuevo aprobado. |
| `BuildingsView.vue`, `ElevatorsView.vue`, `DevicesView.vue` | `infrastructure.ts` | CRUD UI y filtros; GET requiere ACCESOS_CONSULTAR, writes esperan códigos nuevos y faltan opciones de menú hasta aplicar propuesta. |
| `BeneficiariosView.vue` | `beneficiarios.ts` | CRUD compuesto Persona+Beneficiario; sin condiciones/expediente/documentos. |
| `SolicitudesView.vue` | `solicitudes.ts` | Lista/alta/edición; falta acción PATCH estado; APIs bloqueadas. |
| `TarjetasView.vue` | `tarjetas.ts` | Tarjeta CRUD + asignación opcional solo al crear; no transición/reemplazo/revisión. |
| `UsersView.vue` | `usuarios.ts` | CRUD y perfiles. |
| `ProfilesView.vue`, `ProfileConfigurationView.vue` | `administracion.ts` | General/Usuarios/Permisos/Navegación. |
| `PermissionsView.vue` | `administracion.ts` | Catálogo acotado a operaciones reales y perfiles. |
| `NavigationAdminView.vue`, `NavigationMenuNode.vue` | `administracion.ts`, `navigation.ts` | CRUD jerárquico y menú SQL dinámico; editor sin opción de menú actual. |
| `ConfigurationView.vue` | `administracion.ts` | Sólo parámetro predeterminado; otros catálogos Configuracion pendientes. |
| `AuditView.vue` | `administracion.ts` | Bitácora e intentos; no lee tblLogsSistema. |
| `MonitoringView.vue` | `administracion.ts` | Consultas reales, paginadas y read-only de accesos e incidentes; opción de menú requiere script aprobado. |
| `DashboardView.vue` | `health.ts` | Salud de servicio, no indicadores operacionales. |

Componentes compartidos observados: `AdminLayout.vue`, `AppBreadcrumb.vue`, `PageHeader.vue`, `StatusBadge.vue`, `ConfirmDialog.vue` y `NavigationMenuNode.vue`. No se probó en navegador.
