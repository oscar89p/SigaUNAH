# Análisis de módulos pendientes — SIGA UNAH

## Alcance y método

Inspección estática del código Vue 3, Vue Router, servicios Fastify, repositorios SQL y el DDL versionado en `database/SIGADll.sql`. No se ejecutaron cambios en SQL Server, migraciones, despliegues ni modificaciones de código funcional.

Los códigos de navegación y rutas indicados para las opciones solicitadas provienen de la evidencia documentada en `docs/PROPUESTA_NAVEGACION.md` (tabla verificada previamente contra SQL Server) y de `frontend/src/router/index.ts`.

## Matriz de cobertura

| Opción | Código SQL | Enlace SQL | Ruta Vue | Vista/API | Permiso identificado | Estado |
|---|---|---|---|---|---|---|
| Reportes y Estadísticas | `REPORTES` | `/reportes` | No existe | No existe endpoint ni vista | `REPORTES_CONSULTAR`, `REPORTES_EXPORTAR` existen en catálogo/documentación, no en `authorization.ts` | **PENDIENTE** |
| Mi Cuenta → Mi Información | `MI_INFORMACION` | `/mi-cuenta/informacion` | No existe | No existe vista ni endpoint de perfil propio | No existe permiso específico ni handler self-service | **PENDIENTE** |
| Mi Cuenta → Mi Tarjeta | `MI_TARJETA` | `/mi-cuenta/tarjeta` | No existe | No existe vista ni endpoint self-service | No existe permiso específico; `TARJETAS_CONSULTAR` es administrativo | **PENDIENTE** |
| Soporte Técnico | `SOPORTE` | `/soporte` | No existe | No existe módulo API/Vue ni esquema Soporte | `SOPORTE_TECNICO` existe en catálogo, no está conectado a handlers | **PENDIENTE** |
| Monitoreo | `MONITOREO` | `/monitoreo` | `MonitoringView.vue` | Dos endpoints REST y repositorios SQL reales | `ACCESOS_HISTORIAL` | **PARCIAL** |

La visibilidad de una opción de menú no autoriza por sí misma una API. El hook global de Fastify aplica `permissionFor()` antes de cada endpoint protegido.

## Inventario detallado

### 1. Reportes y Estadísticas

**Frontend**

- Código esperado: `REPORTES`.
- Enlace almacenado: `/reportes`.
- No existe `/reportes` en `frontend/src/router/index.ts`.
- No existe `ReportsView.vue`, servicio frontend de reportes ni exportador.
- El dashboard actual (`frontend/src/views/DashboardView.vue`, líneas 10–33) solo consulta `GET /health` y muestra disponibilidad de API; no es un módulo de indicadores.

**Backend y datos disponibles**

- No hay rutas bajo `/api/v1/reportes` ni `/api/v1/indicadores`.
- Existen tablas reales que podrían alimentar consultas:
  - `Indicadores.tblIndicadores` — definiciones.
  - `Indicadores.tblIndicadoresFormulas` — fórmulas configuradas.
  - `Indicadores.tblIndicadoresValores` — mediciones por campus, edificio y elevador.
  - `Operaciones.tblResumenesAccesos` — resúmenes operacionales.
  - `Operaciones.tblRegistrosAcceso` — eventos de acceso.
  - `Operaciones.tblIncidentesAcceso` — incidentes.
  - `Tarjetas.tblAsignaciones`, `Beneficiarios.tblBeneficiarios` y `Accesos.*` — dimensiones operativas.
- Las relaciones verificadas de indicadores están documentadas en `docs/INVENTARIO_BASE_DATOS.md`, líneas 74–75.

**RBAC**

`REPORTES_CONSULTAR` y `REPORTES_EXPORTAR` aparecen como códigos existentes en el inventario de permisos (`docs/INVENTARIO_BASE_DATOS.md`, línea 122), pero no están incluidos en `backend/src/modules/auth/authorization.ts`, líneas 1–14 y 21–57. No hay autorización efectiva porque no hay endpoint.

**Conclusión**

No se puede afirmar que existan reportes solo por la existencia de tablas. Primero debe definirse el catálogo de métricas, filtros, período, ámbito institucional, fuente prioritaria (`tblResumenesAccesos` frente a agregación de eventos) y formato de exportación.

### 2. Mi Cuenta → Mi Información

**Identidad autenticada existente**

- `backend/src/modules/auth/auth-context.ts`, línea 3, define `AuthContext` con `idUsuario`, nombre, perfiles y permisos.
- `backend/src/modules/auth/auth.routes.ts`, líneas 14–17, expone `GET /api/v1/auth/me`.
- La respuesta de `/auth/me` solo devuelve `username`, `displayName`, iniciales, perfiles y permisos; no devuelve correo, identificador institucional, estado ni fechas.
- `backend/src/modules/auth/auth.repository.ts`, líneas 5–15, consulta `Seguridad.tblUsuarios` por `nombreAcceso` durante login; líneas 17–27 cargan perfiles y permisos.

**Ruta, vista y API propia**

- Código: `MI_INFORMACION`.
- Enlace: `/mi-cuenta/informacion`.
- No hay ruta Vue, vista, servicio ni endpoint self-service.
- `Seguridad.tblUsuarios` contiene `nombreUsuario`, `correoElectronico`, `nombreAcceso`, `identificadorInstitucional`, autenticación, estado y auditoría (`database/SIGADll.sql`, líneas 1467–1484).

**Qué podría consultar/modificar**

- Consulta razonable: nombre, correo, identificador institucional, tipo de autenticación, estado y último acceso, filtrados exclusivamente por `auth.idUsuario`.
- Modificación potencial: únicamente campos de contacto autorizados por decisión funcional; nunca `idUsuario`, roles, permisos, estado, `claveHash` ni perfiles desde un formulario self-service.
- El modelo no contiene una relación usuario-persona directa. No debe asumirse que `Seguridad.tblUsuarios.idUsuario` equivale a `Beneficiarios.tblPersonas.idPersona`.
- Para proteger privacidad, cualquier endpoint futuro debe tomar el usuario de sesión y no aceptar un `:idUsuario` controlado por el cliente para el modo “Mi cuenta”.

**Conclusión**

Pendiente. `/api/v1/auth/me` puede reutilizarse como base de identidad, pero no sustituye una vista/endpoint de información propia.

### 3. Mi Cuenta → Mi Tarjeta

**Modelo real**

Las relaciones verificadas son:

```text
Tarjetas.tblAsignaciones.idBeneficiario
  -> Beneficiarios.tblBeneficiarios.idBeneficiario
  -> Beneficiarios.tblBeneficiarios.idPersona
  -> Beneficiarios.tblPersonas.idPersona

Tarjetas.tblAsignaciones.idTarjeta
  -> Tarjetas.tblTarjetas.idTarjeta

Accesos.tblAsignacionesPerfilesAcceso.idAsignacion
  -> Tarjetas.tblAsignaciones.idAsignacion

Accesos.tblAsignacionesPerfilesAcceso.idPerfilAcceso
  -> Accesos.tblPerfilesAcceso.idPerfilAcceso
```

Estas relaciones están respaldadas por el DDL y resumidas en `docs/INVENTARIO_BASE_DATOS.md`, líneas 52, 59, 97–100.

**Limitación crítica**

`Seguridad.tblUsuarios` no tiene `idPersona`, `idBeneficiario` ni una FK hacia `Beneficiarios`. Por lo tanto, no existe una relación verificable para determinar qué tarjeta pertenece al usuario autenticado. No se debe unir por nombre, correo o identificador institucional sin una decisión/modelo explícito.

**Código reutilizable**

- `frontend/src/views/GestionTarjetaView.vue` es gestión administrativa por `idTarjeta`, no una ficha personal.
- `backend/src/modules/tarjetas/tarjetas.repository.ts` ya consulta asignaciones, beneficiario, solicitud, tarjeta y perfiles, pero sus endpoints están diseñados para operación administrativa y protegidos por `TARJETAS_CONSULTAR`/permisos de asignación.
- No existe endpoint “mi tarjeta” filtrado por sesión.

**Conclusión**

Pendiente y bloqueado por identidad de dominio. Antes de implementar debe definirse una relación autorizada usuario-persona/beneficiario; no se puede inventar una consulta basada en coincidencia textual.

### 4. Soporte Técnico

**Navegación y autorización**

- Código: `SOPORTE`.
- Enlace: `/soporte`.
- No existe ruta en `frontend/src/router/index.ts`.
- `SOPORTE_TECNICO` aparece en el catálogo de permisos documentado, pero `backend/src/modules/auth/authorization.ts` no lo incluye en `permissionCatalogCodes` ni asigna endpoints a ese permiso.

**Datos disponibles**

No existe esquema `Soporte` ni tablas de tickets/incidencias técnicas. Las tablas existentes no deben reutilizarse sin definición funcional:

- `Operaciones.tblIncidentesAcceso` registra incidentes operativos de acceso, no solicitudes de soporte.
- `Auditoria.tblLogsSistema` y `tblBitacoras` son auditoría técnica/funcional de solo consulta.
- `Comunicacion.tblConversaciones`, `tblMensajes`, `tblAlertas` y `tblNotificacionesEnviadas` son mensajería/notificaciones, no un sistema de tickets.

**Conclusión**

Pendiente. Primero debe decidirse si Soporte será solo consulta/enlace a un sistema externo o una gestión interna; solo la segunda opción justificaría un diseño de tablas/API nuevas.

### 5. Monitoreo

**Frontend**

- Ruta: `/monitoreo`, `frontend/src/router/index.ts`, línea 46.
- Vista: `frontend/src/views/MonitoringView.vue`.
- La pantalla tiene dos secciones: registros de acceso e incidentes.
- Usa filtros de texto, fecha, resultado, severidad y estado, con paginación.
- Declara explícitamente que no genera datos simulados (`MonitoringView.vue`, líneas 40–46).

**Backend**

- Rutas: `backend/src/modules/operaciones/monitoreo.routes.ts`, líneas 5–7:
  - `GET /api/v1/operaciones/monitoreo/accesos`
  - `GET /api/v1/operaciones/monitoreo/incidentes`
- Servicio: `backend/src/modules/operaciones/monitoreo.service.ts`, líneas 5–12.
- Repositorio: `backend/src/modules/operaciones/monitoreo.repository.ts`.
- Las consultas unen eventos con tarjetas, beneficiarios/personas, dispositivos y elevadores.

**Tablas reales**

- `Operaciones.tblRegistrosAcceso`.
- `Operaciones.tblIncidentesAcceso`.
- `Tarjetas.tblTarjetas` y `Tarjetas.tblAsignaciones`.
- `Beneficiarios.tblBeneficiarios` y `Beneficiarios.tblPersonas`.
- `Accesos.tblDispositivos` y `Accesos.tblElevadores`.

**RBAC**

`backend/src/modules/auth/authorization.ts`, línea 33, asigna `ACCESOS_HISTORIAL` a las lecturas de monitoreo. La ruta Vue también declara `meta.requiredPermission: "ACCESOS_HISTORIAL"`.

**Estado real**

**PARCIAL**: consulta real, paginada y de solo lectura implementada. No existe ingestión de eventos en este módulo, resolución de incidentes ni resumen de accesos; el contenido depende de los procesos externos que llenen las tablas. La opción de navegación SQL debe comprobarse/asignarse en cada ambiente; la documentación previa la marcó como pendiente.

## Reglas de autorización observadas

1. El backend autentica la cookie de sesión antes de las rutas protegidas (`backend/src/server.ts`, líneas 67–79).
2. `permissionFor()` asigna permisos por recurso y método, no por la etiqueta visual del menú.
3. `GET /api/v1/auth/me` es un endpoint gestionado por autenticación y no expone información privada adicional.
4. `GET /api/v1/operaciones/monitoreo/*` requiere `ACCESOS_HISTORIAL`.
5. No existen reglas implementadas para `REPORTES_*` ni `SOPORTE_TECNICO` porque no existen handlers.
6. Los perfiles y permisos se cargan desde `Seguridad.tblUsuariosPerfiles`, `tblPerfiles`, `tblPerfilesPermisos` y `tblPermisos`; la navegación se filtra separadamente por `tblPerfilesNavegaciones`.

## Dependencias técnicas

| Módulo | Dependencias existentes | Dependencias faltantes |
|---|---|---|
| Reportes | Indicadores, resúmenes, eventos, RBAC catalogado | Definición de métricas, API, agregaciones, exportación, autorización conectada |
| Mi Información | Sesión, `tblUsuarios`, `/auth/me` | Vista, endpoint self-service, reglas de campos editables, pruebas de aislamiento |
| Mi Tarjeta | Asignaciones, beneficiarios, tarjetas, perfiles de acceso | Relación usuario-beneficiario verificable, endpoint self-service, política de visibilidad |
| Soporte | Comunicaciones y auditoría existentes | Decisión de alcance, workflow, responsable, persistencia de tickets o integración externa |
| Monitoreo | Vista, endpoints, repositorios y tablas operativas | Ingestión confiable, opción SQL asignada, resumen/resolución si se requiere |

## Orden recomendado de implementación

1. **Mi Información**, porque la identidad de usuario ya existe y puede implementarse con alcance reducido y aislamiento por `auth.idUsuario`.
2. **Monitoreo**, completar la asignación de navegación y validar la ingestión; después decidir resolución de incidentes.
3. **Reportes y Estadísticas**, una vez aprobadas métricas y fuente de verdad.
4. **Mi Tarjeta**, solo después de definir formalmente la relación usuario-beneficiario/persona.
5. **Soporte Técnico**, después de decidir entre sistema externo y módulo interno; no crear tablas por anticipado.

## Riesgos y decisiones pendientes

- Exponer “Mi Tarjeta” sin una relación de identidad produciría filtración o asociación incorrecta de datos.
- Reutilizar `TARJETAS_CONSULTAR` para “Mi Tarjeta” mezclaría permisos administrativos y personales.
- Agregar métricas sin definir fuente y período puede producir totales contradictorios entre eventos y resúmenes.
- `OFFSET/FETCH` aparece en repositorios existentes; la compatibilidad SQL Server debe considerarse al crear nuevos listados.
- `Comunicacion` no equivale a `Soporte`; sus tablas no definen ticket, SLA, estado ni asignación técnica.
- Los enlaces SQL `/reportes`, `/soporte`, `/mi-cuenta/informacion` y `/mi-cuenta/tarjeta` no tienen rutas Vue actuales y no deben dejarse como enlaces funcionales hasta implementar o retirar mediante proceso autorizado.

## Conclusión

De las cinco opciones, solo **Monitoreo** tiene vista y API reales, aunque está **PARCIAL** por depender de ingestión y configuración de navegación. **Reportes**, **Mi Información**, **Mi Tarjeta** y **Soporte Técnico** están **PENDIENTES**. El primer módulo recomendado es **Mi Información**, con endpoint estrictamente asociado al `idUsuario` autenticado y sin aceptar identificadores de otros usuarios.
