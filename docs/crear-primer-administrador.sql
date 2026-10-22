/*
  SIGA UNAH - creación controlada del primer usuario administrativo

  PREPARACIÓN:
  1. Generar @ClaveHash fuera de SQL Server con Argon2id.
  2. Sustituir únicamente los valores marcados como PARAMETRO.
  3. No colocar aquí una contraseña en texto plano.
  4. Revisar el resultado antes de COMMIT.

  Este archivo no debe ejecutarse sin completar y revisar los parámetros.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @NombreUsuario nvarchar(150) = N'ADMIN';
DECLARE @CorreoElectronico nvarchar(150) = N'admin@temp.com';
DECLARE @NombreAcceso nvarchar(90) = N'admin';
DECLARE @IdentificadorInstitucional nvarchar(50) = NULL; -- Opcional; completar si la institución lo exige.
DECLARE @ClaveHash nvarchar(500) = N'$argon2id$v=19$m=65536,p=4,t=3$lckRRJiapCw6AVTxH1yz4w$/JHJQiS6hv+6YBLF76cPZtQSTmMtoJ0Qgn44V1R7kJ0';
DECLARE @UsuarioRegistro nvarchar(90) = N'yo';
DECLARE @IdUsuario bigint;
DECLARE @IdPerfil int;

IF @NombreUsuario LIKE N'<%>' OR @CorreoElectronico LIKE N'<%>' OR @NombreAcceso LIKE N'<%>'
   OR @UsuarioRegistro LIKE N'<%>'
  THROW 51000, N'Deben completarse los parámetros obligatorios.', 1;

IF @ClaveHash LIKE N'<%>' OR @ClaveHash NOT LIKE N'$argon2id$v=19$m=65536,p=4,t=3$%'
  THROW 51001, N'El hash debe ser un PHC Argon2id compatible con el backend.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  IF EXISTS (
    SELECT 1
    FROM Seguridad.tblUsuarios WITH (UPDLOCK, HOLDLOCK)
    WHERE nombreAcceso = @NombreAcceso OR correoElectronico = @CorreoElectronico
  )
    THROW 51002, N'Ya existe un usuario con ese nombre de acceso o correo.', 1;

  SELECT @IdPerfil = idPerfil
  FROM Seguridad.tblPerfiles WITH (UPDLOCK, HOLDLOCK)
  WHERE codigoPerfil = N'ADMIN_GENERAL' AND estadoPerfil = 1;

  IF @IdPerfil IS NULL
    THROW 51003, N'ADMIN_GENERAL no existe o está inactivo.', 1;

  INSERT INTO Seguridad.tblUsuarios (
    nombreUsuario,
    correoElectronico,
    nombreAcceso,
    claveHash,
    identificadorInstitucional,
    tipoAutenticacion,
    intentosFallidos,
    fechaBloqueo,
    estadoUsuario,
    usuarioRegistro
  )
  VALUES (
    @NombreUsuario,
    @CorreoElectronico,
    @NombreAcceso,
    @ClaveHash,
    NULLIF(@IdentificadorInstitucional, N''),
    N'LOCAL',
    0,
    NULL,
    1,
    @UsuarioRegistro
  );

  SET @IdUsuario = CONVERT(bigint, SCOPE_IDENTITY());

  INSERT INTO Seguridad.tblUsuariosPerfiles (
    idUsuario,
    idPerfil,
    estadoUsuarioPerfil,
    usuarioRegistro
  )
  VALUES (@IdUsuario, @IdPerfil, 1, @UsuarioRegistro);

  COMMIT TRANSACTION;

  SELECT
    u.idUsuario,
    u.nombreUsuario,
    u.correoElectronico,
    u.nombreAcceso,
    u.tipoAutenticacion,
    u.estadoUsuario,
    p.codigoPerfil,
    up.estadoUsuarioPerfil
  FROM Seguridad.tblUsuarios u
  INNER JOIN Seguridad.tblUsuariosPerfiles up ON up.idUsuario = u.idUsuario
  INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil = up.idPerfil
  WHERE u.idUsuario = @IdUsuario;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;
