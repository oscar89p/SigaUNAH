# Plan de despliegue VPS — SIGA UNAH

## Estado

Este documento es una propuesta. No se ejecutaron los comandos, no se modificaron bases, no se desplegó y no se reinició `sigaunah-backend.service`.

## Precondiciones y autorizaciones

1. Confirmar con el responsable la versión exacta a publicar. El árbol local no está limpio y contiene cambios sin commit.
2. Obtener acceso SSH operativo al VPS y registrar el commit/artefacto existente antes de reemplazarlo. En esta revisión SSH expiró por timeout.
3. Comparar Local-MacBook-Docker y Linux STC - DEV - MSSQL con las consultas SELECT del documento correspondiente.
4. Autorizar explícitamente qué catálogos, permisos, navegaciones o parámetros pueden sincronizarse.
5. Proteger/respaldar la base Linux STC y confirmar ventana de mantenimiento.
6. Validar que la versión de Node.js instalada sea compatible (`backend` requiere Node 20+).
7. Confirmar variables de entorno del servicio sin exponer valores: especialmente `DB_SERVER`, `DB_DATABASE=DbSigaUNAH`, `AUTH_ALLOWED_ORIGINS=https://sigaunah.systemstc.app`, `AUTH_COOKIE_SECURE=true` y `VITE_API_BASE_URL=https://api-sigaunah.systemstc.app` para el build de producción.
8. Confirmar que no se incluye `TableroUNAH` ni ningún `.env` en el paquete.

## Preparación local propuesta

Ejecutar después de revisar/autorización, sin alterar el árbol de trabajo accidentalmente:

```bash
cd /Users/oscar89p/Documents/UNAH/SigaUNAH
git status --short
git diff --check
git diff HEAD -- backend frontend
cd backend && npm ci && npm run typecheck && npm run build && npm test
cd ../frontend && npm ci && npm run typecheck && npm run build
```

Guardar el hash del commit aprobado y un manifiesto de hashes del backend compilado y `frontend/dist`. No usar el estado de trabajo sin commit como evidencia de versión.

## Paquete y copia propuesta

La forma exacta depende del mecanismo autorizado en el VPS. Antes de copiar, obtener la ruta del servicio con `systemctl show` y confirmar si el frontend se sirve desde `/opt/apps/SigaUNAH/frontend/dist` o desde otra ruta Nginx.

```bash
# Solo después de confirmar usuario, host, rutas y ventana.
ssh <usuario>@<host> 'cd /opt/apps/SigaUNAH && git rev-parse HEAD || true'
rsync -av --dry-run --delete-excluded \
  --exclude='.env' --exclude='node_modules' --exclude='.git' \
  ./ <usuario>@<host>:/opt/apps/SigaUNAH/
```

No ejecutar `rsync --delete` hasta tener respaldo y autorización explícita. Preferir un release versionado y un enlace atómico si la infraestructura lo permite; conservar el release anterior para rollback.

## Flujo de backend

1. Respaldar la versión actual y registrar `systemctl show sigaunah-backend.service`.
2. Copiar únicamente el artefacto aprobado y archivos necesarios.
3. En el VPS ejecutar `npm ci --omit=dev` en el release aprobado o usar el procedimiento existente del servicio.
4. Ejecutar `npm run build` antes de reiniciar.
5. Verificar configuración sin imprimir secretos.
6. Reiniciar solo con autorización:

```bash
sudo systemctl restart sigaunah-backend.service
sudo systemctl is-active sigaunah-backend.service
sudo systemctl status sigaunah-backend.service --no-pager
curl -fsS https://api-sigaunah.systemstc.app/health
```

7. Revisar logs recientes y probar autenticación/health desde el entorno autorizado.

## Flujo de frontend

1. Construir localmente con la URL API de producción aprobada.
2. Registrar `index.html` y hashes de assets.
3. Copiar solo `frontend/dist` a la ruta configurada en Nginx.
4. Validar HTTP 200, assets, rutas directas y caché.
5. No reiniciar backend por un cambio exclusivo de frontend; invalidar caché únicamente si está contemplado.

## Propuesta de sincronización incremental de datos

No ejecutar hasta que las consultas comparativas hayan sido revisadas y exista autorización por tabla/campo. La estrategia es por claves funcionales, sin DELETE y sin tocar datos operativos.

### Alcance permitido preliminar

- Candidatos: `Seguridad.tblPermisos`, `Seguridad.tblNavegaciones`, `Seguridad.tblPerfilesPermisos`, `Seguridad.tblPerfilesNavegaciones`, `Tipos.tblTipos`, `Tipos.tblTiposValores` y, con aprobación separada, configuración institucional.
- Excluidos: usuarios, sesiones, auditoría, logs, tarjetas, asignaciones, movimientos, reemplazos, revisiones, solicitudes y cualquier registro operativo.
- No copiar IDs identity de local. Resolver FKs en el VPS por códigos únicos.
- No cambiar estados existentes ni valores operativos salvo autorización explícita por fila/campo.

### Plantilla controlada — no ejecutar

El siguiente esquema es deliberadamente incompleto como comando operativo: requiere sustituir tablas temporales por un lote aprobado, validar columnas y revisar cada diferencia.

```sql
-- NO EJECUTAR. Propuesta para revisión DBA/funcional.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
BEGIN TRY
  -- 1) Cargar únicamente el conjunto aprobado en #Fuente con claves naturales.
  -- 2) Prevalidar duplicados, FKs, longitudes, estados autorizados y códigos.
  -- 3) INSERT solo cuando no exista la clave natural en Linux.
  INSERT INTO Seguridad.tblPermisos
    (codigoPermiso,nombrePermiso,descripcionPermiso,moduloPermiso,estadoPermiso,usuarioRegistro)
  SELECT f.codigoPermiso,f.nombrePermiso,f.descripcionPermiso,f.moduloPermiso,
         f.estadoPermiso,N'DEPLOY_REVISADO'
  FROM #PermisosAprobados f
  WHERE NOT EXISTS (
    SELECT 1 FROM Seguridad.tblPermisos d
    WHERE d.codigoPermiso=f.codigoPermiso
  );

  -- 4) UPDATE solo campos expresamente autorizados y solo por código.
  -- Nunca actualizar estados/valores operativos de forma masiva.
  -- UPDATE d SET ... FROM ... WHERE ... AND f.autorizado=1;

  -- 5) Resolver idPerfil/idPermiso/idNavegacion/idTipo por códigos del VPS.
  -- Insertar relaciones solo si no existen; jamás duplicarlas.

  -- 6) Verificaciones posteriores: duplicados, FKs, conteos y códigos aprobados.
  -- ROLLBACK TRANSACTION; -- modo de ensayo obligatorio inicial
  -- COMMIT TRANSACTION;   -- solo después de aprobación explícita
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

Para `Tipos.tblTipos` y `Tipos.tblTiposValores`, las claves naturales propuestas son `(codigoCategoria,codigoTipo)` y `(codigoTipo,codigoTipoValor)`. Para relaciones de seguridad se usan `(codigoPerfil,codigoPermiso)` y `(codigoPerfil,codigoNavegacion)`. Cualquier modificación de `estado*`, `permiteVisualizar`, nombres o descripciones requiere autorización específica.

## Rollback y criterios de abortar

- Abortar si el commit/artefacto actual del VPS no pudo registrarse.
- Abortar si falla `npm ci`, typecheck, build, health o conexión a SQL Server.
- Abortar si hay duplicados por clave natural, FKs faltantes, diferencias DDL no explicadas o divergencias operativas.
- Para datos, iniciar con `ROLLBACK` y exportar el resultado de verificación. Solo convertir a `COMMIT` con autorización.
- Para aplicación, conservar el release anterior y restaurarlo sin alterar la base si el health check o smoke tests fallan.
- No ejecutar scripts `database/pendientes/*`, `SIGA_P2_02_APLICAR_INDICE_DBEAVER.sql` ni propuestas P1 como parte automática de este despliegue.

## Comandos de verificación posteriores

```bash
curl -fsS https://api-sigaunah.systemstc.app/health
curl -fsSI https://sigaunah.systemstc.app/
ssh <usuario>@<host> 'systemctl is-active sigaunah-backend.service'
ssh <usuario>@<host> 'journalctl -u sigaunah-backend.service -n 100 --no-pager'
```

Los últimos dos comandos requieren acceso SSH y deben ejecutarse únicamente durante la ventana aprobada. La auditoría actual no los ejecutó por timeout de SSH.
