# Corrección de ruta de gestión de tarjetas

## Causa

La ruta estaba registrada correctamente:

`/tarjetas/:id/gestionar`

El botón del listado transmitía el ID correctamente, pero el guard ejecutaba `navigation.canAccess(to.path)` con la URL completa. La navegación dinámica solo contiene `/tarjetas`, por lo que el guard consideraba la ruta no autorizada y redirigía al primer enlace disponible.

## Corrección

- `GestionTarjetaView.vue` sigue siendo una pantalla completa, sin el modal anterior.
- La ruta recibe el ID mediante `route.params.id`.
- La ruta declara `meta.navigationPath: "/tarjetas"`.
- `useNavigation.canAccess` admite rutas descendientes de una opción autorizada.
- El guard conserva RBAC y devuelve `/acceso-denegado` con mensaje explícito cuando no existe acceso; ya no redirige silenciosamente a Inicio.
- La ruta de acceso denegado queda excluida del chequeo para evitar ciclos.
- El botón Volver usa `/tarjetas`.

## Versiones comprobadas

- Código fuente local: ruta presente.
- Build frontend local: correcto; bundle generado `index-ClBm9E1o.js`.
- HTML público consultado: aún referencia `index-CC-4IrN2.js`, sin la funcionalidad de gestión. Esto requiere publicar posteriormente el build, pero no se hizo durante esta tarea.

## Validaciones ejecutadas

- `frontend: npm run build`: correcto; incluye `vue-tsc -b` y `vite build`.
- `backend: npm run build`: correcto.
- `backend: npm test`: 24 archivos y 76 pruebas correctas.
- Endpoint público sin sesión: respondió `401`, comportamiento esperado.
- No se ejecutaron pruebas de navegador autenticadas ni despliegue al VPS, por falta de credenciales y por la restricción expresa de no desplegar.

## Pendientes de prueba en cada ambiente

1. Iniciar sesión con un usuario autorizado.
2. Abrir Tarjetas y confirmar `/tarjetas/<id>/gestionar`.
3. Recargar directamente la URL.
4. Probar Asignación, Historial e Información.
5. Repetir con usuario sin `TARJETAS_ASIGNAR` y confirmar que solo se bloquea la operación, no la lectura autorizada.
6. Comparar `mi-navegacion` y las consultas de `DIAGNOSTICO_NAVEGACION_AMBIENTES.md` entre ambientes.
