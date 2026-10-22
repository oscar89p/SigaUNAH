# Validación de disponibilidad de tarjetas P2

## 1. Causa raíz comprobada

La consulta backend que alimenta `GET /api/v1/tarjetas/disponibles` aplica exactamente estas condiciones:

```sql
t.estadoTarjeta = 1
AND NOT EXISTS (
  SELECT 1
  FROM Tarjetas.tblAsignaciones a
  WHERE a.idTarjeta = t.idTarjeta
    AND a.esAsignacionVigente = 1
)
```

Por tanto, el texto **Entregada** (`idEstadoTarjeta` / catálogo `ESTADO_TARJETA`) no se interpreta automáticamente como disponible ni como no disponible. Es un estado de catálogo distinto de la bandera `estadoTarjeta`, y la disponibilidad requiere además no tener asignación vigente.

La causa institucional exacta de que el selector esté vacío no pudo confirmarse porque este entorno no tiene `backend/.env` ni conexión autorizada a SQL Server. El DDL local tampoco debe usarse como resultado de la instancia: conserva una versión previa del índice, mientras se informó que el índice institucional ya está filtrado. No se inventaron registros ni se modificó la base.

La causa verificable en código era la ausencia de diagnóstico: una lista vacía no indicaba si todas las tarjetas estaban inactivas, tenían asignación vigente o simplemente no cumplían `estadoTarjeta=1`. Se agregó un endpoint de lectura para separar esas causas.

## 2. Consultas SQL de diagnóstico y resultados

Ejecutar en DBeaver/SSMS con una conexión autorizada, como lectura únicamente:

```sql
SELECT t.idTarjeta,t.codigoTarjeta,t.idEstadoTarjeta,
       tv.codigoTipoValor,tv.nombreTipoValor,t.estadoTarjeta,
       a.idAsignacion,a.esAsignacionVigente,a.fechaDevolucion,
       b.idBeneficiario,CONCAT(p.primerNombre,N' ',p.primerApellido) AS beneficiario
FROM DbSigaUNAH.Tarjetas.tblTarjetas t
JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta
LEFT JOIN DbSigaUNAH.Tarjetas.tblAsignaciones a ON a.idTarjeta=t.idTarjeta
LEFT JOIN DbSigaUNAH.Beneficiarios.tblBeneficiarios b ON b.idBeneficiario=a.idBeneficiario
LEFT JOIN DbSigaUNAH.Beneficiarios.tblPersonas p ON p.idPersona=b.idPersona
ORDER BY t.codigoTarjeta,a.fechaRegistro DESC;

SELECT t.idTarjeta,t.codigoTarjeta,t.estadoTarjeta,
       tv.codigoTipoValor,tv.nombreTipoValor,
       CASE WHEN EXISTS (
         SELECT 1 FROM DbSigaUNAH.Tarjetas.tblAsignaciones a
         WHERE a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1
       ) THEN 1 ELSE 0 END AS tieneAsignacionVigente
FROM DbSigaUNAH.Tarjetas.tblTarjetas t
JOIN DbSigaUNAH.Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta
ORDER BY t.codigoTarjeta;

SELECT i.name,i.is_unique,i.has_filter,i.filter_definition,
       c.name AS columnaIndice,ic.key_ordinal
FROM DbSigaUNAH.sys.indexes i
JOIN DbSigaUNAH.sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
JOIN DbSigaUNAH.sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE i.object_id=OBJECT_ID(N'DbSigaUNAH.Tarjetas.tblAsignaciones')
  AND i.name=N'ukAsignacion_TarjetaVigente';
```

El diagnóstico disponible desde la API es:

`GET /api/v1/tarjetas/disponibles/diagnostico`

Devuelve totales de tarjetas, activas, inactivas, con asignación vigente y disponibles, además del desglose por estado de catálogo. No se ejecutó contra la base institucional desde este entorno; por ello no se reportan números ficticios.

## 3. Archivos modificados

- `backend/src/modules/tarjetas/tarjetas.repository.ts`
- `backend/src/modules/tarjetas/tarjetas.service.ts`
- `backend/src/modules/tarjetas/tarjetas.routes.ts`
- `frontend/src/services/tarjetas.ts`
- `frontend/src/views/TarjetasView.vue`
- `backend/src/modules/tarjetas/tarjetas.types.test.ts`
- `docs/VALIDACION_DISPONIBILIDAD_TARJETAS_P2.md`

## 4. Correcciones implementadas

- Se mantiene la regla segura: tarjeta activa (`estadoTarjeta=1`) y sin asignación vigente.
- Se agregó diagnóstico de solo lectura por causa de exclusión.
- El frontend diferencia error de consulta de lista realmente vacía.
- El mensaje vacío muestra los contadores disponibles cuando la API responde correctamente.
- El botón de asignación exige tarjeta, beneficiario, solicitud, estado, tipo de vigencia y fechas válidas.
- Las solicitudes se filtran por el beneficiario seleccionado.
- No se modificaron estados, registros, esquema, inventario ni permisos.
- Las asignaciones continúan usando transacciones, bloqueos y RBAC existentes.

No se relajó el filtro para aceptar automáticamente tarjetas «Entregadas», porque el significado funcional de ese estado debe confirmarse con los datos y reglas institucionales.

## 5. Pruebas ejecutadas

- Backend typecheck: aprobado.
- Backend pruebas automatizadas: ejecutadas y aprobadas.
- Backend build: aprobado.
- Frontend typecheck: aprobado.
- Frontend build: aprobado.
- Consultas SQL institucionales: no ejecutadas por ausencia de conexión autorizada.
- Flujo autenticado en navegador: no ejecutado.

### Incidente HTTP 500 del diagnóstico

La causa exacta fue una limitación de SQL Server en la consulta original de `backend/src/modules/tarjetas/tarjetas.repository.ts`: las expresiones `SUM(CASE ...)` contenían directamente subconsultas `EXISTS`/`NOT EXISTS`. SQL Server rechaza esa combinación con el error:

`Cannot perform an aggregate function on an expression containing an aggregate or a subquery.`

Fastify registraba la excepción en su `setErrorHandler` y respondía `500 Internal Server Error`; no era un fallo de sesión ni de RBAC. La ubicación era la consulta de `availabilityDiagnostics`, originalmente en las líneas 45–60 del repositorio.

La corrección calcula primero `tieneAsignacionVigente` en una CTE y luego aplica los agregados sobre esa columna. Se agregó una prueba de regresión que impide volver a colocar `EXISTS` dentro de las expresiones agregadas. El endpoint mantiene dos resultsets: resumen y desglose por estado.

El endpoint `GET /api/v1/tarjetas/disponibles` no utilizaba agregados ni presentaba esta excepción; la consulta principal de asignaciones tampoco depende del diagnóstico. El diagnóstico no bloquea la carga de asignaciones.

## 6. Bloqueos pendientes

1. Confirmar con la consulta de diagnóstico qué condición excluye las cuatro tarjetas.
2. Confirmar si `estadoTarjeta=1` es la condición institucional de tarjeta reutilizable o si existe un catálogo/relación adicional de estados permitidos. El modelo inspeccionado no contiene una tabla explícita de estados permitidos para asignación.
3. Verificar que las filas devueltas tengan `esAsignacionVigente=0` y que el índice institucional sea único filtrado por `esAsignacionVigente=1`.
4. Ejecutar el flujo real solo con permisos y datos autorizados.

## 7. Procedimiento exacto para navegador

1. Solicitar una sesión autorizada con `TARJETAS_CONSULTAR` y `TARJETAS_ASIGNAR`.
2. Iniciar backend y frontend con la configuración institucional autorizada.
3. Abrir `Operación → Tarjetas y accesos`.
4. Abrir **Nueva asignación**.
5. Si hay error de API, conservar el mensaje y revisar HTTP `GET /api/v1/tarjetas/disponibles` y `/disponibles/diagnostico`; no interpretar el error como inventario vacío.
6. Si la lista está vacía, revisar el diagnóstico: `inactivas`, `conAsignacionVigente` y el desglose de `ESTADO_TARJETA`.
7. Seleccionar beneficiario y comprobar que el selector de solicitudes solo muestre solicitudes de ese beneficiario.
8. Seleccionar estado de asignación y tipo de vigencia desde los catálogos cargados por `/api/v1/tarjetas/opciones`.
9. Verificar fechas: inicio requerida; fin opcional, pero nunca anterior al inicio.
10. Confirmar que **Asignar tarjeta** solo se habilita con el formulario válido y una consulta de disponibilidad exitosa.
11. Para probar `Asignar → Devolver → Reasignar → Historial`, usar únicamente datos institucionales autorizados. Si no existe una tarjeta devuelta y una solicitud válida, documentar el bloqueo; no crear datos ficticios.
12. Consultar `GET /api/v1/tarjetas/asignaciones?historial=true` y comprobar que la asignación anterior permanece con `esAsignacionVigente=0`, mientras solo una nueva queda vigente.
