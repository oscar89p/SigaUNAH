# Rediseño de gestión de tarjetas

## Implementación

Se agregó la ruta frontend `/tarjetas/:id/gestionar`. El botón **Gestionar** del listado navega a esta pantalla; la gestión de asignaciones ya no usa el modal de detalle.

Archivos principales modificados:

- `frontend/src/views/GestionTarjetaView.vue`: pantalla completa, pestañas, búsqueda con debounce/cancelación, asignación e historial.
- `frontend/src/views/TarjetasView.vue` y `frontend/src/router/index.ts`: navegación.
- `frontend/src/services/{tarjetas,beneficiarios,http}.ts`: contratos y solicitudes.
- `backend/src/modules/beneficiarios/*`: búsqueda paginada avanzada y datos enmascarados.
- `backend/src/modules/tarjetas/*`: opciones de asignación, solicitudes válidas e historial paginado.
- `frontend/src/assets/main.css`: estilos responsive consistentes con BackOffice SIGA.

## Endpoints utilizados

Existentes:

- `GET /api/v1/tarjetas/:id`
- `GET /api/v1/tarjetas/acceso-opciones`
- `POST /api/v1/tarjetas/asignaciones`

Nuevos:

- `GET /api/v1/beneficiarios/busqueda?search=&page=&pageSize=`
- `GET /api/v1/tarjetas/asignacion-opciones`
- `GET /api/v1/tarjetas/solicitudes/:idBeneficiario`
- `GET /api/v1/tarjetas/:id/historial?page=&pageSize=`

La asignación reutiliza `tarjetas.repository.assign`, incluyendo transacción, bloqueos, validación de solicitud, tarjeta activa, asignación vigente única, perfil y auditoría.

## Criterios y limitaciones

La búsqueda consulta nombres, apellidos, número de identidad, `codigoCarne` (código de beneficiario) y `numeroCuenta`. El modelo real contiene `numeroCuenta` en `Beneficiarios.tblBeneficiarios`, por lo que la búsqueda por cuenta sí está soportada.

Los resultados nunca devuelven los valores completos de identidad o cuenta: el backend devuelve únicamente los últimos cuatro caracteres enmascarados. Las solicitudes válidas se filtran con la misma regla existente (`estadoSolicitud=1`) y la asignación vuelve a validarlas dentro de la transacción.

El historial existente almacena asignaciones y estados asociados; no se inventan eventos que no estén en tablas. El tipo mostrado como “Asignación” corresponde al registro de asignación consultado. Para devoluciones o cambios de estado detallados se requiere exponer posteriormente `tblAsignacionesEstados` como endpoint específico.

## Verificación

- Frontend typecheck: correcto (`vue-tsc -b`).
- Frontend build: correcto (`vite build`).
- Backend typecheck/build: correcto (`tsc -p tsconfig.json`).
- Backend tests: **24 archivos, 76 pruebas correctas** (`npm test`).
- No se ejecutaron pruebas de integración contra SQL Server ni pruebas manuales de navegador porque no se proporcionó una conexión de base de datos/entorno de ejecución. Deben verificarse allí la navegación, RBAC, búsquedas, paginación, respuestas 4xx/5xx y la asignación concurrente.

## Despliegue posterior al VPS

1. Ejecutar las pruebas y builds anteriores en el entorno de release.
2. Configurar las variables existentes de API, base de datos y CSRF; no aplicar migraciones.
3. Publicar el build frontend y el backend compilado usando el procedimiento habitual del proyecto.
4. Reiniciar el proceso del backend y verificar `GET /api/v1/health`.
5. Realizar una prueba controlada con un usuario RBAC autorizado y confirmar auditoría.

No se ejecutaron migraciones, despliegues al VPS ni `git push`.
