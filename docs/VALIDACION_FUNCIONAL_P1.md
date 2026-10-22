# Validación funcional P1 — SIGA UNAH

Fecha de validación: 22 de octubre de 2026.

## Alcance y método

Se validó el estado local del repositorio, el backend/frontend compilado, las rutas HTTP sin sesión, y el estado agregado de `DbSigaUNAH` mediante consultas exclusivamente `SELECT`. No se ejecutaron INSERT, UPDATE, DELETE, DDL, migraciones ni acciones de prueba sobre datos reales.

No se generó una nueva modificación de permisos o navegación. La configuración P1 existente se verificó; las consultas confirmaron que ya está aplicada.

## Estado real verificado en SQL Server

| Área | Resultado agregado | Estado |
|---|---:|---|
| Permisos totales/activos | 28 / 28 | APROBADO |
| Permisos P1 nuevos activos | 9 | APROBADO |
| Permisos P1 asignados a `ADMIN_GENERAL` | 9 | APROBADO |
| Opciones de navegación totales/activas-visibles | 24 / 24 | APROBADO |
| Opciones P1 nuevas | 9 | APROBADO |
| Campus | 6 registros, 6 activos | APROBADO en consulta SQL |
| Edificios | 8 registros, 8 activos | Verificado en SQL |
| Elevadores | 11 registros, 11 activos | Verificado en SQL |
| Dispositivos | 11 registros, 11 activos | Verificado en SQL |
| Beneficiarios | 66 registros, 66 activos | Verificado en SQL |
| Solicitudes | 7 registros, 7 activas | Verificado en SQL |
| Tarjetas | 4 registros, 4 activas | Verificado en SQL |
| Registros de acceso | 0 | Sin eventos persistidos actualmente |
| Incidentes | 0 | Sin incidentes persistidos actualmente |

La jerarquía P1 verificada es:

- `SEGURIDAD` bajo `ADMINISTRACION`.
- `ADMIN_NAVEGACIONES` bajo `SEGURIDAD`.
- `CAMPUS`, `EDIFICIOS`, `ELEVADORES` y `DISPOSITIVOS` bajo `ACCESOS`.
- `SOLICITUDES` bajo `OPERACION`.
- `MONITOREO` activo y visible.

## Matriz funcional

| Módulo | Consulta/listado | Búsqueda/filtros/paginación | Formularios/edición | Estado/flujo | RBAC/API | Resultado |
|---|---|---|---|---|---|---|
| Campus | Implementado; servicio usa `GET /api/v1/campus` | Search, estado y paginación | Alta/edición presentes; writes requieren `CAMPUS_ADMINISTRAR` | Activar/desactivar presente | GET usa `ACCESOS_CONSULTAR`; write requiere permiso P1 | Código validado; operación protegida HTTP pendiente de sesión |
| Edificios | Implementado; joins Campus | Search, estado y paginación | Alta/edición presentes | Activar/desactivar presente | GET `ACCESOS_CONSULTAR`; write `EDIFICIOS_ADMINISTRAR` | Código validado; operación protegida pendiente de sesión |
| Elevadores | Implementado; joins Edificio | Search, estado y paginación | Alta/edición presentes | Activar/desactivar presente | GET `ACCESOS_CONSULTAR`; write `ELEVADORES_ADMINISTRAR` | Código validado; operación protegida pendiente de sesión |
| Dispositivos | Implementado; join Elevador | Search, estado y paginación | Alta/edición presentes | Activar/desactivar presente | GET `ACCESOS_CONSULTAR`; write `DISPOSITIVOS_ADMINISTRAR` | Código validado; operación protegida pendiente de sesión |
| Beneficiarios | Implementado; persona+beneficiario | Search, paginación y opciones | Alta/edición presentes | Estado presente | Códigos `BENEFICIARIOS_*` | Código y tests aprobados; sesión/navegador pendiente |
| Solicitudes | Implementado; opciones reales | Search, estado y paginación | Alta/edición; PUT no cambia estado | PATCH transiciona y registra historial | `SOLICITUDES_*`; códigos activos en SQL | Código y contratos aprobados; sesión/navegador pendiente |
| Tarjetas | Implementado; opciones y JOIN asignación | Search y paginación | Alta/edición; asignación opcional al crear | No se completó gestión posterior de asignación/reemplazo/revisión | `TARJETAS_*` existente | Parcial P1; pendiente flujo de asignación posterior |
| Monitoreo | `GET /api/v1/operaciones/monitoreo/accesos/incidentes` | Search, fechas, resultado/severidad/resuelto, paginación | No aplica: solo lectura | No modifica eventos | `ACCESOS_HISTORIAL` | Código aprobado; DB no contiene eventos para validar filas |
| Usuarios | CRUD y perfiles | Search, estado y paginación | Alta/edición/contraseña local | Activar/desactivar protegido | `USUARIOS_ADMINISTRAR` | Tests backend aprobados; navegador pendiente |
| Perfiles | CRUD y configuración por pestañas | Search, estado y paginación | General, usuarios, permisos, navegación | Activar/desactivar/asignaciones | `PERFILES_ADMINISTRAR` | Código aprobado; navegador pendiente |
| Permisos | Catálogo y perfiles asociados | Search/módulo/paginación | Edición restringida a códigos soportados | Estado protegido | `PERMISOS_ADMINISTRAR` | Código aprobado; navegador pendiente |
| Navegación | CRUD y árbol dinámico | Search, estado y paginación | Alta/edición/jerarquía | Estado protegido; sin desactivar SQL | `NAVEGACION_ADMINISTRAR` | Código aprobado; navegador pendiente |

## Pruebas ejecutadas

### Automatizadas

- Backend `npm test`: **20 suites, 60 pruebas aprobadas**.
- Backend `npm run typecheck`: aprobado.
- Backend `npm run build`: aprobado.
- Frontend `npm run typecheck`: aprobado.
- Frontend `npm run build`: aprobado.
- `git diff --check`: aprobado.

Las pruebas cubren contratos Zod, paginación/filtros P1, CSRF, sesiones, autorización por método, asignación segura de permisos y políticas RBAC.

### HTTP local sin sesión

El backend local respondió `200` en `GET /health` y el frontend local respondió `200` en `HEAD http://localhost:5173`.

Las siguientes rutas protegidas fueron probadas sin cookie de sesión y rechazaron correctamente con **HTTP 401 `Autenticación requerida`**:

- `/api/v1/campus`
- `/api/v1/edificios`
- `/api/v1/solicitudes`
- `/api/v1/operaciones/monitoreo/accesos`
- `/api/v1/seguridad/mi-navegacion`

Esto valida el primer control de seguridad, pero no permite declarar aprobadas las operaciones autenticadas de lectura/escritura.

## Defectos corregidos durante el paquete P1

- Separación de permisos de lectura y escritura para infraestructura y Solicitudes.
- Filtros de estado en los listados de Campus, Edificios, Elevadores y Dispositivos.
- El PUT de Solicitudes ya no cambia directamente el estado; las transiciones usan PATCH e historial.
- Formularios P1 ocultan acciones mutables si el usuario no tiene el permiso específico.
- Se agregó consulta de Monitoreo de registros de acceso e incidentes reales, sin CRUD ni datos simulados.
- Se agregaron guardas y contratos de fechas/estado para Solicitudes.
- Se corrigieron guards de Router para permisos administrativos granulares.

## Pendientes y bloqueos reales

1. **Prueba autenticada en navegador:** requiere una cookie de sesión válida y un usuario con los permisos P1; no se inventó ni se usó una sesión ajena.
2. **Writes de infraestructura/Solicitudes:** aunque el código está preparado, requieren que el entorno SQL real tenga los códigos nuevos activos y asignados al perfil que prueba. La aplicación mantiene deny-by-default.
3. **Menú P1:** la jerarquía fue verificada en SQL, pero no se modificó en esta validación. Las opciones visibles dependen de las asignaciones dinámicas reales.
4. **Tarjetas:** queda pendiente gestionar asignaciones existentes, devoluciones/renovaciones, reemplazos y revisiones.
5. **Monitoreo:** las tablas reales tienen cero registros; se validó el contrato y el endpoint protegido, pero no se puede aprobar la presentación de filas con datos reales.

## Estado final de P1

**P1 está aprobado a nivel de código, contratos, compilación, pruebas automatizadas, conexión local y controles de autenticación.**

**P1 no está aprobado funcionalmente end-to-end en navegador** porque no se dispuso de una sesión autenticada válida para probar los endpoints protegidos y porque el flujo completo de asignaciones de tarjetas permanece pendiente. No se declara completa ninguna operación protegida únicamente por haber compilado.
