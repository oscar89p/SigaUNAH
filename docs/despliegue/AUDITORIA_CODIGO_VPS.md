# Auditoría de código y VPS — SIGA UNAH

**Fecha de revisión:** 2026-10-23
**Alcance:** lectura local y comprobaciones HTTP/SSH no destructivas. No se desplegó, no se reinició ningún servicio y no se hicieron commits.

## Resumen ejecutivo

El árbol local está en `main`, en el commit `e131a786790e354d9e14dbbdb28ad55761469235` (`Actualizar gestion de tarjetas SIGA`, 2026-10-22 18:59:57 -0600), pero tiene cambios sin commit en backend y frontend, además de archivos nuevos. No es una versión publicable como commit hasta revisar, probar y autorizar esos cambios.

El VPS no pudo ser consultado por SSH: `ssh linux.demostc.app` agotó el tiempo de espera al puerto 22. Por tanto, el commit desplegado, la rama, el estado del árbol y el contenido real de `/opt/apps/SigaUNAH` **no están confirmados**.

La publicación HTTP sí respondió:

- `sigaunah.systemstc.app` → `93.127.128.123`, HTTP 200.
- HTML publicado referencia `/assets/index-cjkoeAvz.js` y `/assets/index-B9rjFQk9.css`.
- `Last-Modified` del HTML: `Fri, 23 Oct 2026 01:02:00 GMT`.
- `api-sigaunah.systemstc.app/health` → HTTP 200, `{"status":"ok","service":"siga-unah-api"}`.

Estos artefactos prueban disponibilidad y una huella del build publicado, pero no permiten inferir un commit Git.

## Estado Git local confirmado

```text
Rama: main
Commit HEAD: e131a786790e354d9e14dbbdb28ad55761469235
Mensaje: Actualizar gestion de tarjetas SIGA
Remote: https://github.com/oscar89p/SigaUNAH.git
```

El árbol está sucio. Hay 28 archivos versionados modificados y archivos nuevos, entre ellos:

### Backend pendiente

- `backend/src/server.ts`
- `backend/src/modules/auth/*`
- `backend/src/modules/beneficiarios/*`
- `backend/src/modules/operaciones/monitoreo.repository.ts`
- `backend/src/modules/seguridad/administracion.*`
- `backend/src/modules/seguridad/usuarios.*`
- `backend/src/modules/solicitudes/solicitudes.repository.ts`
- `backend/src/modules/reportes/` (nuevo)
- `backend/src/modules/beneficiarios/beneficiarios.types.test.ts` (nuevo)
- `backend/src/modules/seguridad/usuarios.routes.test.ts` (nuevo)

### Frontend pendiente

- `frontend/src/assets/main.css`
- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/router/index.ts`
- `frontend/src/services/{administracion,beneficiarios,http,solicitudes,usuarios}.ts`
- `frontend/src/views/{Beneficiarios,Configuration,Monitoring,Solicitudes}View.vue`
- `frontend/src/services/reportes.ts` (nuevo)
- `frontend/src/views/{Catalogs,MyCard,MyInformation,Reports}View.vue` (nuevos)

También existen documentos nuevos y `database/pendientes/05_catalogos_navegacion.sql`. No se deben incluir automáticamente en una publicación sin revisión funcional.

## Dependencias y variables de entorno

- No hay diferencias en `backend/package.json`, `backend/package-lock.json`, `frontend/package.json` ni `frontend/package-lock.json` frente a `HEAD`.
- No se identificaron dependencias nuevas.
- No hay cambios pendientes en `backend/.env.example` ni `frontend/.env.example`.
- Variables esperadas del backend: `PORT`, `HOST`, `DB_SERVER`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE`, `AUTH_SESSION_COOKIE`, `AUTH_SESSION_IDLE_MINUTES`, `AUTH_SESSION_MAX_HOURS`, `AUTH_COOKIE_SECURE`, `AUTH_ALLOWED_ORIGINS`.
- Variable esperada del frontend: `VITE_API_BASE_URL`.
- Nunca copiar `.env` ni credenciales al repositorio o al paquete de despliegue.

## Qué requiere reinicio

- Cambios en `backend/src/**` requieren reconstruir backend y reiniciar `sigaunah-backend.service` para tomar el nuevo JavaScript.
- Cambios en `frontend/src/**` requieren ejecutar el build y publicar el contenido generado; no requieren reiniciar el backend, pero sí invalidar caché si aplica.
- Cambios en variables del servicio requieren reiniciar el servicio backend después de actualizar el archivo de entorno.
- Nada de esto se ejecutó en esta auditoría.

## Verificación pendiente en VPS

Con acceso SSH autorizado, ejecutar solo lectura:

```bash
ssh <usuario>@<host> '
  cd /opt/apps/SigaUNAH &&
  git rev-parse HEAD &&
  git branch --show-current &&
  git status --short &&
  git log -1 --date=iso --format="%H %ad %s"
'
ssh <usuario>@<host> 'systemctl show sigaunah-backend.service --no-pager \
  --property=ActiveState,SubState,ExecMainStartTimestamp,FragmentPath,WorkingDirectory,EnvironmentFiles'
```

Si `/opt/apps/SigaUNAH` no es un checkout Git, registrar la versión mediante un manifiesto SHA-256 del artefacto desplegado y conservarlo como evidencia. No leer valores de archivos `.env`.
