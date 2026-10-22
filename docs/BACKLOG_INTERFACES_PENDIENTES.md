# Backlog de interfaces pendientes — SIGA UNAH

## Resumen ejecutable

- Base real consultada en solo lectura: 83 tablas; se contrastaron 83 PK y 125 FK. El DDL versionado omite `Migracion.tblCargaBeneficiariosDemo`.
- Matriz: 5 COMPLETO, 10 PARCIAL, 42 PENDIENTE y 26 NO REQUIERE CRUD independiente.
- Hay 42 entidades con interfaz/workflow pendiente y sin API específica. De las rutas P1 existentes, las lecturas de infraestructura usan `ACCESOS_CONSULTAR`; 12 escrituras requieren códigos aún no provisionados y las 6 rutas de Solicitudes también esperan sus códigos aprobados.
- Menú real: 15 opciones; 5 enlaces inválidos, 8 enlaces válidos y 2 contenedores. Siete rutas de vista estática, incluido Monitoreo, no tienen opción actual de menú.
- No se ejecutaron scripts ni se modificó SQL Server. Las filas de menú/permisos pendientes requieren decisión y despliegue autorizados.

## P1 — Indispensable para demostración operativa

| ID | Trabajo | Dependencias/criterio de salida |
|---|---|---|
| P1-01 | **Aprobar la política RBAC y el bootstrap controlado.** Para escrituras de Accesos y todas las operaciones de Solicitudes faltan códigos en SQL Server. No reutilizar `ACCESOS_CONSULTAR` para writes. | Bloqueante para habilitar esas operaciones. `docs/propuesta-permisos-navegacion-p1.sql` propone códigos y grants solo a `ADMIN_GENERAL`; tiene guard en cero y rollback por defecto. DBA/funcional debe revisar antes de aplicar. |
| P1-02 | **Validar el mapa RBAC por recurso/método implementado.** Reads Access usan el permiso existente; 12 writes de infraestructura y las 6 operaciones de Solicitudes se niegan mientras sus nuevos códigos no estén provisionados/asignados. Mantener pruebas deny-by-default/CSRF. | El código quedó mapeado; depende de P1-01 para que las operaciones de escritura funcionen en la BD real. No habilitar por `ACCESOS_CONSULTAR`. |
| P1-03 | **Alinear menú real con rutas existentes.** Reparar `/accesos` como contenedor, ocultar enlaces sin ruta y agregar opciones para Campus, Edificios, Elevadores, Dispositivos, Solicitudes, Monitoreo y editor de Navegación. | El script P1 propone cambios idempotentes y relaciones por permiso existente; no fue ejecutado. Requiere aprobación/despliegue DBA. |
| P1-04 | **Completar el flujo de solicitudes.** Conectar en Vue la transición de estado ya implementada en `PATCH /api/v1/solicitudes/:id/estado`; mostrar historial desde `tblSolicitudesEstados` y no actualizar estado por PUT genérico. | Depende de P1-01/P1-02. El backend ya registra transición e historial en transacción. |
| P1-05 | **Completar asignaciones de tarjetas.** Permitir consulta y gestión posterior de `Tarjetas.tblAsignaciones` (vigencia, estado, renovación/revocación); incluir historial `tblAsignacionesEstados`, reemplazo y revisión desde tarjeta. | Depende de P1-02 y definición de estados válidos. Distinguir `TARJETAS_ACTIVAR`, `TARJETAS_DESACTIVAR` y `TARJETAS_RENOVAR`; hoy el PATCH usa permiso de activar para ambos sentidos y la UI no conecta `changeTarjetaState`. |
| P1-06 | **Monitoreo operacional implementado en código.** `GET /api/v1/operaciones/monitoreo/accesos` e `/incidentes` y `MonitoringView.vue` consultan registros reales, paginados y solo lectura; usan `ACCESOS_HISTORIAL`. | Falta aprobar/aplicar la relación `MONITOREO` en `docs/propuesta-permisos-navegacion-p1.sql` y validar con la ingestión operacional; no se probaron filas en navegador. Resolución de incidentes no está habilitada. |
| P1-07 | **Prueba E2E con roles reales.** Probar Admin General, Prosene/Mantenimiento y Soporte técnico, navegación y flujos P1; confirmar que permisos granulares no quedan sustituidos por `USUARIOS_ADMINISTRAR`. | Al finalizar P1-01/P1-03 y P1-05. DB local consultada; navegador no validado. |

## P2 — Administración y configuración de operación

| ID | Trabajo | Entidades y dependencias |
|---|---|---|
| P2-01 | **Perfiles de acceso a elevadores.** Crear/editar/activar perfiles de acceso, asignar elevadores, horarios/días y publicar versiones; gestionar asignación a tarjeta/solicitud desde flujo padre. | `Accesos.tblPerfilesAcceso`, `tblPerfilesAccesoElevadores`, `tblVersionesPerfilesAcceso`, `tblAsignacionesPerfilesAcceso`. Depende de P1-02 y definición de workflow/publicación. |
| P2-02 | **Condiciones y expedientes de beneficiarios.** Administrar condiciones, expediente, documentos, tipos de documento y versiones; adjuntar desde Beneficiario/Expediente. | `Beneficiarios.tblBeneficiariosCondiciones`, `tblExpedientes`, `tblExpedientesDocumentos`, `Documentos.*`. Requiere API de documentos y decisión de almacenamiento/tamaño/seguridad. |
| P2-03 | **Catálogos usados por formularios.** CRUD con validación de jerarquía/estado para tipos, valores, categorías, tipos de solicitudes/tarjetas, carreras, centros y períodos. | `Tipos.*`, `Solicitudes.tblTiposSolicitudes`, `Tarjetas.tblTiposTarjetas`, `Academico.*`. Priorizar catálogos que alimentan `opciones`; acordar cuáles son administrados en SIGA y cuáles vienen de fuente académica. |
| P2-04 | **Configuración institucional completa.** Extender la pantalla actual a listas/valores, macroprocesos/procesos, idiomas y valores de parámetros. Mantener `tblVersionesSistema` de solo lectura; no exponer credenciales ni secretos. | `Configuracion.tblListas`, `tblListasValores`, `tblParametrosValores`, `tblIdiomas`, `tblMacroProcesos`, `tblProcesos`, `tblErrores*`. Definir valores efectivos y clasificación de sensibilidad antes de escribir. |
| P2-05 | **Integración y operación administrativa.** Configurar sistemas/endpoints; supervisar sincronizaciones, solicitudes y respuestas. Credenciales deben manejarse con vault/rotación, no mostrarse como CRUD ordinario. | `Integracion.tblSistemas/tblIntegraciones/tblEndpoints/tblCredenciales` y `Operaciones.tblSincronizaciones/tblSolicitudesIntegracion/tblRespuestasIntegracion`. Depende de especificación de conectores y seguridad de secretos. |
| P2-06 | **Aprobación de solicitudes y documentos.** Bandeja de aprobaciones, responsables, adjuntos y transiciones auditables. | `Solicitudes.tblSolicitudesAprobaciones`, `tblSolicitudesDocumentos`, `tblSolicitudesEstados`, `Documentos.*`; necesita P1-04 y APIs de documentos. |
| P2-07 | **Organización y datos académicos de referencia.** Consultar/administrar institución, centros, facultades, carreras, períodos, unidades y asignaciones según dueño del dato. | `Academico.*`, `Organizacion.*`; `tblMatriculas` se considera fuente de referencia hasta confirmar ownership. Depende de P2-03. |
| P2-08 | **Verificar permisos granulares por rol después de provisionar P1.** Perfiles, permisos, configuración y auditoría ya se mapean a sus códigos existentes; navegación usa el nuevo código propuesto. | Validar guard Vue y API con Admin General y Soporte Técnico; no volver al permiso genérico `USUARIOS_ADMINISTRAR`. |

## P3 — Complementarias

| ID | Trabajo | Evidencia/alcance condicionado |
|---|---|---|
| P3-01 | Comunicación institucional: conversaciones, mensajes, alertas y entregas. | Hay cuatro tablas en `Comunicacion`; definir primero usuarios, permisos, estados y canales. |
| P3-02 | Dashboard/reportes e indicadores operacionales. | Tablas `Indicadores` y `Operaciones.tblResumenesAccesos`, permisos `REPORTES_*` y menú `REPORTES` ya existen; no hay API/vista de reportes. Definir métricas antes de construir. |
| P3-03 | Soporte técnico. | Existe `SOPORTE_TECNICO` y opción `/soporte`, pero no hay tablas/vista/API propios; confirmar el caso de uso antes de crear pantalla. |
| P3-04 | Mi cuenta (información personal y tarjeta propia). | Las rutas DB `/mi-cuenta/informacion` y `/mi-cuenta/tarjeta` carecen de páginas y servicios; definir alcance y autorización por usuario propietario. |
| P3-05 | Localización del menú y errores. | `Seguridad.tblNavegacionesIdiomas`, `Configuracion.tblIdiomas`, `tblErroresIdiomas`; solo si se aprueba interfaz multiidioma. |
| P3-06 | Auditoría ampliada y soporte de migraciones. | `Auditoria.tblLogsSistema`, `Migracion.tblCargasMigracion`, `tblRespaldoTarjetas`, `tblCargaBeneficiariosDemo`; solo consulta/control técnico, sin CRUD general. |

## Dependencias y paralelismo

```text
P1-01 decisión de permisos
  └─ P1-02 habilitación RBAC ──┬─ P1-03 asignación de opciones y prueba por rol
                              ├─ P1-04 transición de solicitudes
                              ├─ P1-05 asignaciones/tarjetas
                              └─ P1-06 APIs/visor de monitoreo

P2-03 catálogos ──┬─ P2-02 documentos/beneficiarios
                  ├─ P2-06 workflow de solicitudes
                  └─ P2-07 organización/datos académicos

P2-01 perfiles de acceso  ||  P2-04 configuración  ||  P2-05 integración
```

P1-04 y P1-05 pueden desarrollarse en paralelo tras resolver el permiso; P2-01, P2-04 y P2-05 también son paralelizables con contratos aprobados. P2-02 y P2-06 comparten el API/almacenamiento documental y deben coordinarse. No iniciar escrituras de catálogo de seguridad ni migraciones sin aprobación institucional.

## Evidencia de alcance

- Backend/rutas/RBAC: `backend/src/server.ts`, `backend/src/modules/auth/authorization.ts`, `backend/src/modules/{campus,edificios,elevadores,dispositivos,beneficiarios,solicitudes,tarjetas,seguridad}/*`.
- Frontend: `frontend/src/router/index.ts`, `frontend/src/views/*.vue`, `frontend/src/services/*.ts`.
- Datos/menú real: `docs/INVENTARIO_BASE_DATOS.md` y consultas `SELECT` de metadatos/navegación descritas allí.
