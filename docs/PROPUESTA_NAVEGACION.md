# Propuesta de navegación — SIGA UNAH

## Evidencia actual en SQL Server

La consulta de solo lectura confirmó **15 opciones** en `Seguridad.tblNavegaciones`, todas activas y visibles. Se encontraron 32 filas en `Seguridad.tblPerfilesNavegaciones`; la columna “Perfiles activos” refleja perfiles con relación activa y `permiteVisualizar=1`.

| Código | Padre | Enlace actual | Perfiles activos | Resultado al comparar con Vue Router |
|---|---|---|---:|---|
| `INICIO` | — | `/inicio` | 5 | Ruta válida: Dashboard. |
| `BENEFICIARIOS` | — | `/beneficiarios` | 2 | Ruta válida. |
| `TARJETAS` | — | `/tarjetas` | 3 | Ruta válida. |
| `ACCESOS` | — | `/accesos` | 3 | **Sin ruta**. El registro es raíz con enlace; propuesto como contenedor sin enlace. |
| `REPORTES` | — | `/reportes` | 3 | **Sin ruta**. Hay tablas `Indicadores`/`Operaciones` y permisos de reportes, pero no API/vista de reportes. |
| `ADMINISTRACION` | — | `NULL` | 2 | Contenedor jerárquico válido; tiene hijos. |
| `MI_CUENTA` | — | `NULL` | 2 | Contenedor; los hijos no tienen vistas/rutas. |
| `SOPORTE` | — | `/soporte` | 2 | **Sin ruta**. Existe `SOPORTE_TECNICO`, pero no módulo API/Vue ni esquema `Soporte`. |
| `ADMIN_USUARIOS` | `ADMINISTRACION` | `/administracion/usuarios` | 1 | Ruta válida. |
| `ADMIN_PERFILES` | `ADMINISTRACION` | `/administracion/perfiles` | 1 | Ruta válida; configuración de perfil se abre desde Configurar. |
| `ADMIN_PERMISOS` | `ADMINISTRACION` | `/administracion/permisos` | 1 | Ruta válida. |
| `ADMIN_CONFIGURACION` | `ADMINISTRACION` | `/administracion/configuracion` | 1 | Ruta válida. |
| `ADMIN_AUDITORIA` | `ADMINISTRACION` | `/administracion/auditoria` | 2 | Ruta válida. |
| `MI_INFORMACION` | `MI_CUENTA` | `/mi-cuenta/informacion` | 2 | **Sin ruta**. |
| `MI_TARJETA` | `MI_CUENTA` | `/mi-cuenta/tarjeta` | 2 | **Sin ruta**; `/tarjetas` es inventario administrativo, no ficha personal. |

Resumen verificado: 8 enlaces corresponden a rutas actuales, 5 enlaces no tienen ruta registrada y 2 opciones son contenedores sin enlace. Las pantallas `/campus`, `/edificios`, `/elevadores`, `/dispositivos`, `/solicitudes`, `/monitoreo` y `/administracion/navegaciones` existen en el router, pero no tienen opción de menú en la tabla. La ruta dinámica `/administracion/perfiles/:id/configuracion` es intencionalmente una pantalla detalle y se alcanza desde Configurar; no requiere enlace global independiente.

También hay un desacople entre menú y permisos: el perfil `SOPORTE_TECNICO` tiene asignada `ADMIN_AUDITORIA` y el permiso `AUDITORIA_CONSULTAR`, pero el guard Vue y el backend exigen `USUARIOS_ADMINISTRAR` para la auditoría. `ADMIN_GENERAL` tiene navegación administrativa completa. La visibilidad del menú no sustituye la autorización; Router y API deben evaluar códigos granulares compatibles con la tabla real.

## Implementación dinámica existente

- API: `GET /api/v1/seguridad/mi-navegacion`, en `backend/src/modules/seguridad/navegacion.routes.ts`.
- Consulta: `backend/src/modules/seguridad/navegacion.repository.ts` une usuarios-perfiles activos, perfiles activos, asignaciones activas/visibles y navegaciones activas/visibles.
- Árbol: `backend/src/modules/seguridad/navegacion.service.ts`.
- Consumo/renderizado: `frontend/src/services/navigation.ts`, `frontend/src/composables/useNavigation.ts`, `frontend/src/components/NavigationMenuNode.vue`, `frontend/src/layouts/AdminLayout.vue`.
- Router/guard: `frontend/src/router/index.ts`. Los endpoints API tienen control RBAC independiente; una opción de menú no autoriza la API.

## Estructura objetivo

`[EXISTE]` denota ruta/función ya presente. `[PROPUESTA, RESPALDADA]` requiere vista/API, pero está sustentada por tablas, permisos o código actuales. Los grupos de menú tienen `enlaceNavegacion = NULL`.

```text
Inicio [EXISTE: /inicio]

Operación [PROPUESTA, RESPALDADA por solicitudes, beneficiarios y tarjetas]
├── Beneficiarios [EXISTE: /beneficiarios]
├── Solicitudes [EXISTE: /solicitudes; API bloqueada por RBAC]
└── Tarjetas [EXISTE: /tarjetas]

Control de acceso [PROPUESTA, RESPALDADA por esquema Accesos]
├── Campus [EXISTE: /campus; API bloqueada por RBAC]
├── Edificios [EXISTE: /edificios; API bloqueada por RBAC]
├── Elevadores [EXISTE: /elevadores; API bloqueada por RBAC]
├── Dispositivos [EXISTE: /dispositivos; API bloqueada por RBAC]
└── Perfiles de acceso y elevadores [PROPUESTA; tblPerfilesAcceso*]

Monitoreo [RUTA IMPLEMENTADA: /monitoreo; opción SQL pendiente]
├── Registros de acceso/incidentes [MonitoringView.vue, read-only; tblRegistrosAcceso/tblIncidentesAcceso]
├── Sincronizaciones e integración [PROPUESTA; tblSincronizaciones/tblSolicitudesIntegracion/tblRespuestasIntegracion]
└── Resumen de accesos [PROPUESTA; tblResumenesAccesos]

Administración [EXISTE como contenedor]
├── Seguridad [PROPUESTA como subgrupo]
│   ├── Usuarios [EXISTE: /administracion/usuarios]
│   ├── Perfiles [EXISTE: /administracion/perfiles]
│   ├── Permisos [EXISTE: /administracion/permisos]
│   └── Navegación [EXISTE: /administracion/navegaciones; falta opción DB]
├── Configuración [EXISTE: /administracion/configuracion]
└── Auditoría [EXISTE: /administracion/auditoria]

Mi cuenta [EXISTE como contenedor; hijos requieren pantallas]
├── Mi información [PROPUESTA, RESPALDADA por Seguridad.tblUsuarios]
└── Mi tarjeta [PROPUESTA, RESPALDADA por Tarjetas.tblAsignaciones/tblTarjetas]
```

### Acciones de navegación

1. Corregir `ACCESOS` para que sea grupo (`enlaceNavegacion=NULL`) antes de agregarle los hijos de infraestructura; mantenerlo inaccesible como ruta `/accesos`.
2. Aplicar bajo aprobación la propuesta SQL para opciones de infraestructura, Solicitudes, Monitoreo y editor de Navegación. Asignar a perfiles activos y verificar el control API/RBAC por separado.
3. Implementar o retirar mediante proceso autorizado los enlaces `REPORTES`, `SOPORTE`, `MI_INFORMACION` y `MI_TARJETA`; no dejarlos apuntando a rutas 404.
4. No crear CRUD para opciones de menú: conservar las asignaciones jerárquicas por perfil y no usar el menú como mecanismo de autorización.
5. Para revisar los permisos/filas P1 se preparó `docs/propuesta-permisos-navegacion-p1.sql`; no se ejecutó. El script tiene un guard de aprobación apagado y termina en ROLLBACK. No modifica estructura; un DBA debe revisar candidatos/roles y aprobar cualquier COMMIT.

**Pendiente manual:** confirmar con el responsable funcional si `REPORTES`, `SOPORTE` y `Mi cuenta` deben mantenerse; la existencia de un permiso o tabla relacionada no prueba por sí sola el alcance de la pantalla.
