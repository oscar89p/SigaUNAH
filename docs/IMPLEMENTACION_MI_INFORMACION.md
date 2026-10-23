# Implementación de Mi Cuenta → Mi Información

## Alcance

Se implementó únicamente la consulta de información del usuario autenticado. No se habilitó edición, administración de usuarios, cambio de contraseña ni consulta de otros usuarios.

## Archivos modificados y creados

Backend:

- `backend/src/modules/seguridad/usuarios.routes.ts`: endpoint self-service.
- `backend/src/modules/seguridad/usuarios.service.ts`: servicio que recibe únicamente el `auth.idUsuario`.
- `backend/src/modules/seguridad/usuarios.repository.ts`: consulta SQL con lista explícita de campos seguros.
- `backend/src/modules/auth/authorization.ts`: permite que el hook global trate el endpoint como solicitud autenticada sin exigir permiso administrativo.
- `backend/src/modules/auth/auth.service.test.ts`: prueba de clasificación del endpoint self-service.
- `backend/src/modules/seguridad/usuarios.routes.test.ts`: prueba de aislamiento del identificador de sesión.

Frontend:

- `frontend/src/views/MyInformationView.vue`: vista de consulta de solo lectura.
- `frontend/src/services/usuarios.ts`: contrato y cliente del endpoint.
- `frontend/src/router/index.ts`: ruta `/mi-cuenta/informacion`.
- `frontend/src/assets/main.css`: presentación de las tres secciones.

## Endpoint

```http
GET /api/v1/usuarios/mi-informacion
```

La ruta se registra junto al módulo de usuarios, pero no acepta `idUsuario` en ruta, query ni cuerpo. El hook global autentica la cookie y coloca el contexto en `request.auth`; el handler usa exclusivamente `request.auth.idUsuario`.

El endpoint no requiere `USUARIOS_ADMINISTRAR` ni otro permiso administrativo. Una petición sin sesión sigue siendo rechazada por el hook global con HTTP 401.

## Campos devueltos

La consulta usa `Seguridad.tblUsuarios` y devuelve únicamente:

- `nombreUsuario`.
- `correoElectronico`.
- `nombreAcceso`.
- `identificadorInstitucional`.
- `tipoAutenticacion`.
- `estadoUsuario`.
- `ultimoAcceso`.

No se devuelven `claveHash`, contraseñas, tokens, identificadores de sesión, perfiles, permisos ni datos de otros usuarios.

## Seguridad

- El identificador se toma del `AuthContext` creado por la autenticación existente.
- La consulta SQL usa parámetro `@idUsuario` tipado como `sql.BigInt`.
- El endpoint es de solo lectura.
- Los parámetros externos son ignorados porque el handler no los lee.
- La vista no ofrece controles de edición.

## Pruebas ejecutadas

- Backend typecheck: ejecutado.
- Backend build: ejecutado.
- Pruebas backend existentes y nuevas: ejecutadas.
- Frontend typecheck/build: ejecutados.
- La prueba nueva verifica que `?idUsuario=99` no cambia el ID utilizado: se consulta el ID autenticado `7`.
- La prueba verifica que la respuesta no contiene `claveHash`.

La prueba HTTP sin sesión depende del hook global y debe devolver HTTP 401 en ejecución integrada. No se realizaron cambios SQL ni despliegues.

## Limitaciones

- La navegación dinámica `MI_INFORMACION` debe estar activa y asignada al perfil en SQL Server para que el guard de Vue permita el acceso desde el menú. No se modificaron esas filas.
- No existe edición de información en esta primera versión.
- `ultimoAcceso` se muestra solo porque existe y es verificable en `Seguridad.tblUsuarios`; puede aparecer como “No disponible” cuando sea `NULL`.
