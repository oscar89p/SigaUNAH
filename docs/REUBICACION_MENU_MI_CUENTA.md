# Reubicación del menú Mi Cuenta

## Cambios realizados

Se modificó `frontend/src/layouts/AdminLayout.vue` para:

- Mantener nombre, nombre de acceso e iniciales del usuario autenticado.
- Agregar al menú superior:
  - Mi Información → `/mi-cuenta/informacion`.
  - Mi Tarjeta → `/mi-cuenta/tarjeta`.
  - Separador visual.
  - Cerrar sesión.
- Cerrar el menú al seleccionar una opción.
- Cerrar el menú al hacer clic fuera.
- Cerrar el menú con `Escape`.
- Mantener el flujo de cierre de sesión existente.
- Conservar foco visible y roles ARIA básicos del menú.

## Filtrado del sidebar

El sidebar continúa utilizando la navegación dinámica proveniente de SQL Server. La presentación filtra únicamente estos códigos:

- `MI_CUENTA`
- `MI_INFORMACION`
- `MI_TARJETA`

No se eliminaron ni modificaron registros de `Seguridad.tblNavegaciones` ni `Seguridad.tblPerfilesNavegaciones`. Las demás opciones mantienen su comportamiento y autorización.

## Rutas verificadas

- `/mi-cuenta/informacion` → `frontend/src/views/MyInformationView.vue`, consulta propia implementada mediante `/api/v1/usuarios/mi-informacion`.
- `/mi-cuenta/tarjeta` → `frontend/src/views/MyCardView.vue`, pantalla segura informativa. No tiene endpoint de tarjetas personales porque el modelo aún no vincula `tblUsuarios` con beneficiarios de forma verificable.

No se presenta una ruta ficticia: ambas rutas Vue existen. Mi Tarjeta muestra explícitamente la limitación de vinculación y no presenta datos simulados.

## Archivos modificados

- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/assets/main.css`
- `docs/REUBICACION_MENU_MI_CUENTA.md`

No se modificaron SQL Server, permisos, otros módulos funcionales, TableroUNAH ni el backend.

## Validaciones

- Frontend typecheck: correcto (`vue-tsc -b`).
- Frontend build: correcto (`vite build`).
- Pruebas visuales autenticadas: pendientes.
- No se realizó despliegue ni `git push`.
