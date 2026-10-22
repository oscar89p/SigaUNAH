# Rediseño del módulo Tarjetas P2

## Arquitectura funcional

La entidad principal de la pantalla es `Tarjetas.tblTarjetas`. El listado muestra una tarjeta por fila y enlaza únicamente la asignación vigente (`esAsignacionVigente = 1`). Las asignaciones históricas se consultan desde el detalle mediante `Tarjetas.tblAsignaciones` y se conservan sin borrar.

El flujo queda así:

`Tarjetas` → `Gestionar tarjeta` → `Asignación actual / acciones / historial`

La pantalla registra una tarjeta lógica en SIGA. No representa alta física, activación externa ni sincronización con lectores.

## Modelo utilizado

- `Tarjetas.tblTarjetas`: identificación, estado de catálogo, tipo, fechas y observaciones.
- `Tarjetas.tblAsignaciones`: relación con beneficiario y solicitud, vigencia y estado.
- `Tarjetas.tblAsignacionesEstados`: trazabilidad de transiciones.
- `Tarjetas.tblTarjetasReemplazos`: relación entre tarjeta anterior y nueva.
- `Accesos.tblAsignacionesPerfilesAcceso`: perfil vinculado a la asignación.
- `Accesos.tblPerfilesAccesoElevadores`: elevadores autorizados por perfil.
- `Auditoria.tblBitacoras`: auditoría de creación y operaciones P2.

El índice `ukAsignacion_TarjetaVigente` protege una sola asignación vigente por tarjeta cuando está aplicado como índice filtrado por `esAsignacionVigente = 1`.

## Endpoints reutilizados

| Endpoint | Uso | Permiso |
|---|---|---|
| `GET /api/v1/tarjetas` | Listado paginado, búsqueda y estado | `TARJETAS_CONSULTAR` |
| `GET /api/v1/tarjetas/:id` | Detalle de tarjeta | `TARJETAS_CONSULTAR` |
| `GET /api/v1/tarjetas/opciones` | Catálogos reales y beneficiarios/solicitudes | `TARJETAS_CONSULTAR` |
| `GET /api/v1/tarjetas/asignaciones?idTarjeta=...&historial=true` | Historial de la tarjeta | `TARJETAS_CONSULTAR` |
| `POST /api/v1/tarjetas/asignaciones` | Asignar la tarjeta seleccionada | `TARJETAS_ASIGNAR` |
| `PATCH /api/v1/tarjetas/asignaciones/:id/devolucion` | Devolver | `TARJETAS_DESACTIVAR` |
| `POST /api/v1/tarjetas/asignaciones/:id/renovacion` | Renovar | `TARJETAS_RENOVAR` |
| `POST /api/v1/tarjetas/asignaciones/:id/reemplazo` | Reemplazar | `TARJETAS_ASIGNAR` |

## Endpoint ajustado

`GET /api/v1/tarjetas` ahora:

- une solo la asignación vigente;
- evita duplicar tarjetas cuando existen históricos;
- acepta `estado=all|active|inactive`;
- conserva búsqueda, orden y paginación SQL Server;
- devuelve perfil de acceso asociado a la asignación vigente.

El endpoint existente `POST /api/v1/tarjetas` se reutiliza para **Nueva tarjeta**. La creación usa el actor autenticado para `usuarioRegistro` y registra auditoría; no crea una asignación automáticamente.

## Componentes Vue

`frontend/src/views/TarjetasView.vue` implementa:

- listado de tarjetas con búsqueda, filtro y paginación;
- indicador `Disponible` o estado de asignación;
- formulario `Nueva tarjeta` basado en `tblTarjetas` y catálogos reales;
- modal `Gestionar` por tarjeta;
- asignación sin selector de otra tarjeta: usa siempre `detail.idTarjeta`;
- devolución, renovación, reemplazo e historial;
- visibilidad de acciones según permisos de sesión;
- validación de beneficiario/solicitud y fechas.

## Seguridad y permisos

La autorización se mantiene en el hook global Fastify. La interfaz solo oculta acciones, pero el backend continúa siendo la autoridad. La creación y asignación usan `TARJETAS_ASIGNAR`; consultas usan `TARJETAS_CONSULTAR`; devolución y renovación usan sus permisos específicos existentes. No se insertaron permisos ni se alteraron sesiones.

No existe eliminación física de tarjetas.

## Pruebas ejecutadas

- Backend typecheck: aprobado.
- Pruebas backend: ejecutadas y aprobadas.
- Backend build: aprobado.
- Frontend typecheck: aprobado.
- Frontend build: aprobado.
- No se ejecutaron escrituras institucionales ni pruebas autenticadas contra datos reales.

Las pruebas de contrato cubren filtros de estado, identificadores de asignación, estados de devolución, fechas y regresión de la consulta SQL de disponibilidad. La validación completa de asignar/devolver/reasignar depende de datos institucionales autorizados.

## Restricciones pendientes

1. Confirmar en SQL Server institucional que el índice esté filtrado por `esAsignacionVigente = 1`.
2. Confirmar los estados funcionalmente permitidos para alta/reutilización; no se codificaron valores de catálogo.
3. Ejecutar navegador autenticado con permisos reales para verificar cada acción.
4. La administración de inventario físico y sincronización externa permanece fuera de SIGA.

## Procedimiento de validación funcional

1. Iniciar backend/frontend con configuración autorizada.
2. Ingresar con un usuario que tenga `TARJETAS_CONSULTAR` y, para escribir, `TARJETAS_ASIGNAR`/permisos operativos correspondientes.
3. Abrir `Operación → Tarjetas` y verificar una fila por tarjeta.
4. Buscar por código y cambiar filtros de estado; comprobar paginación.
5. Usar `Nueva tarjeta` con valores provenientes de `GET /tarjetas/opciones` y verificar que el registro aparece sin asignación.
6. Abrir `Gestionar` en una tarjeta disponible y asignarla; el formulario no debe permitir cambiar el `idTarjeta`.
7. Verificar beneficiario, solicitud, perfil, vigencia y elevadores autorizados.
8. Ejecutar devolución y confirmar que la tarjeta queda sin asignación vigente.
9. Reasignar solo si la regla institucional y el índice filtrado lo permiten.
10. Consultar historial y comprobar que la asignación anterior permanece y que existe como máximo una vigente.
11. Intentar doble asignación concurrente/autorizada y confirmar respuesta de conflicto, sin crear datos ficticios.
