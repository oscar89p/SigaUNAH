# Administración de usuarios

## Requisitos

- SQL Server disponible con `Seguridad.tblUsuarios`, `tblPerfiles` y `tblUsuariosPerfiles`.
- La cuenta autenticada debe tener el permiso existente `USUARIOS_ADMINISTRAR`.
- La navegación activa `/administracion/usuarios` debe estar asignada al perfil del usuario.

## Prueba desde el navegador

1. Inicie el backend con `cd backend && npm run dev`.
2. Inicie el frontend con `cd frontend && npm run dev`.
3. Ingrese con una cuenta que tenga `USUARIOS_ADMINISTRAR`.
4. Abra **Administración → Usuarios**.
5. Compruebe el listado, búsqueda por nombre/usuario/correo y filtro de estado.
6. Cree un usuario local con contraseña de al menos ocho caracteres y uno o más perfiles.
7. Edite sus datos o cambie sus perfiles; la contraseña solo se cambia si se captura una nueva.
8. Active/desactive un usuario y verifique que el estado se actualiza sin eliminar el registro.
9. Compruebe en SQL Server que la acción quedó registrada en `Auditoria.tblBitacoras`.

Las contraseñas y `claveHash` nunca se devuelven por la API. La cuenta actualmente autenticada no puede dejar el sistema sin ningún administrador activo.
