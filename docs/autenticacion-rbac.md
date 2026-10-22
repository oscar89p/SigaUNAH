# Autenticación y autorización SIGA UNAH

## Política implementada

- `claveHash` se valida exclusivamente con Argon2id.
- La sesión se almacena en `Seguridad.tblSesionesUsuarios`; la cookie contiene un identificador aleatorio y la base almacena únicamente su SHA-256.
- Expiración deslizante: 30 minutos de inactividad. Límite absoluto: 8 horas desde `fechaInicio`.
- Cinco intentos fallidos activan `fechaBloqueo` durante 15 minutos. Los eventos se registran en `Auditoria.tblIntentosAutenticacion`.
- La cookie de sesión es HttpOnly, Secure y SameSite=Strict. El token CSRF se entrega en la respuesta de login/me, se mantiene en memoria en el frontend y se deriva de la sesión HttpOnly; se exige en operaciones mutables, incluido logout.
- CORS utiliza exclusivamente `AUTH_ALLOWED_ORIGINS`, sin comodines.

## Matriz de endpoints

| Endpoint | Método | Permiso existente | Estado |
|---|---:|---|---|
| `/health`, `/health/database` | GET | Ninguno | Público |
| `/api/v1/auth/login` | POST | Ninguno | Público; credenciales SQL |
| `/api/v1/auth/me`, `/api/v1/auth/logout` | GET/POST | Sesión válida | Implementado |
| `/api/v1/beneficiarios` y subrutas | GET | `BENEFICIARIOS_CONSULTAR` | Implementado |
| `/api/v1/beneficiarios` | POST | `BENEFICIARIOS_REGISTRAR` | Implementado |
| `/api/v1/beneficiarios/:id` | PUT | `BENEFICIARIOS_MODIFICAR` | Implementado |
| `/api/v1/beneficiarios/:id/estado` | PATCH | `BENEFICIARIOS_VALIDAR` | Implementado |
| `/api/v1/tarjetas` y subrutas | GET | `TARJETAS_CONSULTAR` | Implementado |
| `/api/v1/tarjetas` | POST | `TARJETAS_ASIGNAR` | Implementado |
| `/api/v1/tarjetas/:id` | PUT | `TARJETAS_ASIGNAR` | Requiere confirmación funcional |
| `/api/v1/tarjetas/:id/estado` | PATCH | `TARJETAS_ACTIVAR` | Requiere distinguir activar/desactivar |
| Campus, edificios, elevadores, dispositivos y solicitudes | Todos | No existe código equivalente en la base | Denegados (`403`) hasta aprobación institucional |

No se inventaron códigos de permisos. La matriz pendiente requiere que el responsable funcional asigne códigos ya existentes o apruebe nuevas definiciones SQL antes de habilitar esos endpoints. La API aplica denegación por defecto.

## Habilitación del primer administrador

1. Un DBA crea el usuario institucional en `Seguridad.tblUsuarios`, sin contraseña en texto plano.
2. El hash se genera fuera de SQL Server con Argon2id y se guarda en `claveHash`.
3. El DBA asigna el perfil existente `ADMIN_GENERAL` mediante `Seguridad.tblUsuariosPerfiles`.
4. Debe verificarse que el perfil tenga los permisos requeridos en `Seguridad.tblPerfilesPermisos`.
5. Se valida el acceso mediante HTTPS y se revoca cualquier sesión de prueba.

## Base de datos y credenciales

La aplicación no debe conectarse con `sa`. Antes del despliegue, el DBA debe sustituirlo por una identidad SQL dedicada con privilegios mínimos, siguiendo el proceso institucional de aprobación. Este cambio no lo realiza la aplicación ni este repositorio.

La matriz de `ADMIN_GENERAL` debe verificarse mediante una consulta de solo lectura sobre `tblPerfiles`, `tblPerfilesPermisos` y `tblPermisos`. No se modifican asignaciones como parte de esa verificación.

La aplicación no crea usuarios, perfiles ni contraseñas predeterminadas.
