# Implementación de Reportes y Estadísticas

## Alcance

Se agregó la ruta Vue `/reportes`, una vista de indicadores y dos endpoints de lectura. Todas las cifras se calculan mediante consultas parametrizadas contra SQL Server; no se insertaron datos ni se generaron valores simulados.

## Indicadores y fuente SQL

| Indicador | Definición | Fuente y relaciones | Filtros aplicables |
|---|---|---|---|
| Total de beneficiarios | `COUNT(1)` de beneficiarios | `Beneficiarios.tblBeneficiarios` + `Tipos.tblTiposValores` | Tipo, estado, fecha de registro |
| Beneficiarios por tipo | Conteo agrupado por catálogo | `idTipoBeneficiario -> Tipos.tblTiposValores` | Tipo, estado, fecha de registro |
| Total de solicitudes | `COUNT(1)` de solicitudes | `Solicitudes.tblSolicitudes -> Beneficiarios.tblBeneficiarios` | Tipo, estado, fecha de solicitud |
| Solicitudes por estado | Conteo agrupado por catálogo | `idEstadoSolicitud -> Tipos.tblTiposValores` | Tipo, estado, fechas |
| Tarjetas por estado | Conteo agrupado por catálogo | `idEstadoTarjeta -> Tipos.tblTiposValores` | Estado de tarjeta |
| Asignaciones vigentes | Conteo con `esAsignacionVigente=1` | `Tarjetas.tblAsignaciones -> Beneficiarios.tblBeneficiarios` | Tipo, vigencia, fecha de asignación |
| Campus | Conteo de registros | `Accesos.tblCampus` | Campus, estado |
| Edificios | Conteo por ubicación | `tblEdificios -> tblCampus` | Campus, edificio, estado |
| Elevadores | Conteo por ubicación | `tblElevadores -> tblEdificios -> tblCampus` | Campus, edificio, estado |
| Dispositivos | Conteo por ubicación cuando existe | `tblDispositivos -> tblElevadores -> tblEdificios -> tblCampus` | Campus, edificio, estado |

No se incluyeron métricas de acceso o incidentes porque ya existe el módulo Monitoreo y se evitó duplicar indicadores sin una definición funcional adicional.

## Endpoints

```http
GET /api/v1/reportes/opciones
GET /api/v1/reportes/resumen
GET /api/v1/reportes/exportar
```

`/api/v1/reportes/opciones` es una lectura protegida por `REPORTES_CONSULTAR` que devuelve campus activos, edificios activos de campus activos y valores activos de `TIPO_BENEFICIARIO`. Se agregó porque los listados administrativos de infraestructura requieren `ACCESOS_CONSULTAR`; no se otorgaron permisos administrativos.

Parámetros opcionales:

```text
idCampus
idEdificio
idTipoBeneficiario
estado=all|active|inactive
desde=YYYY-MM-DD
hasta=YYYY-MM-DD
```

`/resumen` devuelve JSON estructurado. `/exportar` devuelve CSV UTF-8 con los indicadores y distribuciones calculadas con los mismos filtros.

## Seguridad

- Las consultas requieren sesión autenticada.
- `/api/v1/reportes/resumen` requiere `REPORTES_CONSULTAR`.
- `/api/v1/reportes/exportar` requiere explícitamente `REPORTES_EXPORTAR`.
- No se requieren permisos administrativos.
- No se devuelven nombres, identidades, cuentas, correos ni datos personales; solo conteos y nombres de estados/tipos de catálogo.
- Los permisos se conectaron en `backend/src/modules/auth/authorization.ts`.

## Archivos principales

Backend:

- `backend/src/modules/reportes/reportes.types.ts`
- `backend/src/modules/reportes/reportes.repository.ts`
- `backend/src/modules/reportes/reportes.service.ts`
- `backend/src/modules/reportes/reportes.routes.ts`
- `backend/src/server.ts`
- `backend/src/modules/auth/authorization.ts`
- `backend/src/modules/reportes/reportes.types.test.ts`

Frontend:

- `frontend/src/views/ReportsView.vue`
- `frontend/src/services/reportes.ts`
- `frontend/src/services/http.ts`
- `frontend/src/router/index.ts`

Los filtros de la vista son combobox dinámicos. El edificio se filtra por el campus seleccionado y se limpia automáticamente si deja de corresponder. La opción vacía representa “Todos” y no envía identificadores manuales.

## Resultados verificables

La ejecución directa contra SQL Server Docker local devolvió:

```text
beneficiarios = 66
solicitudes = 7
asignaciones vigentes = 4
campus = 6
edificios = 8
elevadores = 11
dispositivos = 11
```

También se ejecutó una consulta con estado activo, campus y rango de fechas, y se generó CSV correctamente con encabezado `Indicador,Valor`.

Validaciones:

- Backend typecheck: correcto.
- Backend build: correcto.
- Pruebas backend: **28 archivos, 86 pruebas correctas**.
- Frontend typecheck/build: correcto.
- Consultas de resumen y exportación contra SQL Server local: correctas.
- Opciones contra SQL Server local: 6 campus, 8 edificios y los valores `ESTUDIANTE`, `DOCENTE`, `EMPLEADO`, `VISITANTE`.
- `git diff --check`: correcto.

## Limitaciones y pendientes

- `/reportes` aparecerá en el menú solo si la navegación `REPORTES` está activa y asignada al perfil en SQL Server; este trabajo no modifica esas filas.
- No se agregaron gráficos ni librerías nuevas; la vista usa tarjetas y tablas.
- Campus/edificio no tienen relación con beneficiarios ni solicitudes en el DDL, por lo que esos filtros solo afectan infraestructura. No se inventaron relaciones.
- No se implementó exportación de personas o usuarios para evitar exposición de información sensible.
- La validación HTTP autenticada en navegador depende de una sesión válida y de que los permisos estén asignados en el ambiente.
