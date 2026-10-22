# BackOffice administrativo

Los módulos `/administracion/perfiles`, `permisos`, `navegaciones`, `configuracion` y `auditoria` usan las tablas descritas en `database/SIGADll.sql`. No se ejecutaron migraciones ni escrituras en SQL Server.

## API

Base: `/api/v1/seguridad/admin`. Todas las rutas requieren sesión y `USUARIOS_ADMINISTRAR`; las escrituras requieren CSRF.

- `GET/POST /perfiles`, `PUT /perfiles/:id`, `PATCH /perfiles/:id/estado`.
- `GET /perfiles/:id/usuarios`, `GET/PUT /perfiles/:id/permisos`, `GET/PUT /perfiles/:id/navegaciones`.
- `GET/POST /permisos`, `PUT /permisos/:id`, `PATCH /permisos/:id/estado`, `GET /permisos/:id/perfiles`.
- `GET/POST /navegaciones`, `PUT /navegaciones/:id`, `PATCH /navegaciones/:id/estado`.
- `GET /configuracion`, `PUT /configuracion/:id`.
- `GET /auditoria`, `GET /auditoria/:source/:id`.

Los códigos de permiso se limitan a operaciones ya conectadas a `permissionFor`; el código no se puede cambiar y las asignaciones solo aceptan permisos activos que posee el actor. La asignación de perfiles desde administración de usuarios también rechaza perfiles con permisos superiores a los del actor. No existe borrado físico. Los cambios administrativos se escriben en `Auditoria.tblBitacoras` dentro de la misma transacción.

Configuración modifica únicamente `tblParametros.valorPredeterminado` cuando `permiteModificacion=1`, valida el tipo y excluye parámetros sensibles. La tabla no define un valor efectivo distinto del predeterminado. Auditoría consulta `tblBitacoras` e `tblIntentosAutenticacion`; estas últimas son las únicas fuentes de resultado de autenticación. Otros eventos no se presentan como instrumentados.

## Validación manual pendiente

No se dispone de una sesión contra la base institucional y no se realizaron pruebas funcionales en navegador. Para probar en desarrollo:

1. Verifique en SQL Server que existan las tablas/columnas del esquema y el permiso activo `USUARIOS_ADMINISTRAR` asignado a un usuario activo.
2. Ejecute `npm run dev` desde `backend` y `frontend`, configure `VITE_API_BASE_URL` y acceda con dicho usuario.
3. Abra el módulo desde el menú dinámico si ya está asignado. Si todavía no hay opciones administrativas, la ruta requiere la autorización `USUARIOS_ADMINISTRAR` y permite entrar al editor de Navegación; cree opciones usando las rutas ofrecidas y asígnelas al perfil.
4. Compruebe alta/edición/estado, asignación y revocación; intente retirar `USUARIOS_ADMINISTRAR` del último perfil administrador y confirme la respuesta `409`.
5. Revise parámetros y eventos reales, confirme que un intento no autorizado recibe `403` y que escrituras sin CSRF son rechazadas.

No se requiere script SQL nuevo para estas pantallas. Si la base desplegada difiere del esquema versionado, la discrepancia debe revisarla un DBA antes de cualquier ajuste; este trabajo no propone ni ejecuta migraciones.
