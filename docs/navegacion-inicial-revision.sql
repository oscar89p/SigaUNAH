/*
  Script de revisión para DBA. NO se ejecuta automáticamente.
  Completa la revisión institucional antes de ejecutar cualquier INSERT.
  Solo usa tablas y columnas existentes en database/SIGADll.sql.
*/
SELECT codigoPerfil, estadoPerfil
FROM Seguridad.tblPerfiles
WHERE codigoPerfil = N'ADMIN_GENERAL';

-- Carga mínima de las pantallas que ya existen en el frontend actual.
-- El perfil y las opciones deben ser aprobados antes de ejecutarse.
-- TipoNavegacion se deja como ITEM; ajustar si la convención institucional indica otro valor.
/*
INSERT INTO Seguridad.tblNavegaciones
  (codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,
   tipoNavegacion,enlaceNavegacion,claseNavegacion,ordenNavegacion,
   idNavegacionPadre,esVisible,estadoNavegacion,usuarioRegistro)
SELECT v.codigo,v.nombre,v.titulo,v.descripcion,v.tipo,v.enlace,v.clase,v.orden,
       NULL,1,1,N'REVISION_DBA'
FROM (VALUES
  (N'INICIO',N'Inicio',N'Inicio',N'Panel principal',N'ITEM',N'/inicio',NULL,1),
  (N'BENEFICIARIOS',N'Beneficiarios',N'Beneficiarios',N'Gestión de beneficiarios',N'ITEM',N'/beneficiarios',NULL,2),
  (N'TARJETAS',N'Tarjetas',N'Tarjetas',N'Gestión de tarjetas',N'ITEM',N'/tarjetas',NULL,3)
) v(codigo,nombre,titulo,descripcion,tipo,enlace,clase,orden)
WHERE NOT EXISTS (
  SELECT 1 FROM Seguridad.tblNavegaciones n WHERE n.codigoNavegacion=v.codigo
);

INSERT INTO Seguridad.tblPerfilesNavegaciones
  (idPerfil,idNavegacion,permiteVisualizar,estadoPerfilNavegacion,usuarioRegistro)
SELECT p.idPerfil,n.idNavegacion,1,1,N'REVISION_DBA'
FROM Seguridad.tblPerfiles p
CROSS JOIN Seguridad.tblNavegaciones n
WHERE p.codigoPerfil=N'ADMIN_GENERAL'
  AND n.codigoNavegacion IN (N'INICIO',N'BENEFICIARIOS',N'TARJETAS')
  AND NOT EXISTS (
    SELECT 1 FROM Seguridad.tblPerfilesNavegaciones pn
    WHERE pn.idPerfil=p.idPerfil AND pn.idNavegacion=n.idNavegacion
  );
*/
