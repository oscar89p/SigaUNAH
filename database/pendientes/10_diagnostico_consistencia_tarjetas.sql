/* Solo lectura. No modifica registros. Resolver siempre por códigos de catálogo. */
WITH estados AS (
 SELECT t.idTarjeta,t.codigoTarjeta,tv.codigoTipoValor AS estadoAdministrativo,
   CASE WHEN EXISTS (SELECT 1 FROM Tarjetas.tblAsignaciones a WHERE a.idTarjeta=t.idTarjeta AND a.esAsignacionVigente=1) THEN 1 ELSE 0 END AS tieneAsignacionVigente
 FROM Tarjetas.tblTarjetas t
 INNER JOIN Tipos.tblTiposValores tv ON tv.idTipoValor=t.idEstadoTarjeta
 INNER JOIN Tipos.tblTipos tp ON tp.idTipo=tv.idTipo AND tp.codigoTipo='ESTADO_TARJETA'
)
SELECT *, CASE WHEN (estadoAdministrativo='DISPONIBLE' AND tieneAsignacionVigente=1) OR (estadoAdministrativo='ASIGNADA' AND tieneAsignacionVigente=0) OR (estadoAdministrativo='BAJA' AND tieneAsignacionVigente=1) OR (estadoAdministrativo='BLOQUEADA' AND tieneAsignacionVigente=1) THEN 'INCOMPATIBLE' ELSE 'COMPATIBLE' END AS resultado
FROM estados
WHERE (estadoAdministrativo='DISPONIBLE' AND tieneAsignacionVigente=1) OR (estadoAdministrativo='ASIGNADA' AND tieneAsignacionVigente=0) OR (estadoAdministrativo='BAJA' AND tieneAsignacionVigente=1) OR (estadoAdministrativo='BLOQUEADA' AND tieneAsignacionVigente=1)
ORDER BY codigoTarjeta;
