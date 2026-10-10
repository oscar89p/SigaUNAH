# SIGA UNAH

Sistema de Gestión de Accesos a Ascensores de la Universidad Nacional Autónoma de Honduras.

## Tecnologías

- Backend: Node.js, TypeScript, Fastify, Zod y SQL Server mediante `mssql`.
- Frontend: Vue 3, TypeScript, Vite y Vue Router.
- Arquitectura backend preparada para el patrón `routes -> services -> repositories`, con componentes transversales bajo `shared/`.

## Estructura

```text
SigaUNAH/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── campus/
│   │   │   ├── edificios/
│   │   │   ├── elevadores/
│   │   │   ├── dispositivos/
│   │   │   └── health/
│   │   ├── shared/
│   │   └── server.ts
│   └── tests/
├── frontend/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── layouts/
│       ├── modules/
│       ├── router/
│       ├── services/
│       ├── stores/
│       ├── types/
│       └── views/
├── database/
└── docs/
```

## Backend

Requiere Node.js 20 o superior.

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

El servicio se inicia por defecto en `http://localhost:3000`. Su estado puede comprobarse en `GET /health`.

Comandos de validación:

```bash
npm run typecheck
npm run build
npm start
```

### Variables del backend

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto HTTP del API. |
| `HOST` | Interfaz de red en la que escucha Fastify. |
| `DB_SERVER` | Servidor o instancia de SQL Server. |
| `DB_PORT` | Puerto de SQL Server. |
| `DB_DATABASE` | Nombre de la base de datos (`DbSigaUNAH`). |
| `DB_USER` | Usuario de la base de datos. |
| `DB_PASSWORD` | Contraseña de la base de datos. |
| `DB_ENCRYPT` | Habilita el cifrado de la conexión (`true` o `false`). |
| `DB_TRUST_SERVER_CERTIFICATE` | Permite confiar en un certificado local no verificable (`true` o `false`). |
| `DEMO_USER` | Usuario de autenticación temporal para demostración. |
| `DEMO_PASSWORD` | Contraseña de autenticación temporal; no debe versionarse. |
| `DEMO_DISPLAY_NAME` | Nombre mostrado en la sesión del BackOffice. |

`DB_SERVER`, `DB_DATABASE`, `DB_USER` y `DB_PASSWORD` son obligatorias. `DB_PORT`, `DB_ENCRYPT` y `DB_TRUST_SERVER_CERTIFICATE` usan respectivamente `1433`, `true` y `false` cuando se omiten. No se deben guardar credenciales reales en el repositorio.

### Autenticación temporal de demostración

El BackOffice incluye autenticación temporal para entorno de demostración/desarrollo. El endpoint `POST /api/v1/auth/login` valida las variables `DEMO_USER`, `DEMO_PASSWORD` y `DEMO_DISPLAY_NAME`, sin consultar la base de datos ni devolver la contraseña. La sesión mínima del frontend se conserva en `sessionStorage`, con protección de rutas y logout.

Esta autenticación temporal no es una solución de producción. JWT, OAuth, LDAP, MFA, recuperación de contraseña y permisos reales quedan pendientes para una implementación posterior.

### Conexión a SQL Server

El backend crea el pool de conexiones de forma diferida cuando una operación necesita acceder a SQL Server. Todas las solicitudes reutilizan el mismo `ConnectionPool`; Fastify lo cierra de manera controlada al recibir `SIGINT` o `SIGTERM`.

La conexión no ejecuta la DDL ni crea o modifica tablas. El archivo `database/SIGADll.sql`, cuando sea incorporado, se considera únicamente una referencia oficial del modelo de datos.

Para verificar la configuración, iniciar el backend y consultar:

```bash
curl http://localhost:3000/health/database
```

Una conexión correcta devuelve `status`, el nombre de la base de datos activa y la fecha de SQL Server:

```json
{
  "status": "ok",
  "database": "DbSigaUNAH",
  "serverDate": "2026-01-01T00:00:00.000Z"
}
```

Si SQL Server no está disponible, el endpoint responde `503` con un mensaje genérico y no expone credenciales ni datos de conexión. `GET /health` continúa comprobando únicamente la disponibilidad del API.

## Accesos / Infraestructura

El primer módulo funcional implementa las entidades reales del esquema `DbSigaUNAH.Accesos`: `tblCampus`, `tblEdificios`, `tblElevadores` y `tblDispositivos`. Cada entidad conserva el flujo `routes -> services -> repositories`, usa consultas parametrizadas y pagina directamente en SQL Server con `OFFSET/FETCH`. Los valores de ordenamiento se limitan a una whitelist por recurso.

Endpoints disponibles:

```text
GET   /api/v1/campus
GET   /api/v1/campus/:id
POST  /api/v1/campus
PUT   /api/v1/campus/:id
PATCH /api/v1/campus/:id/estado

GET   /api/v1/edificios
GET   /api/v1/edificios/:id
POST  /api/v1/edificios
PUT   /api/v1/edificios/:id
PATCH /api/v1/edificios/:id/estado

GET   /api/v1/elevadores
GET   /api/v1/elevadores/:id
POST  /api/v1/elevadores
PUT   /api/v1/elevadores/:id
PATCH /api/v1/elevadores/:id/estado

GET   /api/v1/dispositivos
GET   /api/v1/dispositivos/:id
POST  /api/v1/dispositivos
PUT   /api/v1/dispositivos/:id
PATCH /api/v1/dispositivos/:id/estado
```

Los listados aceptan `page`, `pageSize`, `search`, `sortBy` y `sortDirection`. No existe DELETE físico. Las pantallas de Campus, Edificios, Elevadores y Dispositivos están disponibles desde el menú de infraestructura.

## Frontend

Con el backend en ejecución, abrir otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite muestra en la terminal la URL local, normalmente `http://localhost:5173`. El Dashboard consulta automáticamente el endpoint `/health`.

Comandos de validación:

```bash
npm run typecheck
npm run build
npm run preview
```

### Variables del frontend

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | URL base del backend, por ejemplo `http://localhost:3000`. |
