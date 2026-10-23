# Diagnóstico de navegación entre ambientes

## Resultado ejecutivo

Se identificaron dos causas de código confirmadas y una diferencia de publicación:

1. **Ruta de gestión:** el guard de Vue Router comparaba literalmente la URL dinámica `/tarjetas/<id>/gestionar` con la opción almacenada `/tarjetas`. Al no coincidir, enviaba al primer enlace disponible, normalmente Inicio.
2. **Jerarquía:** el backend solo devolvía navegaciones explícitamente asignadas al perfil. Si en un ambiente estaba asignado un hijo pero no su padre, el árbol recibía el hijo como raíz y el menú perdía jerarquía.
3. **Versión publicada:** el HTML de pruebas (`23-oct-2026`) referencia `index-CC-4IrN2.js`, mientras el build local corregido genera `index-ClBm9E1o.js`. La búsqueda del bundle público anterior no contiene `gestionar-tarjeta` ni `/tarjetas/:id/gestionar`. Esto confirma que el VPS no contiene el build local actual; no se desplegó desde este trabajo.

## Endpoint y flujo de navegación

`GET /api/v1/seguridad/mi-navegacion` obtiene el usuario desde la sesión y consulta:

- `tblUsuariosPerfiles`: relación activa del usuario.
- `tblPerfiles`: perfil activo.
- `tblPerfilesNavegaciones`: relación activa y `permiteVisualizar=1`.
- `tblNavegaciones`: opción activa y visible.

Antes de esta corrección, `buildNavigationTree` construía el árbol únicamente con las filas devueltas. Un padre ausente convertía al hijo en raíz. Ahora la consulta incorpora, solo para visualización, los ancestros activos y visibles de las opciones asignadas mediante CTE recursiva. No concede permisos ni modifica datos.

El frontend carga el menú una vez por sesión (`useNavigation.ts`). Se limpia al iniciar sesión, cerrar sesión o expirar la sesión; no se usa localStorage para este menú. La llamada se realiza desde `AdminLayout` y también desde el guard.

## RBAC y limitaciones de verificación

La navegación se filtra por perfil y relaciones activas. El endpoint requiere sesión; una consulta sin cookie al ambiente de pruebas respondió `401 Autenticación requerida`. Por ello no fue posible comparar la respuesta real de un usuario de LOCAL contra uno de PRUEBAS ni afirmar una diferencia de permisos concreta.

Las tablas que deben compararse con un usuario equivalente son:

```sql
-- Navegación por código de negocio
SELECT codigoNavegacion, nombreNavegacion, enlaceNavegacion,
       tipoNavegacion, ordenNavegacion, idNavegacionPadre,
       estadoNavegacion, esVisible
FROM Seguridad.tblNavegaciones
ORDER BY idNavegacionPadre, ordenNavegacion, codigoNavegacion;

-- Padres por código, no por ID numérico
SELECT child.codigoNavegacion AS codigoHijo,
       parent.codigoNavegacion AS codigoPadre
FROM Seguridad.tblNavegaciones child
LEFT JOIN Seguridad.tblNavegaciones parent
  ON parent.idNavegacion = child.idNavegacionPadre
ORDER BY codigoPadre, codigoHijo;

-- Perfiles y navegaciones por códigos
SELECT p.codigoPerfil, n.codigoNavegacion,
       pn.estadoPerfilNavegacion, pn.permiteVisualizar
FROM Seguridad.tblPerfilesNavegaciones pn
JOIN Seguridad.tblPerfiles p ON p.idPerfil = pn.idPerfil
JOIN Seguridad.tblNavegaciones n ON n.idNavegacion = pn.idNavegacion
ORDER BY p.codigoPerfil, n.codigoNavegacion;

-- Permisos del perfil por códigos
SELECT p.codigoPerfil, pe.codigoPermiso, pp.estadoPerfilPermiso
FROM Seguridad.tblPerfilesPermisos pp
JOIN Seguridad.tblPerfiles p ON p.idPerfil = pp.idPerfil
JOIN Seguridad.tblPermisos pe ON pe.idPermiso = pp.idPermiso
ORDER BY p.codigoPerfil, pe.codigoPermiso;

-- Usuarios, perfiles y estado (ejecutar igual en ambos ambientes)
SELECT u.nombreAcceso, p.codigoPerfil, up.estadoUsuarioPerfil
FROM Seguridad.tblUsuariosPerfiles up
JOIN Seguridad.tblUsuarios u ON u.idUsuario = up.idUsuario
JOIN Seguridad.tblPerfiles p ON p.idPerfil = up.idPerfil
ORDER BY u.nombreAcceso, p.codigoPerfil;

-- Idiomas asociados por código
SELECT n.codigoNavegacion, i.codigoIdioma, ni.tituloNavegacionIdioma
FROM Seguridad.tblNavegacionesIdiomas ni
JOIN Seguridad.tblNavegaciones n ON n.idNavegacion = ni.idNavegacion
JOIN Configuracion.tblIdiomas i ON i.idIdioma = ni.idIdioma
ORDER BY n.codigoNavegacion, i.codigoIdioma;
```

Estas consultas son de solo lectura y deben exportarse desde LOCAL y PRUEBAS para comparar conjuntos por `codigoNavegacion`, `codigoPerfil` y `codigoPermiso`, no por IDs.

## Archivos modificados

- `frontend/src/composables/useNavigation.ts`: acceso heredado para rutas hijas.
- `frontend/src/router/index.ts`: metadata `/tarjetas`, ruta explícita de acceso denegado y eliminación de redirección silenciosa al Inicio.
- `frontend/src/views/AccessDeniedView.vue`: mensaje explícito de RBAC.
- `backend/src/modules/seguridad/navegacion.repository.ts`: inclusión de ancestros activos/visibles sin cambios SQL persistentes.

No se modificaron registros SQL, usuarios, perfiles, sesiones ni TableroUNAH. No se generó script DML porque todavía no existe evidencia autorizada de qué filas deberían cambiar entre ambientes.
