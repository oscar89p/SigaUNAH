-- DROP SCHEMA Academico;

CREATE SCHEMA Academico;
-- DbSigaUNAH.Academico.tblInstituciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblInstituciones;

CREATE TABLE DbSigaUNAH.Academico.tblInstituciones ( idInstitucion int IDENTITY(1, 1) NOT NULL,
codigoInstitucion nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreInstitucion nvarchar(200) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoInstitucion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkInstitucion PRIMARY KEY (idInstitucion),
CONSTRAINT ukInstitucion_Codigo UNIQUE (codigoInstitucion));
-- DbSigaUNAH.Academico.tblCentrosUniversitarios definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblCentrosUniversitarios;

CREATE TABLE DbSigaUNAH.Academico.tblCentrosUniversitarios ( idCentroUniversitario int IDENTITY(1, 1) NOT NULL,
idInstitucion int NOT NULL,
codigoCentroUniversitario nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCentroUniversitario nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoCentroUniversitario bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCentroUniversitario PRIMARY KEY (idCentroUniversitario),
CONSTRAINT ukCentroUniversitario_InstitucionCodigo UNIQUE (idInstitucion, codigoCentroUniversitario),
CONSTRAINT fkCentroUniversitario_Institucion FOREIGN KEY (idInstitucion) REFERENCES DbSigaUNAH.Academico.tblInstituciones(idInstitucion));
-- DbSigaUNAH.Academico.tblFacultades definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblFacultades;

CREATE TABLE DbSigaUNAH.Academico.tblFacultades ( idFacultad int IDENTITY(1, 1) NOT NULL,
idInstitucion int NOT NULL,
codigoFacultad nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreFacultad nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoFacultad bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkFacultad PRIMARY KEY (idFacultad),
CONSTRAINT ukFacultad_InstitucionCodigo UNIQUE (idInstitucion, codigoFacultad),
CONSTRAINT fkFacultad_Institucion FOREIGN KEY (idInstitucion) REFERENCES DbSigaUNAH.Academico.tblInstituciones(idInstitucion));
-- DbSigaUNAH.Academico.tblPeriodosAcademicos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblPeriodosAcademicos;

CREATE TABLE DbSigaUNAH.Academico.tblPeriodosAcademicos ( idPeriodoAcademico int IDENTITY(1, 1) NOT NULL,
idInstitucion int NOT NULL,
codigoPeriodoAcademico nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombrePeriodoAcademico nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaInicioPeriodoAcademico date NOT NULL,
fechaFinPeriodoAcademico date NOT NULL,
periodoActualAcademico bit DEFAULT 0 NOT NULL,
estadoPeriodoAcademico bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
fechaInicio date NOT NULL,
fechaFin date NOT NULL,
CONSTRAINT pkPeriodoAcademico PRIMARY KEY (idPeriodoAcademico),
CONSTRAINT ukPeriodoAcademico_InstitucionCodigo UNIQUE (idInstitucion, codigoPeriodoAcademico),
CONSTRAINT fkPeriodoAcademico_Institucion FOREIGN KEY (idInstitucion) REFERENCES DbSigaUNAH.Academico.tblInstituciones(idInstitucion));

CREATE NONCLUSTERED INDEX ixPeriodoAcademico_InstitucionEstado ON
DbSigaUNAH.Academico.tblPeriodosAcademicos (idInstitucion,
estadoPeriodoAcademico);
-- DbSigaUNAH.Academico.tblCarreras definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblCarreras;

CREATE TABLE DbSigaUNAH.Academico.tblCarreras ( idCarrera int IDENTITY(1, 1) NOT NULL,
idFacultad int NULL,
codigoCarrera nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCarrera nvarchar(200) COLLATE Modern_Spanish_CI_AS NOT NULL,
nivelAcademico nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoCarrera bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCarrera PRIMARY KEY (idCarrera),
CONSTRAINT ukCarrera_Codigo UNIQUE (codigoCarrera),
CONSTRAINT fkCarrera_Facultad FOREIGN KEY (idFacultad) REFERENCES DbSigaUNAH.Academico.tblFacultades(idFacultad));
-- DbSigaUNAH.Academico.tblMatriculas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Academico.tblMatriculas;

CREATE TABLE DbSigaUNAH.Academico.tblMatriculas ( idMatricula bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NOT NULL,
idPeriodoAcademico int NOT NULL,
idCentroUniversitario int NOT NULL,
idCarrera int NOT NULL,
numeroCuentaMatricula nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaMatricula datetime2(0) DEFAULT sysdatetime() NOT NULL,
estadoMatricula bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkMatricula PRIMARY KEY (idMatricula),
CONSTRAINT ukMatricula_UsuarioPeriodoCarrera UNIQUE (idUsuario, idPeriodoAcademico, idCarrera));

CREATE NONCLUSTERED INDEX ixMatricula_UsuarioPeriodo ON
DbSigaUNAH.Academico.tblMatriculas (idUsuario,
idPeriodoAcademico);
-- DbSigaUNAH.Academico.tblMatriculas foreign keys

ALTER TABLE DbSigaUNAH.Academico.tblMatriculas ADD CONSTRAINT fkMatricula_Carrera FOREIGN KEY (idCarrera) REFERENCES DbSigaUNAH.Academico.tblCarreras(idCarrera);

ALTER TABLE DbSigaUNAH.Academico.tblMatriculas ADD CONSTRAINT fkMatricula_CentroUniversitario FOREIGN KEY (idCentroUniversitario) REFERENCES DbSigaUNAH.Academico.tblCentrosUniversitarios(idCentroUniversitario);

ALTER TABLE DbSigaUNAH.Academico.tblMatriculas ADD CONSTRAINT fkMatricula_PeriodoAcademico FOREIGN KEY (idPeriodoAcademico) REFERENCES DbSigaUNAH.Academico.tblPeriodosAcademicos(idPeriodoAcademico);

ALTER TABLE DbSigaUNAH.Academico.tblMatriculas ADD CONSTRAINT fkMatricula_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Accesos;

CREATE SCHEMA Accesos;
-- DbSigaUNAH.Accesos.tblCampus definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblCampus;

CREATE TABLE DbSigaUNAH.Accesos.tblCampus ( idCampus int IDENTITY(1, 1) NOT NULL,
codigoCampus nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCampus nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoCampus bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCampus PRIMARY KEY (idCampus),
CONSTRAINT ukCampus_Codigo UNIQUE (codigoCampus));
-- DbSigaUNAH.Accesos.tblPerfilesAcceso definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblPerfilesAcceso;

CREATE TABLE DbSigaUNAH.Accesos.tblPerfilesAcceso ( idPerfilAcceso int IDENTITY(1, 1) NOT NULL,
codigoPerfilAcceso nvarchar(40) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombrePerfilAcceso nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionPerfilAcceso nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
horaInicio time NULL,
horaFin time NULL,
diasSemana nvarchar(20) COLLATE Modern_Spanish_CI_AS NULL,
estadoPerfilAcceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPerfilAcceso PRIMARY KEY (idPerfilAcceso),
CONSTRAINT ukPerfilAcceso_Codigo UNIQUE (codigoPerfilAcceso));
-- DbSigaUNAH.Accesos.tblEdificios definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblEdificios;

CREATE TABLE DbSigaUNAH.Accesos.tblEdificios ( idEdificio int IDENTITY(1, 1) NOT NULL,
idCampus int NOT NULL,
codigoEdificio nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreEdificio nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
direccionEdificio nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoEdificio bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkEdificio PRIMARY KEY (idEdificio),
CONSTRAINT ukEdificio_CampusCodigo UNIQUE (idCampus, codigoEdificio),
CONSTRAINT fkEdificio_Campus FOREIGN KEY (idCampus) REFERENCES DbSigaUNAH.Accesos.tblCampus(idCampus));
-- DbSigaUNAH.Accesos.tblElevadores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblElevadores;

CREATE TABLE DbSigaUNAH.Accesos.tblElevadores ( idElevador int IDENTITY(1, 1) NOT NULL,
idEdificio int NOT NULL,
codigoElevador nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreElevador nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
cantidadPisos smallint NULL,
codigoSistemaExterno nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
estadoElevador bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkElevador PRIMARY KEY (idElevador),
CONSTRAINT ukElevador_EdificioCodigo UNIQUE (idEdificio, codigoElevador),
CONSTRAINT fkElevador_Edificio FOREIGN KEY (idEdificio) REFERENCES DbSigaUNAH.Accesos.tblEdificios(idEdificio));
-- DbSigaUNAH.Accesos.tblPerfilesAccesoElevadores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblPerfilesAccesoElevadores;

CREATE TABLE DbSigaUNAH.Accesos.tblPerfilesAccesoElevadores ( idPerfilAccesoElevador bigint IDENTITY(1, 1) NOT NULL,
idPerfilAcceso int NOT NULL,
idElevador int NOT NULL,
estadoPerfilAccesoElevador bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPerfilAccesoElevador PRIMARY KEY (idPerfilAccesoElevador),
CONSTRAINT ukPerfilAccesoElevador_PerfilElevador UNIQUE (idPerfilAcceso, idElevador),
CONSTRAINT fkPerfilAccesoElevador_Elevador FOREIGN KEY (idElevador) REFERENCES DbSigaUNAH.Accesos.tblElevadores(idElevador),
CONSTRAINT fkPerfilAccesoElevador_PerfilAcceso FOREIGN KEY (idPerfilAcceso) REFERENCES DbSigaUNAH.Accesos.tblPerfilesAcceso(idPerfilAcceso));
-- DbSigaUNAH.Accesos.tblVersionesPerfilesAcceso definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblVersionesPerfilesAcceso;

CREATE TABLE DbSigaUNAH.Accesos.tblVersionesPerfilesAcceso ( idVersionPerfilAcceso bigint IDENTITY(1, 1) NOT NULL,
idPerfilAcceso int NOT NULL,
numeroVersionPerfilAcceso int NOT NULL,
codigoVersionPerfilAcceso nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionVersionPerfilAcceso nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
horaInicioVersionPerfilAcceso time NULL,
horaFinVersionPerfilAcceso time NULL,
diasSemanaVersionPerfilAcceso nvarchar(20) COLLATE Modern_Spanish_CI_AS NULL,
configuracionVersionPerfilAcceso nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
publicadaVersionPerfilAcceso bit DEFAULT 0 NOT NULL,
fechaPublicacionVersionPerfilAcceso datetime2(0) NULL,
estadoVersionPerfilAcceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkVersionPerfilAcceso PRIMARY KEY (idVersionPerfilAcceso),
CONSTRAINT ukVersionPerfilAcceso_PerfilNumero UNIQUE (idPerfilAcceso, numeroVersionPerfilAcceso),
CONSTRAINT fkVersionPerfilAcceso_PerfilAcceso FOREIGN KEY (idPerfilAcceso) REFERENCES DbSigaUNAH.Accesos.tblPerfilesAcceso(idPerfilAcceso));
-- DbSigaUNAH.Accesos.tblDispositivos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblDispositivos;

CREATE TABLE DbSigaUNAH.Accesos.tblDispositivos ( idDispositivo bigint IDENTITY(1, 1) NOT NULL,
idElevador int NULL,
codigoDispositivo nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreDispositivo nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
tipoDispositivo nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
direccionIp nvarchar(45) COLLATE Modern_Spanish_CI_AS NULL,
macAddress nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
fabricante nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
modelo nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
versionFirmware nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
ultimaComunicacion datetime2 NULL,
estadoDispositivo bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkDispositivo PRIMARY KEY (idDispositivo),
CONSTRAINT ukDispositivo_Codigo UNIQUE (codigoDispositivo),
CONSTRAINT fkDispositivo_Elevador FOREIGN KEY (idElevador) REFERENCES DbSigaUNAH.Accesos.tblElevadores(idElevador));

CREATE NONCLUSTERED INDEX ixDispositivo_ElevadorEstado ON
DbSigaUNAH.Accesos.tblDispositivos (idElevador,
estadoDispositivo);
-- DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso;

CREATE TABLE DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ( idAsignacionPerfilAcceso bigint IDENTITY(1, 1) NOT NULL,
idAsignacion bigint NOT NULL,
idPerfilAcceso int NOT NULL,
fechaInicio date NOT NULL,
fechaFin date NULL,
estadoAsignacionPerfilAcceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkAsignacionPerfilAcceso PRIMARY KEY (idAsignacionPerfilAcceso),
CONSTRAINT ukAsignacionPerfilAcceso_AsignacionPerfil UNIQUE (idAsignacion, idPerfilAcceso));

CREATE NONCLUSTERED INDEX ixAsignacionPerfilAcceso_AsignacionEstado ON
DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso (idAsignacion,
estadoAsignacionPerfilAcceso);
-- DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso foreign keys

ALTER TABLE DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ADD CONSTRAINT fkAsignacionPerfilAcceso_Asignacion FOREIGN KEY (idAsignacion) REFERENCES DbSigaUNAH.Tarjetas.tblAsignaciones(idAsignacion);

ALTER TABLE DbSigaUNAH.Accesos.tblAsignacionesPerfilesAcceso ADD CONSTRAINT fkAsignacionPerfilAcceso_PerfilAcceso FOREIGN KEY (idPerfilAcceso) REFERENCES DbSigaUNAH.Accesos.tblPerfilesAcceso(idPerfilAcceso);
-- DROP SCHEMA Auditoria;

CREATE SCHEMA Auditoria;
-- DbSigaUNAH.Auditoria.tblLogsSistema definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Auditoria.tblLogsSistema;

CREATE TABLE DbSigaUNAH.Auditoria.tblLogsSistema ( idLogSistema bigint IDENTITY(1, 1) NOT NULL,
nivelLog nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
componenteSistema nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
mensajeLog nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NOT NULL,
detalleExcepcion nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
correlacionSolicitud nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkLogSistema PRIMARY KEY (idLogSistema));
-- DbSigaUNAH.Auditoria.tblBitacoras definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Auditoria.tblBitacoras;

CREATE TABLE DbSigaUNAH.Auditoria.tblBitacoras ( idBitacora bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NULL,
modulo nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
entidad nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
identificadorRegistro nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
accion nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
datosAnteriores nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
datosNuevos nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
direccionIp nvarchar(45) COLLATE Modern_Spanish_CI_AS NULL,
agenteUsuario nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
correlacionSolicitud nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkBitacora PRIMARY KEY (idBitacora));

CREATE NONCLUSTERED INDEX ixBitacora_UsuarioFecha ON
DbSigaUNAH.Auditoria.tblBitacoras (idUsuario,
fechaRegistro);
-- DbSigaUNAH.Auditoria.tblIntentosAutenticacion definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Auditoria.tblIntentosAutenticacion;

CREATE TABLE DbSigaUNAH.Auditoria.tblIntentosAutenticacion ( idIntentoAutenticacion bigint IDENTITY(1, 1) NOT NULL,
nombreAcceso nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
idUsuario bigint NULL,
fechaIntento datetime2 DEFAULT sysdatetime() NOT NULL,
direccionIp nvarchar(45) COLLATE Modern_Spanish_CI_AS NULL,
agenteUsuario nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
fueExitoso bit NOT NULL,
motivoFallo nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIntentoAutenticacion PRIMARY KEY (idIntentoAutenticacion));
-- DbSigaUNAH.Auditoria.tblBitacoras foreign keys

ALTER TABLE DbSigaUNAH.Auditoria.tblBitacoras ADD CONSTRAINT fkBitacora_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Auditoria.tblIntentosAutenticacion foreign keys

ALTER TABLE DbSigaUNAH.Auditoria.tblIntentosAutenticacion ADD CONSTRAINT fkIntentoAutenticacion_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Beneficiarios;

CREATE SCHEMA Beneficiarios;
-- DbSigaUNAH.Beneficiarios.tblPersonas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Beneficiarios.tblPersonas;

CREATE TABLE DbSigaUNAH.Beneficiarios.tblPersonas ( idPersona bigint IDENTITY(1, 1) NOT NULL,
primerNombre nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
segundoNombre nvarchar(80) COLLATE Modern_Spanish_CI_AS NULL,
primerApellido nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
segundoApellido nvarchar(80) COLLATE Modern_Spanish_CI_AS NULL,
numeroIdentificacion nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
telefonoPrincipal nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
correoPersonal nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
fechaNacimiento date NULL,
estadoPersona bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPersona PRIMARY KEY (idPersona));

CREATE UNIQUE NONCLUSTERED INDEX ukPersona_NumeroIdentificacion ON
DbSigaUNAH.Beneficiarios.tblPersonas (numeroIdentificacion);
-- DbSigaUNAH.Beneficiarios.tblBeneficiarios definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Beneficiarios.tblBeneficiarios;

CREATE TABLE DbSigaUNAH.Beneficiarios.tblBeneficiarios ( idBeneficiario bigint IDENTITY(1, 1) NOT NULL,
idPersona bigint NOT NULL,
idTipoBeneficiario int NOT NULL,
idCarrera int NULL,
numeroCuenta nvarchar(20) COLLATE Modern_Spanish_CI_AS NULL,
correoInstitucional nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
codigoCarne nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
estadoAcademico nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
estadoBeneficiario bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkBeneficiario PRIMARY KEY (idBeneficiario));

CREATE NONCLUSTERED INDEX ixBeneficiario_Carrera ON
DbSigaUNAH.Beneficiarios.tblBeneficiarios (idCarrera,
estadoBeneficiario);

CREATE UNIQUE NONCLUSTERED INDEX ukBeneficiario_NumeroCuenta ON
DbSigaUNAH.Beneficiarios.tblBeneficiarios (numeroCuenta);
-- DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones;

CREATE TABLE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones ( idBeneficiarioCondicion bigint IDENTITY(1, 1) NOT NULL,
idBeneficiario bigint NOT NULL,
idTipoCondicion int NOT NULL,
descripcionCondicion nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
esTemporal bit DEFAULT 0 NOT NULL,
fechaInicio date NULL,
fechaFinEstimada date NULL,
requiereRevision bit DEFAULT 0 NOT NULL,
estadoBeneficiarioCondicion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkBeneficiarioCondicion PRIMARY KEY (idBeneficiarioCondicion));
-- DbSigaUNAH.Beneficiarios.tblExpedientes definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Beneficiarios.tblExpedientes;

CREATE TABLE DbSigaUNAH.Beneficiarios.tblExpedientes ( idExpediente bigint IDENTITY(1, 1) NOT NULL,
idBeneficiario bigint NOT NULL,
codigoExpediente nvarchar(40) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoExpediente bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkExpediente PRIMARY KEY (idExpediente),
CONSTRAINT ukExpediente_Beneficiario UNIQUE (idBeneficiario),
CONSTRAINT ukExpediente_Codigo UNIQUE (codigoExpediente));
-- DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos;

CREATE TABLE DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos ( idExpedienteDocumento bigint IDENTITY(1, 1) NOT NULL,
idExpediente bigint NOT NULL,
idDocumento bigint NOT NULL,
fechaDocumento date NULL,
fechaVencimiento date NULL,
estadoExpedienteDocumento bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkExpedienteDocumento PRIMARY KEY (idExpedienteDocumento),
CONSTRAINT ukExpedienteDocumento_ExpedienteDocumento UNIQUE (idExpediente, idDocumento));
-- DbSigaUNAH.Beneficiarios.tblBeneficiarios foreign keys

ALTER TABLE DbSigaUNAH.Beneficiarios.tblBeneficiarios ADD CONSTRAINT fkBeneficiario_Carrera FOREIGN KEY (idCarrera) REFERENCES DbSigaUNAH.Academico.tblCarreras(idCarrera);

ALTER TABLE DbSigaUNAH.Beneficiarios.tblBeneficiarios ADD CONSTRAINT fkBeneficiario_Persona FOREIGN KEY (idPersona) REFERENCES DbSigaUNAH.Beneficiarios.tblPersonas(idPersona);

ALTER TABLE DbSigaUNAH.Beneficiarios.tblBeneficiarios ADD CONSTRAINT fkBeneficiario_TipoBeneficiario FOREIGN KEY (idTipoBeneficiario) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);
-- DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones foreign keys

ALTER TABLE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones ADD CONSTRAINT fkBeneficiarioCondicion_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);

ALTER TABLE DbSigaUNAH.Beneficiarios.tblBeneficiariosCondiciones ADD CONSTRAINT fkBeneficiarioCondicion_TipoCondicion FOREIGN KEY (idTipoCondicion) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);
-- DbSigaUNAH.Beneficiarios.tblExpedientes foreign keys

ALTER TABLE DbSigaUNAH.Beneficiarios.tblExpedientes ADD CONSTRAINT fkExpediente_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);
-- DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos foreign keys

ALTER TABLE DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos ADD CONSTRAINT fkExpedienteDocumento_Documento FOREIGN KEY (idDocumento) REFERENCES DbSigaUNAH.Documentos.tblDocumentos(idDocumento);

ALTER TABLE DbSigaUNAH.Beneficiarios.tblExpedientesDocumentos ADD CONSTRAINT fkExpedienteDocumento_Expediente FOREIGN KEY (idExpediente) REFERENCES DbSigaUNAH.Beneficiarios.tblExpedientes(idExpediente);
-- DROP SCHEMA Comunicacion;

CREATE SCHEMA Comunicacion;
-- DbSigaUNAH.Comunicacion.tblConversaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Comunicacion.tblConversaciones;

CREATE TABLE DbSigaUNAH.Comunicacion.tblConversaciones ( idConversacion bigint IDENTITY(1, 1) NOT NULL,
codigoConversacion nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
asuntoConversacion nvarchar(250) COLLATE Modern_Spanish_CI_AS NULL,
tipoConversacion nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaInicioConversacion datetime2(0) DEFAULT sysdatetime() NOT NULL,
fechaCierreConversacion datetime2(0) NULL,
estadoConversacion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkConversacion PRIMARY KEY (idConversacion),
CONSTRAINT ukConversacion_CodigoConversacion UNIQUE (codigoConversacion));
-- DbSigaUNAH.Comunicacion.tblAlertas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Comunicacion.tblAlertas;

CREATE TABLE DbSigaUNAH.Comunicacion.tblAlertas ( idAlerta bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NULL,
codigoAlerta nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
tituloAlerta nvarchar(200) COLLATE Modern_Spanish_CI_AS NOT NULL,
contenidoAlerta nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NOT NULL,
nivelAlerta nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaGeneracionAlerta datetime2(3) DEFAULT sysdatetime() NOT NULL,
fechaExpiracionAlerta datetime2(3) NULL,
atendidaAlerta bit DEFAULT 0 NOT NULL,
fechaAtencionAlerta datetime2(3) NULL,
estadoAlerta bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkAlerta PRIMARY KEY (idAlerta));

CREATE NONCLUSTERED INDEX ixAlerta_UsuarioEstado ON
DbSigaUNAH.Comunicacion.tblAlertas (idUsuario,
estadoAlerta);
-- DbSigaUNAH.Comunicacion.tblMensajes definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Comunicacion.tblMensajes;

CREATE TABLE DbSigaUNAH.Comunicacion.tblMensajes ( idMensaje bigint IDENTITY(1, 1) NOT NULL,
idConversacion bigint NOT NULL,
idUsuarioRemitente bigint NULL,
contenidoMensaje nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NOT NULL,
tipoContenidoMensaje nvarchar(30) COLLATE Modern_Spanish_CI_AS DEFAULT N'TEXTO' NOT NULL,
fechaEnvioMensaje datetime2(3) DEFAULT sysdatetime() NOT NULL,
leidoMensaje bit DEFAULT 0 NOT NULL,
fechaLecturaMensaje datetime2(3) NULL,
estadoMensaje bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkMensaje PRIMARY KEY (idMensaje));

CREATE NONCLUSTERED INDEX ixMensaje_ConversacionFecha ON
DbSigaUNAH.Comunicacion.tblMensajes (idConversacion,
fechaEnvioMensaje);
-- DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas;

CREATE TABLE DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas ( idNotificacionEnviada bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NULL,
idAlerta bigint NULL,
canalNotificacionEnviada nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
destinatarioNotificacionEnviada nvarchar(254) COLLATE Modern_Spanish_CI_AS NOT NULL,
asuntoNotificacionEnviada nvarchar(250) COLLATE Modern_Spanish_CI_AS NULL,
contenidoNotificacionEnviada nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoEnvioNotificacionEnviada nvarchar(30) COLLATE Modern_Spanish_CI_AS DEFAULT N'PENDIENTE' NOT NULL,
identificadorProveedorNotificacionEnviada nvarchar(200) COLLATE Modern_Spanish_CI_AS NULL,
numeroIntentosNotificacionEnviada smallint DEFAULT 0 NOT NULL,
fechaProgramadaNotificacionEnviada datetime2(3) NULL,
fechaEnvioNotificacionEnviada datetime2(3) NULL,
respuestaProveedorNotificacionEnviada nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
estadoNotificacionEnviada bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkNotificacionEnviada PRIMARY KEY (idNotificacionEnviada));

CREATE NONCLUSTERED INDEX ixNotificacionEnviada_EstadoFecha ON
DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas (estadoEnvioNotificacionEnviada,
fechaProgramadaNotificacionEnviada);
-- DbSigaUNAH.Comunicacion.tblAlertas foreign keys

ALTER TABLE DbSigaUNAH.Comunicacion.tblAlertas ADD CONSTRAINT fkAlerta_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Comunicacion.tblMensajes foreign keys

ALTER TABLE DbSigaUNAH.Comunicacion.tblMensajes ADD CONSTRAINT fkMensaje_Conversacion FOREIGN KEY (idConversacion) REFERENCES DbSigaUNAH.Comunicacion.tblConversaciones(idConversacion);

ALTER TABLE DbSigaUNAH.Comunicacion.tblMensajes ADD CONSTRAINT fkMensaje_UsuarioRemitente FOREIGN KEY (idUsuarioRemitente) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas foreign keys

ALTER TABLE DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas ADD CONSTRAINT fkNotificacionEnviada_Alerta FOREIGN KEY (idAlerta) REFERENCES DbSigaUNAH.Comunicacion.tblAlertas(idAlerta);

ALTER TABLE DbSigaUNAH.Comunicacion.tblNotificacionesEnviadas ADD CONSTRAINT fkNotificacionEnviada_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Configuracion;

CREATE SCHEMA Configuracion;
-- DbSigaUNAH.Configuracion.tblIdiomas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblIdiomas;

CREATE TABLE DbSigaUNAH.Configuracion.tblIdiomas ( idIdioma smallint IDENTITY(1, 1) NOT NULL,
codigoIdioma nvarchar(10) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreIdioma nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreNativoIdioma nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
esPredeterminadoIdioma bit DEFAULT 0 NOT NULL,
estadoIdioma bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIdioma PRIMARY KEY (idIdioma),
CONSTRAINT ukIdioma_CodigoIdioma UNIQUE (codigoIdioma));
-- DbSigaUNAH.Configuracion.tblListas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblListas;

CREATE TABLE DbSigaUNAH.Configuracion.tblListas ( idLista int IDENTITY(1, 1) NOT NULL,
codigoLista nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreLista nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionLista nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
permiteJerarquiaLista bit DEFAULT 0 NOT NULL,
estadoLista bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkLista PRIMARY KEY (idLista),
CONSTRAINT ukLista_CodigoLista UNIQUE (codigoLista));
-- DbSigaUNAH.Configuracion.tblMacroProcesos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblMacroProcesos;

CREATE TABLE DbSigaUNAH.Configuracion.tblMacroProcesos ( idMacroProceso int IDENTITY(1, 1) NOT NULL,
codigoMacroProceso nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreMacroProceso nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionMacroProceso nvarchar(512) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoMacroProceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkMacroProceso PRIMARY KEY (idMacroProceso),
CONSTRAINT ukMacroProceso_CodigoMacroProceso UNIQUE (codigoMacroProceso));
-- DbSigaUNAH.Configuracion.tblParametros definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblParametros;

CREATE TABLE DbSigaUNAH.Configuracion.tblParametros ( idParametro int IDENTITY(1, 1) NOT NULL,
codigoParametro nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreParametro nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionParametro nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
tipoDato nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
valorPredeterminado nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
permiteModificacion bit DEFAULT 1 NOT NULL,
estadoParametro bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkParametro PRIMARY KEY (idParametro),
CONSTRAINT ukParametro_Codigo UNIQUE (codigoParametro));
-- DbSigaUNAH.Configuracion.tblVersionesSistema definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblVersionesSistema;

CREATE TABLE DbSigaUNAH.Configuracion.tblVersionesSistema ( idVersionSistema int IDENTITY(1, 1) NOT NULL,
codigoVersionSistema nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreVersionSistema nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
descripcionVersionSistema nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
numeroScriptVersionSistema int NOT NULL,
nombreScriptVersionSistema nvarchar(256) COLLATE Modern_Spanish_CI_AS NOT NULL,
hashScriptVersionSistema nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
fechaAplicacionVersionSistema datetime2(0) DEFAULT sysdatetime() NOT NULL,
ambienteVersionSistema nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
resultadoVersionSistema nvarchar(30) COLLATE Modern_Spanish_CI_AS DEFAULT N'APLICADO' NOT NULL,
observacionVersionSistema nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
estadoVersionSistema bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkVersionSistema PRIMARY KEY (idVersionSistema),
CONSTRAINT ukVersionSistema_CodigoScript UNIQUE (codigoVersionSistema, numeroScriptVersionSistema));
-- DbSigaUNAH.Configuracion.tblListasValores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblListasValores;

CREATE TABLE DbSigaUNAH.Configuracion.tblListasValores ( idListaValor int IDENTITY(1, 1) NOT NULL,
idLista int NOT NULL,
idListaValorPadre int NULL,
codigoListaValor nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreListaValor nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionListaValor nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
ordenListaValor smallint DEFAULT 0 NOT NULL,
valorAdicionalListaValor nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
estadoListaValor bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkListaValor PRIMARY KEY (idListaValor),
CONSTRAINT ukListaValor_ListaCodigo UNIQUE (idLista, codigoListaValor),
CONSTRAINT fkListaValor_Lista FOREIGN KEY (idLista) REFERENCES DbSigaUNAH.Configuracion.tblListas(idLista),
CONSTRAINT fkListaValor_ListaValorPadre FOREIGN KEY (idListaValorPadre) REFERENCES DbSigaUNAH.Configuracion.tblListasValores(idListaValor));

CREATE NONCLUSTERED INDEX ixListaValor_ListaEstado ON
DbSigaUNAH.Configuracion.tblListasValores (idLista,
estadoListaValor);
-- DbSigaUNAH.Configuracion.tblParametrosValores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblParametrosValores;

CREATE TABLE DbSigaUNAH.Configuracion.tblParametrosValores ( idParametroValor bigint IDENTITY(1, 1) NOT NULL,
idParametro int NOT NULL,
valorParametro nvarchar(1000) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaInicioVigencia datetime2 NULL,
fechaFinVigencia datetime2 NULL,
estadoParametroValor bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
codigoParametroValor nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreParametroValor nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionParametroValor nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
tipoParametroValor nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
CONSTRAINT pkParametroValor PRIMARY KEY (idParametroValor),
CONSTRAINT ukParametroValor_ParametroCodigo UNIQUE (idParametro, codigoParametroValor),
CONSTRAINT fkParametroValor_Parametro FOREIGN KEY (idParametro) REFERENCES DbSigaUNAH.Configuracion.tblParametros(idParametro));
-- DbSigaUNAH.Configuracion.tblProcesos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblProcesos;

CREATE TABLE DbSigaUNAH.Configuracion.tblProcesos ( idProceso int IDENTITY(1, 1) NOT NULL,
idMacroProceso int NOT NULL,
codigoProceso nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreProceso nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionProceso nvarchar(512) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCortoProceso nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
nombreLargoProceso nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
tipoProceso nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoProceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkProceso PRIMARY KEY (idProceso),
CONSTRAINT ukProceso_CodigoProceso UNIQUE (codigoProceso),
CONSTRAINT fkProceso_MacroProceso FOREIGN KEY (idMacroProceso) REFERENCES DbSigaUNAH.Configuracion.tblMacroProcesos(idMacroProceso));

CREATE NONCLUSTERED INDEX ixProceso_MacroProceso ON
DbSigaUNAH.Configuracion.tblProcesos (idMacroProceso);

CREATE NONCLUSTERED INDEX ixProceso_MacroProcesoEstado ON
DbSigaUNAH.Configuracion.tblProcesos (idMacroProceso,
estadoProceso);
-- DbSigaUNAH.Configuracion.tblErrores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblErrores;

CREATE TABLE DbSigaUNAH.Configuracion.tblErrores ( idError int IDENTITY(1, 1) NOT NULL,
idTipoValor int NOT NULL,
codigoError nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
codigoInternoError nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
codigoExternoError nvarchar(64) COLLATE Modern_Spanish_CI_AS NULL,
nombreError nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
mensajeInternoError nvarchar(512) COLLATE Modern_Spanish_CI_AS NOT NULL,
mensajeExternoError nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
estadoError bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkError PRIMARY KEY (idError),
CONSTRAINT ukError_CodigoError UNIQUE (codigoError),
CONSTRAINT ukError_CodigoInternoError UNIQUE (codigoInternoError));

CREATE NONCLUSTERED INDEX ixError_TipoEstado ON
DbSigaUNAH.Configuracion.tblErrores (idTipoValor,
estadoError);
-- DbSigaUNAH.Configuracion.tblErroresIdiomas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Configuracion.tblErroresIdiomas;

CREATE TABLE DbSigaUNAH.Configuracion.tblErroresIdiomas ( idErrorIdioma bigint IDENTITY(1, 1) NOT NULL,
idError int NOT NULL,
idIdioma smallint NOT NULL,
mensajeInternoErrorIdioma nvarchar(512) COLLATE Modern_Spanish_CI_AS NOT NULL,
mensajeExternoErrorIdioma nvarchar(512) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoErrorIdioma bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkErrorIdioma PRIMARY KEY (idErrorIdioma),
CONSTRAINT ukErrorIdioma_ErrorIdioma UNIQUE (idError, idIdioma));

CREATE NONCLUSTERED INDEX ixErrorIdioma_IdiomaEstado ON
DbSigaUNAH.Configuracion.tblErroresIdiomas (idIdioma,
estadoErrorIdioma);
-- DbSigaUNAH.Configuracion.tblErrores foreign keys

ALTER TABLE DbSigaUNAH.Configuracion.tblErrores ADD CONSTRAINT fkError_TipoValor FOREIGN KEY (idTipoValor) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);
-- DbSigaUNAH.Configuracion.tblErroresIdiomas foreign keys

ALTER TABLE DbSigaUNAH.Configuracion.tblErroresIdiomas ADD CONSTRAINT fkErrorIdioma_Error FOREIGN KEY (idError) REFERENCES DbSigaUNAH.Configuracion.tblErrores(idError);

ALTER TABLE DbSigaUNAH.Configuracion.tblErroresIdiomas ADD CONSTRAINT fkErrorIdioma_Idioma FOREIGN KEY (idIdioma) REFERENCES DbSigaUNAH.Configuracion.tblIdiomas(idIdioma);
-- DROP SCHEMA dbo;

CREATE SCHEMA dbo;
-- DROP SCHEMA Documentos;

CREATE SCHEMA Documentos;
-- DbSigaUNAH.Documentos.tblTiposDocumentos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Documentos.tblTiposDocumentos;

CREATE TABLE DbSigaUNAH.Documentos.tblTiposDocumentos ( idTipoDocumento int IDENTITY(1, 1) NOT NULL,
codigoTipoDocumento nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipoDocumento nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipoDocumento nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
extensionesPermitidasTipoDocumento nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
tamanoMaximoBytesTipoDocumento bigint NULL,
requiereVersionadoTipoDocumento bit DEFAULT 1 NOT NULL,
estadoTipoDocumento bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipoDocumento PRIMARY KEY (idTipoDocumento),
CONSTRAINT ukTipoDocumento_Codigo UNIQUE (codigoTipoDocumento));
-- DbSigaUNAH.Documentos.tblAdjuntos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Documentos.tblAdjuntos;

CREATE TABLE DbSigaUNAH.Documentos.tblAdjuntos ( idAdjunto bigint IDENTITY(1, 1) NOT NULL,
idDocumento bigint NOT NULL,
esquemaReferenciaAdjunto nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
tablaReferenciaAdjunto nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
llaveReferenciaAdjunto nvarchar(256) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionAdjunto nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
estadoAdjunto bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkAdjunto PRIMARY KEY (idAdjunto),
CONSTRAINT ukAdjunto_DocumentoReferencia UNIQUE (idDocumento, esquemaReferenciaAdjunto, tablaReferenciaAdjunto, llaveReferenciaAdjunto));
-- DbSigaUNAH.Documentos.tblDocumentos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Documentos.tblDocumentos;

CREATE TABLE DbSigaUNAH.Documentos.tblDocumentos ( idDocumento bigint IDENTITY(1, 1) NOT NULL,
idTipoDocumento int NOT NULL,
idUsuarioPropietario bigint NULL,
idUnidadOrganizativa int NULL,
codigoDocumento nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreDocumento nvarchar(256) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionDocumento nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
referenciaEntidadDocumento nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
referenciaIdDocumento nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
confidencialDocumento bit DEFAULT 0 NOT NULL,
estadoDocumento bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkDocumento PRIMARY KEY (idDocumento),
CONSTRAINT ukDocumento_Codigo UNIQUE (codigoDocumento));

CREATE NONCLUSTERED INDEX ixDocumento_ReferenciaEntidad ON
DbSigaUNAH.Documentos.tblDocumentos (referenciaEntidadDocumento,
referenciaIdDocumento);
-- DbSigaUNAH.Documentos.tblDocumentosVersiones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Documentos.tblDocumentosVersiones;

CREATE TABLE DbSigaUNAH.Documentos.tblDocumentosVersiones ( idDocumentoVersion bigint IDENTITY(1, 1) NOT NULL,
idDocumento bigint NOT NULL,
numeroVersionDocumento int NOT NULL,
nombreArchivoDocumento nvarchar(256) COLLATE Modern_Spanish_CI_AS NOT NULL,
extensionArchivoDocumento nvarchar(20) COLLATE Modern_Spanish_CI_AS NULL,
tipoContenidoDocumento nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
tamanoBytesDocumento bigint NULL,
rutaAlmacenamientoDocumento nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
contenidoBinarioDocumento varbinary(MAX) NULL,
hashDocumento nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
comentarioVersionDocumento nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
versionActualDocumento bit DEFAULT 0 NOT NULL,
estadoDocumentoVersion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkDocumentoVersion PRIMARY KEY (idDocumentoVersion),
CONSTRAINT ukDocumentoVersion_DocumentoNumero UNIQUE (idDocumento, numeroVersionDocumento));

CREATE NONCLUSTERED INDEX ixDocumentoVersion_DocumentoActual ON
DbSigaUNAH.Documentos.tblDocumentosVersiones (idDocumento,
versionActualDocumento,
numeroVersionDocumento);
-- DbSigaUNAH.Documentos.tblAdjuntos foreign keys

ALTER TABLE DbSigaUNAH.Documentos.tblAdjuntos ADD CONSTRAINT fkAdjunto_Documento FOREIGN KEY (idDocumento) REFERENCES DbSigaUNAH.Documentos.tblDocumentos(idDocumento);
-- DbSigaUNAH.Documentos.tblDocumentos foreign keys

ALTER TABLE DbSigaUNAH.Documentos.tblDocumentos ADD CONSTRAINT fkDocumento_TipoDocumento FOREIGN KEY (idTipoDocumento) REFERENCES DbSigaUNAH.Documentos.tblTiposDocumentos(idTipoDocumento);

ALTER TABLE DbSigaUNAH.Documentos.tblDocumentos ADD CONSTRAINT fkDocumento_UnidadOrganizativa FOREIGN KEY (idUnidadOrganizativa) REFERENCES DbSigaUNAH.Organizacion.tblUnidadesOrganizativas(idUnidadOrganizativa);

ALTER TABLE DbSigaUNAH.Documentos.tblDocumentos ADD CONSTRAINT fkDocumento_UsuarioPropietario FOREIGN KEY (idUsuarioPropietario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Documentos.tblDocumentosVersiones foreign keys

ALTER TABLE DbSigaUNAH.Documentos.tblDocumentosVersiones ADD CONSTRAINT fkDocumentoVersion_Documento FOREIGN KEY (idDocumento) REFERENCES DbSigaUNAH.Documentos.tblDocumentos(idDocumento);
-- DROP SCHEMA Indicadores;

CREATE SCHEMA Indicadores;
-- DbSigaUNAH.Indicadores.tblIndicadores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Indicadores.tblIndicadores;

CREATE TABLE DbSigaUNAH.Indicadores.tblIndicadores ( idIndicador int IDENTITY(1, 1) NOT NULL,
codigoIndicador nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreIndicador nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionIndicador nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
unidadMedidaIndicador nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
tipoDatoIndicador nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
frecuenciaIndicador nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
valorObjetivoIndicador decimal(18, 4) NULL,
estadoIndicador bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIndicador PRIMARY KEY (idIndicador),
CONSTRAINT ukIndicador_Codigo UNIQUE (codigoIndicador));
-- DbSigaUNAH.Indicadores.tblIndicadoresFormulas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Indicadores.tblIndicadoresFormulas;

CREATE TABLE DbSigaUNAH.Indicadores.tblIndicadoresFormulas ( idIndicadorFormula bigint IDENTITY(1, 1) NOT NULL,
idIndicador int NOT NULL,
codigoIndicadorFormula nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
expresionIndicadorFormula nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NOT NULL,
versionIndicadorFormula int DEFAULT 1 NOT NULL,
fechaInicioVigenciaIndicadorFormula datetime2(0) DEFAULT sysdatetime() NOT NULL,
fechaFinVigenciaIndicadorFormula datetime2(0) NULL,
estadoIndicadorFormula bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIndicadorFormula PRIMARY KEY (idIndicadorFormula),
CONSTRAINT ukIndicadorFormula_IndicadorVersion UNIQUE (idIndicador, versionIndicadorFormula),
CONSTRAINT fkIndicadorFormula_Indicador FOREIGN KEY (idIndicador) REFERENCES DbSigaUNAH.Indicadores.tblIndicadores(idIndicador));
-- DbSigaUNAH.Indicadores.tblIndicadoresValores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores;

CREATE TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores ( idIndicadorValor bigint IDENTITY(1, 1) NOT NULL,
idIndicador int NOT NULL,
fechaIndicadorValor datetime2(0) DEFAULT sysdatetime() NOT NULL,
idCampus int NULL,
idEdificio int NULL,
idElevador int NULL,
valorIndicador decimal(18, 4) NOT NULL,
observacionIndicadorValor nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoIndicadorValor bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIndicadorValor PRIMARY KEY (idIndicadorValor));

CREATE NONCLUSTERED INDEX ixIndicadorValor_FechaUbicacion ON
DbSigaUNAH.Indicadores.tblIndicadoresValores (fechaIndicadorValor,
idCampus,
idEdificio,
idElevador);
-- DbSigaUNAH.Indicadores.tblIndicadoresValores foreign keys

ALTER TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores ADD CONSTRAINT fkIndicadorValor_Campus FOREIGN KEY (idCampus) REFERENCES DbSigaUNAH.Accesos.tblCampus(idCampus);

ALTER TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores ADD CONSTRAINT fkIndicadorValor_Edificio FOREIGN KEY (idEdificio) REFERENCES DbSigaUNAH.Accesos.tblEdificios(idEdificio);

ALTER TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores ADD CONSTRAINT fkIndicadorValor_Elevador FOREIGN KEY (idElevador) REFERENCES DbSigaUNAH.Accesos.tblElevadores(idElevador);

ALTER TABLE DbSigaUNAH.Indicadores.tblIndicadoresValores ADD CONSTRAINT fkIndicadorValor_Indicador FOREIGN KEY (idIndicador) REFERENCES DbSigaUNAH.Indicadores.tblIndicadores(idIndicador);
-- DROP SCHEMA Integracion;

CREATE SCHEMA Integracion;
-- DbSigaUNAH.Integracion.tblSistemas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Integracion.tblSistemas;

CREATE TABLE DbSigaUNAH.Integracion.tblSistemas ( idSistema int IDENTITY(1, 1) NOT NULL,
codigoSistema nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreSistema nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionSistema nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
propietarioSistema nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
urlBaseSistema nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
esSistemaInterno bit DEFAULT 0 NOT NULL,
estadoSistema bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSistema PRIMARY KEY (idSistema),
CONSTRAINT ukSistema_Codigo UNIQUE (codigoSistema));
-- DbSigaUNAH.Integracion.tblIntegraciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Integracion.tblIntegraciones;

CREATE TABLE DbSigaUNAH.Integracion.tblIntegraciones ( idIntegracion int IDENTITY(1, 1) NOT NULL,
idSistemaOrigen int NULL,
idSistemaDestino int NOT NULL,
codigoIntegracion nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreIntegracion nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionIntegracion nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
tipoIntegracion nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
autenticacionIntegracion nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
tiempoEsperaSegundosIntegracion int NULL,
numeroReintentosIntegracion smallint NULL,
activoMonitoreoIntegracion bit DEFAULT 1 NOT NULL,
estadoIntegracion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIntegracion PRIMARY KEY (idIntegracion),
CONSTRAINT ukIntegracion_Codigo UNIQUE (codigoIntegracion),
CONSTRAINT fkIntegracion_SistemaDestino FOREIGN KEY (idSistemaDestino) REFERENCES DbSigaUNAH.Integracion.tblSistemas(idSistema),
CONSTRAINT fkIntegracion_SistemaOrigen FOREIGN KEY (idSistemaOrigen) REFERENCES DbSigaUNAH.Integracion.tblSistemas(idSistema));

CREATE NONCLUSTERED INDEX ixIntegracion_SistemaDestinoEstado ON
DbSigaUNAH.Integracion.tblIntegraciones (idSistemaDestino,
estadoIntegracion);
-- DbSigaUNAH.Integracion.tblCredenciales definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Integracion.tblCredenciales;

CREATE TABLE DbSigaUNAH.Integracion.tblCredenciales ( idCredencial int IDENTITY(1, 1) NOT NULL,
idIntegracion int NOT NULL,
codigoCredencial nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
tipoCredencial nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreSecretoCredencial nvarchar(256) COLLATE Modern_Spanish_CI_AS NULL,
referenciaSecretoCredencial nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
fechaExpiracionCredencial datetime2(0) NULL,
estadoCredencial bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCredencial PRIMARY KEY (idCredencial),
CONSTRAINT ukCredencial_IntegracionCodigo UNIQUE (idIntegracion, codigoCredencial),
CONSTRAINT fkCredencial_Integracion FOREIGN KEY (idIntegracion) REFERENCES DbSigaUNAH.Integracion.tblIntegraciones(idIntegracion));

CREATE NONCLUSTERED INDEX ixCredencial_FechaExpiracion ON
DbSigaUNAH.Integracion.tblCredenciales (fechaExpiracionCredencial,
estadoCredencial);
-- DbSigaUNAH.Integracion.tblEndpoints definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Integracion.tblEndpoints;

CREATE TABLE DbSigaUNAH.Integracion.tblEndpoints ( idEndpoint int IDENTITY(1, 1) NOT NULL,
idIntegracion int NOT NULL,
codigoEndpoint nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreEndpoint nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
metodoHttpEndpoint nvarchar(10) COLLATE Modern_Spanish_CI_AS NULL,
rutaEndpoint nvarchar(1000) COLLATE Modern_Spanish_CI_AS NOT NULL,
tipoContenidoEndpoint nvarchar(150) COLLATE Modern_Spanish_CI_AS NULL,
versionEndpoint nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
tiempoEsperaSegundosEndpoint int NULL,
estadoEndpoint bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkEndpoint PRIMARY KEY (idEndpoint),
CONSTRAINT ukEndpoint_IntegracionCodigo UNIQUE (idIntegracion, codigoEndpoint),
CONSTRAINT fkEndpoint_Integracion FOREIGN KEY (idIntegracion) REFERENCES DbSigaUNAH.Integracion.tblIntegraciones(idIntegracion));

CREATE NONCLUSTERED INDEX ixEndpoint_IntegracionEstado ON
DbSigaUNAH.Integracion.tblEndpoints (idIntegracion,
estadoEndpoint);
-- DROP SCHEMA Migracion;

CREATE SCHEMA Migracion;
-- DbSigaUNAH.Migracion.tblCargasMigracion definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Migracion.tblCargasMigracion;

CREATE TABLE DbSigaUNAH.Migracion.tblCargasMigracion ( idCargaMigracion bigint IDENTITY(1, 1) NOT NULL,
nombreArchivo nvarchar(255) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionCarga nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
totalRegistros int NULL,
estadoCarga nvarchar(20) COLLATE Modern_Spanish_CI_AS DEFAULT N'PENDIENTE' NOT NULL,
fechaInicioCarga datetime2(0) NULL,
fechaFinCarga datetime2(0) NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCargaMigracion PRIMARY KEY (idCargaMigracion));
-- DbSigaUNAH.Migracion.tblRespaldoTarjetas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Migracion.tblRespaldoTarjetas;

CREATE TABLE DbSigaUNAH.Migracion.tblRespaldoTarjetas ( idRespaldoTarjeta bigint IDENTITY(1, 1) NOT NULL,
numeroFilaExcel int NOT NULL,
numeroRegistroTexto nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
nombreCompletoTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
numeroCuentaTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
telefonoTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
carreraTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
correoTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
condicionTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
codigoTarjetaTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
fechaEntregaTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
retornoTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
numeroCompromisoTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
observacionTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
tiempoLimiteTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
tipoAlertaTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
verificacionTexto nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
estadoMigracion nvarchar(20) COLLATE Modern_Spanish_CI_AS DEFAULT N'PENDIENTE' NOT NULL,
mensajeMigracion nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
idCargaMigracion bigint NOT NULL,
CONSTRAINT pkRespaldoTarjeta PRIMARY KEY (idRespaldoTarjeta),
CONSTRAINT ukRespaldoTarjeta_CargaFila UNIQUE (idCargaMigracion, numeroFilaExcel),
CONSTRAINT fkRespaldoTarjeta_CargaMigracion FOREIGN KEY (idCargaMigracion) REFERENCES DbSigaUNAH.Migracion.tblCargasMigracion(idCargaMigracion));

CREATE NONCLUSTERED INDEX ixRespaldoTarjeta_CargaEstado ON
DbSigaUNAH.Migracion.tblRespaldoTarjetas (idCargaMigracion,
estadoMigracion);
-- DROP SCHEMA Operaciones;

CREATE SCHEMA Operaciones;
-- DbSigaUNAH.Operaciones.tblIncidentesAcceso definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso;

CREATE TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso ( idIncidenteAcceso bigint IDENTITY(1, 1) NOT NULL,
idRegistroAcceso bigint NULL,
idDispositivo bigint NULL,
idBeneficiario bigint NULL,
idTarjeta bigint NULL,
codigoIncidenteAcceso nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
tipoIncidenteAcceso nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionIncidenteAcceso nvarchar(1000) COLLATE Modern_Spanish_CI_AS NOT NULL,
nivelSeveridadIncidenteAcceso nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaIncidenteAcceso datetime2(3) DEFAULT sysdatetime() NOT NULL,
fechaResolucionIncidenteAcceso datetime2(3) NULL,
resueltoIncidenteAcceso bit DEFAULT 0 NOT NULL,
resolucionIncidenteAcceso nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
estadoIncidenteAcceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkIncidenteAcceso PRIMARY KEY (idIncidenteAcceso),
CONSTRAINT ukIncidenteAcceso_Codigo UNIQUE (codigoIncidenteAcceso));

CREATE NONCLUSTERED INDEX ixIncidenteAcceso_FechaSeveridad ON
DbSigaUNAH.Operaciones.tblIncidentesAcceso (fechaIncidenteAcceso,
nivelSeveridadIncidenteAcceso,
resueltoIncidenteAcceso);
-- DbSigaUNAH.Operaciones.tblRegistrosAcceso definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso;

CREATE TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ( idRegistroAcceso bigint IDENTITY(1, 1) NOT NULL,
idTarjeta bigint NULL,
idAsignacion bigint NULL,
idBeneficiario bigint NULL,
idDispositivo bigint NULL,
idElevador int NULL,
fechaHoraAcceso datetime2 NOT NULL,
resultadoAcceso nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
codigoResultado nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
direccionMovimiento nvarchar(20) COLLATE Modern_Spanish_CI_AS NULL,
pisoOrigen smallint NULL,
pisoDestino smallint NULL,
origenRegistro nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
identificadorExterno nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkRegistroAcceso PRIMARY KEY (idRegistroAcceso));

CREATE NONCLUSTERED INDEX ixRegistroAcceso_BeneficiarioFecha ON
DbSigaUNAH.Operaciones.tblRegistrosAcceso (idBeneficiario,
fechaHoraAcceso);

CREATE NONCLUSTERED INDEX ixRegistroAcceso_TarjetaFecha ON
DbSigaUNAH.Operaciones.tblRegistrosAcceso (idTarjeta,
fechaHoraAcceso);
-- DbSigaUNAH.Operaciones.tblRespuestasIntegracion definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblRespuestasIntegracion;

CREATE TABLE DbSigaUNAH.Operaciones.tblRespuestasIntegracion ( idRespuestaIntegracion bigint IDENTITY(1, 1) NOT NULL,
idSolicitudIntegracion bigint NOT NULL,
codigoRespuesta nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
fechaRespuesta datetime2 DEFAULT sysdatetime() NOT NULL,
datosRespuesta nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
fueExitosa bit NOT NULL,
mensajeError nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkRespuestaIntegracion PRIMARY KEY (idRespuestaIntegracion));

CREATE NONCLUSTERED INDEX ixRespuestaIntegracion_SolicitudFecha ON
DbSigaUNAH.Operaciones.tblRespuestasIntegracion (idSolicitudIntegracion,
fechaRespuesta);
-- DbSigaUNAH.Operaciones.tblResumenesAccesos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblResumenesAccesos;

CREATE TABLE DbSigaUNAH.Operaciones.tblResumenesAccesos ( idResumenAcceso bigint IDENTITY(1, 1) NOT NULL,
fechaResumenAcceso date NOT NULL,
idCampus int NULL,
idEdificio int NULL,
idElevador int NULL,
cantidadAccesosPermitidosResumenAcceso bigint DEFAULT 0 NOT NULL,
cantidadAccesosDenegadosResumenAcceso bigint DEFAULT 0 NOT NULL,
cantidadIncidentesResumenAcceso bigint DEFAULT 0 NOT NULL,
fechaGeneracionResumenAcceso datetime2(0) DEFAULT sysdatetime() NOT NULL,
estadoResumenAcceso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkResumenAcceso PRIMARY KEY (idResumenAcceso),
CONSTRAINT ukResumenAcceso_FechaUbicacion UNIQUE (fechaResumenAcceso, idCampus, idEdificio, idElevador));

CREATE NONCLUSTERED INDEX ixResumenAcceso_FechaCampus ON
DbSigaUNAH.Operaciones.tblResumenesAccesos (fechaResumenAcceso,
idCampus,
idEdificio,
idElevador);
-- DbSigaUNAH.Operaciones.tblSincronizaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblSincronizaciones;

CREATE TABLE DbSigaUNAH.Operaciones.tblSincronizaciones ( idSincronizacion bigint IDENTITY(1, 1) NOT NULL,
idIntegracion int NOT NULL,
tipoSincronizacion nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaInicio datetime2 NOT NULL,
fechaFinalizacion datetime2 NULL,
totalProcesados int DEFAULT 0 NOT NULL,
totalExitosos int DEFAULT 0 NOT NULL,
totalFallidos int DEFAULT 0 NOT NULL,
estadoSincronizacion nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
detalleSincronizacion nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSincronizacion PRIMARY KEY (idSincronizacion));

CREATE NONCLUSTERED INDEX ixSincronizacion_IntegracionFecha ON
DbSigaUNAH.Operaciones.tblSincronizaciones (idIntegracion,
fechaInicio);
-- DbSigaUNAH.Operaciones.tblSolicitudesIntegracion definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblSolicitudesIntegracion;

CREATE TABLE DbSigaUNAH.Operaciones.tblSolicitudesIntegracion ( idSolicitudIntegracion bigint IDENTITY(1, 1) NOT NULL,
idIntegracion int NOT NULL,
correlacionSolicitud nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
operacionIntegracion nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaSolicitud datetime2 DEFAULT sysdatetime() NOT NULL,
datosSolicitud nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
estadoSolicitudIntegracion nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSolicitudIntegracion PRIMARY KEY (idSolicitudIntegracion),
CONSTRAINT ukSolicitudIntegracion_Correlacion UNIQUE (correlacionSolicitud));

CREATE NONCLUSTERED INDEX ixSolicitudIntegracion_IntegracionFecha ON
DbSigaUNAH.Operaciones.tblSolicitudesIntegracion (idIntegracion,
fechaSolicitud);
-- DbSigaUNAH.Operaciones.tblTarjetasMovimientos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos;

CREATE TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ( idTarjetaMovimiento bigint IDENTITY(1, 1) NOT NULL,
idTarjeta bigint NOT NULL,
idAsignacion bigint NULL,
idTipoMovimientoTarjeta int NOT NULL,
idEstadoTarjetaAnterior int NULL,
idEstadoTarjetaNuevo int NULL,
fechaMovimiento datetime2 NOT NULL,
motivoMovimiento nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
idUsuarioResponsable bigint NULL,
ubicacionAnterior nvarchar(200) COLLATE Modern_Spanish_CI_AS NULL,
ubicacionNueva nvarchar(200) COLLATE Modern_Spanish_CI_AS NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTarjetaMovimiento PRIMARY KEY (idTarjetaMovimiento));

CREATE NONCLUSTERED INDEX ixTarjetaMovimiento_TarjetaFecha ON
DbSigaUNAH.Operaciones.tblTarjetasMovimientos (idTarjeta,
fechaMovimiento);
-- DbSigaUNAH.Operaciones.tblIncidentesAcceso foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso ADD CONSTRAINT fkIncidenteAcceso_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);

ALTER TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso ADD CONSTRAINT fkIncidenteAcceso_Dispositivo FOREIGN KEY (idDispositivo) REFERENCES DbSigaUNAH.Accesos.tblDispositivos(idDispositivo);

ALTER TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso ADD CONSTRAINT fkIncidenteAcceso_RegistroAcceso FOREIGN KEY (idRegistroAcceso) REFERENCES DbSigaUNAH.Operaciones.tblRegistrosAcceso(idRegistroAcceso);

ALTER TABLE DbSigaUNAH.Operaciones.tblIncidentesAcceso ADD CONSTRAINT fkIncidenteAcceso_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);
-- DbSigaUNAH.Operaciones.tblRegistrosAcceso foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ADD CONSTRAINT fkRegistroAcceso_Asignacion FOREIGN KEY (idAsignacion) REFERENCES DbSigaUNAH.Tarjetas.tblAsignaciones(idAsignacion);

ALTER TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ADD CONSTRAINT fkRegistroAcceso_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);

ALTER TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ADD CONSTRAINT fkRegistroAcceso_Dispositivo FOREIGN KEY (idDispositivo) REFERENCES DbSigaUNAH.Accesos.tblDispositivos(idDispositivo);

ALTER TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ADD CONSTRAINT fkRegistroAcceso_Elevador FOREIGN KEY (idElevador) REFERENCES DbSigaUNAH.Accesos.tblElevadores(idElevador);

ALTER TABLE DbSigaUNAH.Operaciones.tblRegistrosAcceso ADD CONSTRAINT fkRegistroAcceso_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);
-- DbSigaUNAH.Operaciones.tblRespuestasIntegracion foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblRespuestasIntegracion ADD CONSTRAINT fkRespuestaIntegracion_SolicitudIntegracion FOREIGN KEY (idSolicitudIntegracion) REFERENCES DbSigaUNAH.Operaciones.tblSolicitudesIntegracion(idSolicitudIntegracion);
-- DbSigaUNAH.Operaciones.tblResumenesAccesos foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblResumenesAccesos ADD CONSTRAINT fkResumenAcceso_Campus FOREIGN KEY (idCampus) REFERENCES DbSigaUNAH.Accesos.tblCampus(idCampus);

ALTER TABLE DbSigaUNAH.Operaciones.tblResumenesAccesos ADD CONSTRAINT fkResumenAcceso_Edificio FOREIGN KEY (idEdificio) REFERENCES DbSigaUNAH.Accesos.tblEdificios(idEdificio);

ALTER TABLE DbSigaUNAH.Operaciones.tblResumenesAccesos ADD CONSTRAINT fkResumenAcceso_Elevador FOREIGN KEY (idElevador) REFERENCES DbSigaUNAH.Accesos.tblElevadores(idElevador);
-- DbSigaUNAH.Operaciones.tblSincronizaciones foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblSincronizaciones ADD CONSTRAINT fkSincronizacion_Integracion FOREIGN KEY (idIntegracion) REFERENCES DbSigaUNAH.Integracion.tblIntegraciones(idIntegracion);
-- DbSigaUNAH.Operaciones.tblSolicitudesIntegracion foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblSolicitudesIntegracion ADD CONSTRAINT fkSolicitudIntegracion_Integracion FOREIGN KEY (idIntegracion) REFERENCES DbSigaUNAH.Integracion.tblIntegraciones(idIntegracion);
-- DbSigaUNAH.Operaciones.tblTarjetasMovimientos foreign keys

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_Asignacion FOREIGN KEY (idAsignacion) REFERENCES DbSigaUNAH.Tarjetas.tblAsignaciones(idAsignacion);

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_EstadoAnterior FOREIGN KEY (idEstadoTarjetaAnterior) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_EstadoNuevo FOREIGN KEY (idEstadoTarjetaNuevo) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_TipoMovimiento FOREIGN KEY (idTipoMovimientoTarjeta) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Operaciones.tblTarjetasMovimientos ADD CONSTRAINT fkTarjetaMovimiento_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Organizacion;

CREATE SCHEMA Organizacion;
-- DbSigaUNAH.Organizacion.tblTiposUnidadesOrganizativas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Organizacion.tblTiposUnidadesOrganizativas;

CREATE TABLE DbSigaUNAH.Organizacion.tblTiposUnidadesOrganizativas ( idTipoUnidadOrganizativa int IDENTITY(1, 1) NOT NULL,
codigoTipoUnidadOrganizativa nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipoUnidadOrganizativa nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipoUnidadOrganizativa nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
nivelTipoUnidadOrganizativa smallint NULL,
estadoTipoUnidadOrganizativa bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipoUnidadOrganizativa PRIMARY KEY (idTipoUnidadOrganizativa),
CONSTRAINT ukTipoUnidadOrganizativa_Codigo UNIQUE (codigoTipoUnidadOrganizativa));
-- DbSigaUNAH.Organizacion.tblUnidadesOrganizativas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Organizacion.tblUnidadesOrganizativas;

CREATE TABLE DbSigaUNAH.Organizacion.tblUnidadesOrganizativas ( idUnidadOrganizativa int IDENTITY(1, 1) NOT NULL,
idInstitucion int NOT NULL,
idTipoUnidadOrganizativa int NOT NULL,
idUnidadOrganizativaPadre int NULL,
codigoUnidadOrganizativa nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreUnidadOrganizativa nvarchar(200) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCortoUnidadOrganizativa nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
descripcionUnidadOrganizativa nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
rutaJerarquicaUnidadOrganizativa nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
nivelUnidadOrganizativa smallint NULL,
correoUnidadOrganizativa nvarchar(254) COLLATE Modern_Spanish_CI_AS NULL,
telefonoUnidadOrganizativa nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
estadoUnidadOrganizativa bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkUnidadOrganizativa PRIMARY KEY (idUnidadOrganizativa),
CONSTRAINT ukUnidadOrganizativa_InstitucionCodigo UNIQUE (idInstitucion, codigoUnidadOrganizativa));

CREATE NONCLUSTERED INDEX ixUnidadOrganizativa_PadreEstado ON
DbSigaUNAH.Organizacion.tblUnidadesOrganizativas (idUnidadOrganizativaPadre,
estadoUnidadOrganizativa);
-- DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas;

CREATE TABLE DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas ( idUsuarioUnidadOrganizativa bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NOT NULL,
idUnidadOrganizativa int NOT NULL,
idTipoValor int NULL,
fechaInicioUsuarioUnidadOrganizativa datetime2(0) NULL,
fechaFinUsuarioUnidadOrganizativa datetime2(0) NULL,
esPrincipalUsuarioUnidadOrganizativa bit DEFAULT 0 NOT NULL,
estadoUsuarioUnidadOrganizativa bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkUsuarioUnidadOrganizativa PRIMARY KEY (idUsuarioUnidadOrganizativa),
CONSTRAINT ukUsuarioUnidadOrganizativa_UsuarioUnidad UNIQUE (idUsuario, idUnidadOrganizativa));

CREATE NONCLUSTERED INDEX ixUsuarioUnidadOrganizativa_UsuarioEstado ON
DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas (idUsuario,
estadoUsuarioUnidadOrganizativa);
-- DbSigaUNAH.Organizacion.tblUnidadesOrganizativas foreign keys

ALTER TABLE DbSigaUNAH.Organizacion.tblUnidadesOrganizativas ADD CONSTRAINT fkUnidadOrganizativa_Institucion FOREIGN KEY (idInstitucion) REFERENCES DbSigaUNAH.Academico.tblInstituciones(idInstitucion);

ALTER TABLE DbSigaUNAH.Organizacion.tblUnidadesOrganizativas ADD CONSTRAINT fkUnidadOrganizativa_TipoUnidadOrganizativa FOREIGN KEY (idTipoUnidadOrganizativa) REFERENCES DbSigaUNAH.Organizacion.tblTiposUnidadesOrganizativas(idTipoUnidadOrganizativa);

ALTER TABLE DbSigaUNAH.Organizacion.tblUnidadesOrganizativas ADD CONSTRAINT fkUnidadOrganizativa_UnidadOrganizativaPadre FOREIGN KEY (idUnidadOrganizativaPadre) REFERENCES DbSigaUNAH.Organizacion.tblUnidadesOrganizativas(idUnidadOrganizativa);
-- DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas foreign keys

ALTER TABLE DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas ADD CONSTRAINT fkUsuarioUnidadOrganizativa_TipoValor FOREIGN KEY (idTipoValor) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas ADD CONSTRAINT fkUsuarioUnidadOrganizativa_UnidadOrganizativa FOREIGN KEY (idUnidadOrganizativa) REFERENCES DbSigaUNAH.Organizacion.tblUnidadesOrganizativas(idUnidadOrganizativa);

ALTER TABLE DbSigaUNAH.Organizacion.tblUsuariosUnidadesOrganizativas ADD CONSTRAINT fkUsuarioUnidadOrganizativa_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Seguridad;

CREATE SCHEMA Seguridad;
-- DbSigaUNAH.Seguridad.tblPerfiles definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblPerfiles;

CREATE TABLE DbSigaUNAH.Seguridad.tblPerfiles ( idPerfil int IDENTITY(1, 1) NOT NULL,
codigoPerfil nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombrePerfil nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionPerfil nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoPerfil bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPerfil PRIMARY KEY (idPerfil),
CONSTRAINT ukPerfil_Codigo UNIQUE (codigoPerfil));
-- DbSigaUNAH.Seguridad.tblPermisos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblPermisos;

CREATE TABLE DbSigaUNAH.Seguridad.tblPermisos ( idPermiso int IDENTITY(1, 1) NOT NULL,
codigoPermiso nvarchar(80) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombrePermiso nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionPermiso nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
moduloPermiso nvarchar(50) COLLATE Modern_Spanish_CI_AS NOT NULL,
estadoPermiso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPermiso PRIMARY KEY (idPermiso),
CONSTRAINT ukPermiso_Codigo UNIQUE (codigoPermiso));
-- DbSigaUNAH.Seguridad.tblUsuarios definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblUsuarios;

CREATE TABLE DbSigaUNAH.Seguridad.tblUsuarios ( idUsuario bigint IDENTITY(1, 1) NOT NULL,
nombreUsuario nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
correoElectronico nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreAcceso nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
claveHash nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
identificadorInstitucional nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
tipoAutenticacion nvarchar(20) COLLATE Modern_Spanish_CI_AS DEFAULT N'LOCAL' NOT NULL,
ultimoAcceso datetime2 NULL,
intentosFallidos smallint DEFAULT 0 NOT NULL,
fechaBloqueo datetime2 NULL,
estadoUsuario bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkUsuario PRIMARY KEY (idUsuario),
CONSTRAINT ukUsuario_Correo UNIQUE (correoElectronico),
CONSTRAINT ukUsuario_NombreAcceso UNIQUE (nombreAcceso));
-- DbSigaUNAH.Seguridad.tblNavegaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblNavegaciones;

CREATE TABLE DbSigaUNAH.Seguridad.tblNavegaciones ( idNavegacion int IDENTITY(1, 1) NOT NULL,
codigoNavegacion nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreNavegacion nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
tituloNavegacion nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionNavegacion nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
tipoNavegacion nvarchar(16) COLLATE Modern_Spanish_CI_AS NOT NULL,
enlaceNavegacion nvarchar(256) COLLATE Modern_Spanish_CI_AS NULL,
claseNavegacion nvarchar(64) COLLATE Modern_Spanish_CI_AS NULL,
ordenNavegacion smallint NOT NULL,
idNavegacionPadre int NULL,
esVisible bit DEFAULT 1 NOT NULL,
estadoNavegacion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkNavegacion PRIMARY KEY (idNavegacion),
CONSTRAINT ukNavegacion_Codigo UNIQUE (codigoNavegacion),
CONSTRAINT fkNavegacion_NavegacionPadre FOREIGN KEY (idNavegacionPadre) REFERENCES DbSigaUNAH.Seguridad.tblNavegaciones(idNavegacion));

CREATE NONCLUSTERED INDEX ixNavegacion_NavegacionPadre ON
DbSigaUNAH.Seguridad.tblNavegaciones (idNavegacionPadre,
ordenNavegacion);
-- DbSigaUNAH.Seguridad.tblPerfilesNavegaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblPerfilesNavegaciones;

CREATE TABLE DbSigaUNAH.Seguridad.tblPerfilesNavegaciones ( idPerfilNavegacion bigint IDENTITY(1, 1) NOT NULL,
idPerfil int NOT NULL,
idNavegacion int NOT NULL,
permiteVisualizar bit DEFAULT 1 NOT NULL,
estadoPerfilNavegacion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPerfilNavegacion PRIMARY KEY (idPerfilNavegacion),
CONSTRAINT ukPerfilNavegacion_PerfilNavegacion UNIQUE (idPerfil, idNavegacion),
CONSTRAINT fkPerfilNavegacion_Navegacion FOREIGN KEY (idNavegacion) REFERENCES DbSigaUNAH.Seguridad.tblNavegaciones(idNavegacion),
CONSTRAINT fkPerfilNavegacion_Perfil FOREIGN KEY (idPerfil) REFERENCES DbSigaUNAH.Seguridad.tblPerfiles(idPerfil));

CREATE NONCLUSTERED INDEX ixPerfilNavegacion_Perfil ON
DbSigaUNAH.Seguridad.tblPerfilesNavegaciones (idPerfil,
estadoPerfilNavegacion) INCLUDE (idNavegacion,
permiteVisualizar);
-- DbSigaUNAH.Seguridad.tblPerfilesPermisos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblPerfilesPermisos;

CREATE TABLE DbSigaUNAH.Seguridad.tblPerfilesPermisos ( idPerfilPermiso bigint IDENTITY(1, 1) NOT NULL,
idPerfil int NOT NULL,
idPermiso int NOT NULL,
estadoPerfilPermiso bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkPerfilPermiso PRIMARY KEY (idPerfilPermiso),
CONSTRAINT ukPerfilPermiso_PerfilPermiso UNIQUE (idPerfil, idPermiso),
CONSTRAINT fkPerfilPermiso_Perfil FOREIGN KEY (idPerfil) REFERENCES DbSigaUNAH.Seguridad.tblPerfiles(idPerfil),
CONSTRAINT fkPerfilPermiso_Permiso FOREIGN KEY (idPermiso) REFERENCES DbSigaUNAH.Seguridad.tblPermisos(idPermiso));
-- DbSigaUNAH.Seguridad.tblSesionesUsuarios definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblSesionesUsuarios;

CREATE TABLE DbSigaUNAH.Seguridad.tblSesionesUsuarios ( idSesionUsuario bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NOT NULL,
identificadorSesion nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaInicio datetime2 NOT NULL,
fechaExpiracion datetime2 NOT NULL,
fechaCierre datetime2 NULL,
direccionIp nvarchar(45) COLLATE Modern_Spanish_CI_AS NULL,
agenteUsuario nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoSesionUsuario bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSesionUsuario PRIMARY KEY (idSesionUsuario),
CONSTRAINT ukSesionUsuario_Identificador UNIQUE (identificadorSesion),
CONSTRAINT fkSesionUsuario_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario));
-- DbSigaUNAH.Seguridad.tblUsuariosPerfiles definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblUsuariosPerfiles;

CREATE TABLE DbSigaUNAH.Seguridad.tblUsuariosPerfiles ( idUsuarioPerfil bigint IDENTITY(1, 1) NOT NULL,
idUsuario bigint NOT NULL,
idPerfil int NOT NULL,
estadoUsuarioPerfil bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkUsuarioPerfil PRIMARY KEY (idUsuarioPerfil),
CONSTRAINT ukUsuarioPerfil_UsuarioPerfil UNIQUE (idUsuario, idPerfil),
CONSTRAINT fkUsuarioPerfil_Perfil FOREIGN KEY (idPerfil) REFERENCES DbSigaUNAH.Seguridad.tblPerfiles(idPerfil),
CONSTRAINT fkUsuarioPerfil_Usuario FOREIGN KEY (idUsuario) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario));
-- DbSigaUNAH.Seguridad.tblNavegacionesIdiomas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Seguridad.tblNavegacionesIdiomas;

CREATE TABLE DbSigaUNAH.Seguridad.tblNavegacionesIdiomas ( idNavegacionIdioma bigint IDENTITY(1, 1) NOT NULL,
idNavegacion int NOT NULL,
idIdioma smallint NOT NULL,
tituloNavegacionIdioma nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionNavegacionIdioma nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoNavegacionIdioma bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkNavegacionIdioma PRIMARY KEY (idNavegacionIdioma),
CONSTRAINT ukNavegacionIdioma_NavegacionIdioma UNIQUE (idNavegacion, idIdioma));
-- DbSigaUNAH.Seguridad.tblNavegacionesIdiomas foreign keys

ALTER TABLE DbSigaUNAH.Seguridad.tblNavegacionesIdiomas ADD CONSTRAINT fkNavegacionIdioma_Idioma FOREIGN KEY (idIdioma) REFERENCES DbSigaUNAH.Configuracion.tblIdiomas(idIdioma);

ALTER TABLE DbSigaUNAH.Seguridad.tblNavegacionesIdiomas ADD CONSTRAINT fkNavegacionIdioma_Navegacion FOREIGN KEY (idNavegacion) REFERENCES DbSigaUNAH.Seguridad.tblNavegaciones(idNavegacion);
-- DROP SCHEMA Solicitudes;

CREATE SCHEMA Solicitudes;
-- DbSigaUNAH.Solicitudes.tblTiposSolicitudes definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Solicitudes.tblTiposSolicitudes;

CREATE TABLE DbSigaUNAH.Solicitudes.tblTiposSolicitudes ( idTipoSolicitud int IDENTITY(1, 1) NOT NULL,
codigoTipoSolicitud nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipoSolicitud nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipoSolicitud nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
requiereAprobacionTipoSolicitud bit DEFAULT 1 NOT NULL,
numeroNivelesAprobacionTipoSolicitud smallint DEFAULT 1 NOT NULL,
estadoTipoSolicitud bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipoSolicitud PRIMARY KEY (idTipoSolicitud),
CONSTRAINT ukTipoSolicitud_Codigo UNIQUE (codigoTipoSolicitud));
-- DbSigaUNAH.Solicitudes.tblSolicitudes definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Solicitudes.tblSolicitudes;

CREATE TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ( idSolicitud bigint IDENTITY(1, 1) NOT NULL,
codigoSolicitud nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
idBeneficiario bigint NOT NULL,
idPeriodoAcademico int NULL,
idTipoSolicitud int NULL,
idTipoVigencia int NOT NULL,
idEstadoSolicitud int NOT NULL,
fechaSolicitud datetime2 DEFAULT sysdatetime() NOT NULL,
fechaInicioSolicitada date NULL,
fechaFinSolicitada date NULL,
motivoSolicitud nvarchar(1500) COLLATE Modern_Spanish_CI_AS NULL,
origenSolicitud nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaResolucion datetime2 NULL,
idUsuarioResolucion bigint NULL,
observacionResolucion nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
estadoSolicitud bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSolicitud PRIMARY KEY (idSolicitud),
CONSTRAINT ukSolicitud_Codigo UNIQUE (codigoSolicitud));

CREATE NONCLUSTERED INDEX ixSolicitud_BeneficiarioEstado ON
DbSigaUNAH.Solicitudes.tblSolicitudes (idBeneficiario,
idEstadoSolicitud,
estadoSolicitud);

CREATE NONCLUSTERED INDEX ixSolicitud_PeriodoAcademico ON
DbSigaUNAH.Solicitudes.tblSolicitudes (idPeriodoAcademico,
estadoSolicitud);
-- DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones;

CREATE TABLE DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones ( idSolicitudAprobacion bigint IDENTITY(1, 1) NOT NULL,
idSolicitud bigint NOT NULL,
idUsuarioAprobador bigint NOT NULL,
tipoDecision nvarchar(20) COLLATE Modern_Spanish_CI_AS NOT NULL,
observacionAprobacion nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
fechaAprobacion datetime2 DEFAULT sysdatetime() NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSolicitudAprobacion PRIMARY KEY (idSolicitudAprobacion));

CREATE NONCLUSTERED INDEX ixSolicitudAprobacion_SolicitudFecha ON
DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones (idSolicitud,
fechaAprobacion);
-- DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos;

CREATE TABLE DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos ( idSolicitudDocumento bigint IDENTITY(1, 1) NOT NULL,
idSolicitud bigint NOT NULL,
idDocumento bigint NOT NULL,
esDocumentoPrincipal bit DEFAULT 0 NOT NULL,
requeridoSolicitudDocumento bit DEFAULT 1 NOT NULL,
validadoSolicitudDocumento bit DEFAULT 0 NOT NULL,
observacionSolicitudDocumento nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoSolicitudDocumento bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSolicitudDocumento PRIMARY KEY (idSolicitudDocumento),
CONSTRAINT ukSolicitudDocumento_SolicitudDocumento UNIQUE (idSolicitud, idDocumento));

CREATE NONCLUSTERED INDEX ixSolicitudDocumento_SolicitudEstado ON
DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos (idSolicitud,
estadoSolicitudDocumento);
-- DbSigaUNAH.Solicitudes.tblSolicitudesEstados definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados;

CREATE TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados ( idSolicitudEstado bigint IDENTITY(1, 1) NOT NULL,
idSolicitud bigint NOT NULL,
idEstadoSolicitudAnterior int NULL,
idEstadoSolicitudNuevo int NOT NULL,
motivoCambio nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
idUsuarioResponsable bigint NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkSolicitudEstado PRIMARY KEY (idSolicitudEstado));

CREATE NONCLUSTERED INDEX ixSolicitudEstado_Solicitud ON
DbSigaUNAH.Solicitudes.tblSolicitudesEstados (idSolicitud,
fechaRegistro);
-- DbSigaUNAH.Solicitudes.tblSolicitudes foreign keys

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_EstadoSolicitud FOREIGN KEY (idEstadoSolicitud) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_PeriodoAcademico FOREIGN KEY (idPeriodoAcademico) REFERENCES DbSigaUNAH.Academico.tblPeriodosAcademicos(idPeriodoAcademico);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_TipoSolicitud FOREIGN KEY (idTipoSolicitud) REFERENCES DbSigaUNAH.Solicitudes.tblTiposSolicitudes(idTipoSolicitud);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_TipoVigencia FOREIGN KEY (idTipoVigencia) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudes ADD CONSTRAINT fkSolicitud_UsuarioResolucion FOREIGN KEY (idUsuarioResolucion) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones foreign keys

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones ADD CONSTRAINT fkSolicitudAprobacion_Solicitud FOREIGN KEY (idSolicitud) REFERENCES DbSigaUNAH.Solicitudes.tblSolicitudes(idSolicitud);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesAprobaciones ADD CONSTRAINT fkSolicitudAprobacion_UsuarioAprobador FOREIGN KEY (idUsuarioAprobador) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos foreign keys

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos ADD CONSTRAINT fkSolicitudDocumento_Documento FOREIGN KEY (idDocumento) REFERENCES DbSigaUNAH.Documentos.tblDocumentos(idDocumento);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesDocumentos ADD CONSTRAINT fkSolicitudDocumento_Solicitud FOREIGN KEY (idSolicitud) REFERENCES DbSigaUNAH.Solicitudes.tblSolicitudes(idSolicitud);
-- DbSigaUNAH.Solicitudes.tblSolicitudesEstados foreign keys

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados ADD CONSTRAINT fkSolicitudEstado_EstadoAnterior FOREIGN KEY (idEstadoSolicitudAnterior) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados ADD CONSTRAINT fkSolicitudEstado_EstadoNuevo FOREIGN KEY (idEstadoSolicitudNuevo) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados ADD CONSTRAINT fkSolicitudEstado_Solicitud FOREIGN KEY (idSolicitud) REFERENCES DbSigaUNAH.Solicitudes.tblSolicitudes(idSolicitud);

ALTER TABLE DbSigaUNAH.Solicitudes.tblSolicitudesEstados ADD CONSTRAINT fkSolicitudEstado_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Tarjetas;

CREATE SCHEMA Tarjetas;
-- DbSigaUNAH.Tarjetas.tblTiposTarjetas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblTiposTarjetas;

CREATE TABLE DbSigaUNAH.Tarjetas.tblTiposTarjetas ( idTipoTarjeta int IDENTITY(1, 1) NOT NULL,
codigoTipoTarjeta nvarchar(64) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipoTarjeta nvarchar(128) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipoTarjeta nvarchar(512) COLLATE Modern_Spanish_CI_AS NULL,
tecnologiaTipoTarjeta nvarchar(64) COLLATE Modern_Spanish_CI_AS NULL,
vigenciaDiasTipoTarjeta int NULL,
reutilizableTipoTarjeta bit DEFAULT 1 NOT NULL,
estadoTipoTarjeta bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipoTarjeta PRIMARY KEY (idTipoTarjeta),
CONSTRAINT ukTipoTarjeta_Codigo UNIQUE (codigoTipoTarjeta));
-- DbSigaUNAH.Tarjetas.tblAsignaciones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblAsignaciones;

CREATE TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ( idAsignacion bigint IDENTITY(1, 1) NOT NULL,
idSolicitud bigint NOT NULL,
idBeneficiario bigint NOT NULL,
idTarjeta bigint NOT NULL,
idTipoVigencia int NOT NULL,
idEstadoAsignacion int NOT NULL,
fechaAsignacion datetime2 NOT NULL,
fechaEntrega datetime2 NULL,
fechaInicioVigencia date NOT NULL,
fechaFinVigencia date NULL,
fechaDevolucion datetime2 NULL,
numeroCompromiso nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
entregadaPor bigint NULL,
recibidaPor bigint NULL,
observacionEntrega nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
esAsignacionVigente bit DEFAULT 0 NOT NULL,
estadoAsignacion bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkAsignacion PRIMARY KEY (idAsignacion));

CREATE NONCLUSTERED INDEX ixAsignacion_Beneficiario ON
DbSigaUNAH.Tarjetas.tblAsignaciones (idBeneficiario,
esAsignacionVigente);

CREATE UNIQUE NONCLUSTERED INDEX ukAsignacion_TarjetaVigente ON
DbSigaUNAH.Tarjetas.tblAsignaciones (idTarjeta);
-- DbSigaUNAH.Tarjetas.tblAsignacionesEstados definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados;

CREATE TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados ( idAsignacionEstado bigint IDENTITY(1, 1) NOT NULL,
idAsignacion bigint NOT NULL,
idEstadoAsignacionAnterior int NULL,
idEstadoAsignacionNuevo int NOT NULL,
motivoCambio nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
idUsuarioResponsable bigint NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkAsignacionEstado PRIMARY KEY (idAsignacionEstado));

CREATE NONCLUSTERED INDEX ixAsignacionEstado_AsignacionFecha ON
DbSigaUNAH.Tarjetas.tblAsignacionesEstados (idAsignacion,
fechaRegistro);
-- DbSigaUNAH.Tarjetas.tblTarjetas definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblTarjetas;

CREATE TABLE DbSigaUNAH.Tarjetas.tblTarjetas ( idTarjeta bigint IDENTITY(1, 1) NOT NULL,
codigoTarjeta nvarchar(30) COLLATE Modern_Spanish_CI_AS NOT NULL,
codigoExterno nvarchar(50) COLLATE Modern_Spanish_CI_AS NULL,
numeroSerie nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
idEstadoTarjeta int NOT NULL,
fechaAdquisicion date NULL,
fechaAlta date NOT NULL,
fechaBaja date NULL,
motivoBaja nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
requiereRevision bit DEFAULT 0 NOT NULL,
observacionTarjeta nvarchar(1000) COLLATE Modern_Spanish_CI_AS NULL,
estadoTarjeta bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
idTipoTarjeta int NULL,
CONSTRAINT pkTarjeta PRIMARY KEY (idTarjeta),
CONSTRAINT ukTarjeta_Codigo UNIQUE (codigoTarjeta));

CREATE NONCLUSTERED INDEX ixTarjeta_Estado ON
DbSigaUNAH.Tarjetas.tblTarjetas (idEstadoTarjeta,
estadoTarjeta);
-- DbSigaUNAH.Tarjetas.tblTarjetasReemplazos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos;

CREATE TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos ( idTarjetaReemplazo bigint IDENTITY(1, 1) NOT NULL,
idTarjetaAnterior bigint NOT NULL,
idTarjetaNueva bigint NOT NULL,
idAsignacion bigint NULL,
motivoReemplazo nvarchar(1000) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaReemplazo datetime2 NOT NULL,
idUsuarioResponsable bigint NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTarjetaReemplazo PRIMARY KEY (idTarjetaReemplazo),
CONSTRAINT ukTarjetaReemplazo_AnteriorNueva UNIQUE (idTarjetaAnterior, idTarjetaNueva));
-- DbSigaUNAH.Tarjetas.tblTarjetasRevisiones definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tarjetas.tblTarjetasRevisiones;

CREATE TABLE DbSigaUNAH.Tarjetas.tblTarjetasRevisiones ( idTarjetaRevision bigint IDENTITY(1, 1) NOT NULL,
idTarjeta bigint NOT NULL,
fechaEnvio datetime2 DEFAULT sysdatetime() NOT NULL,
fechaRecepcion datetime2 NULL,
enviadaA nvarchar(200) COLLATE Modern_Spanish_CI_AS NULL,
diagnostico nvarchar(1500) COLLATE Modern_Spanish_CI_AS NULL,
resultadoRevision nvarchar(30) COLLATE Modern_Spanish_CI_AS NULL,
puedeReutilizarse bit NULL,
costoRevision decimal(18, 2) NULL,
fechaResolucion datetime2 NULL,
idUsuarioResponsable bigint NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTarjetaRevision PRIMARY KEY (idTarjetaRevision));

CREATE NONCLUSTERED INDEX ixTarjetaRevision_TarjetaFecha ON
DbSigaUNAH.Tarjetas.tblTarjetasRevisiones (idTarjeta,
fechaEnvio);
-- DbSigaUNAH.Tarjetas.tblAsignaciones foreign keys

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_Beneficiario FOREIGN KEY (idBeneficiario) REFERENCES DbSigaUNAH.Beneficiarios.tblBeneficiarios(idBeneficiario);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_EstadoAsignacion FOREIGN KEY (idEstadoAsignacion) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_Solicitud FOREIGN KEY (idSolicitud) REFERENCES DbSigaUNAH.Solicitudes.tblSolicitudes(idSolicitud);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_TipoVigencia FOREIGN KEY (idTipoVigencia) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_UsuarioEntrega FOREIGN KEY (entregadaPor) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignaciones ADD CONSTRAINT fkAsignacion_UsuarioRecepcion FOREIGN KEY (recibidaPor) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Tarjetas.tblAsignacionesEstados foreign keys

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados ADD CONSTRAINT fkAsignacionEstado_Asignacion FOREIGN KEY (idAsignacion) REFERENCES DbSigaUNAH.Tarjetas.tblAsignaciones(idAsignacion);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados ADD CONSTRAINT fkAsignacionEstado_EstadoAnterior FOREIGN KEY (idEstadoAsignacionAnterior) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados ADD CONSTRAINT fkAsignacionEstado_EstadoNuevo FOREIGN KEY (idEstadoAsignacionNuevo) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Tarjetas.tblAsignacionesEstados ADD CONSTRAINT fkAsignacionEstado_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Tarjetas.tblTarjetas foreign keys

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetas ADD CONSTRAINT fkTarjeta_EstadoTarjeta FOREIGN KEY (idEstadoTarjeta) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor);

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetas ADD CONSTRAINT fkTarjeta_TipoTarjeta FOREIGN KEY (idTipoTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTiposTarjetas(idTipoTarjeta);
-- DbSigaUNAH.Tarjetas.tblTarjetasReemplazos foreign keys

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos ADD CONSTRAINT fkTarjetaReemplazo_Asignacion FOREIGN KEY (idAsignacion) REFERENCES DbSigaUNAH.Tarjetas.tblAsignaciones(idAsignacion);

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos ADD CONSTRAINT fkTarjetaReemplazo_TarjetaAnterior FOREIGN KEY (idTarjetaAnterior) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos ADD CONSTRAINT fkTarjetaReemplazo_TarjetaNueva FOREIGN KEY (idTarjetaNueva) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasReemplazos ADD CONSTRAINT fkTarjetaReemplazo_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DbSigaUNAH.Tarjetas.tblTarjetasRevisiones foreign keys

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasRevisiones ADD CONSTRAINT fkTarjetaRevision_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta);

ALTER TABLE DbSigaUNAH.Tarjetas.tblTarjetasRevisiones ADD CONSTRAINT fkTarjetaRevision_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario);
-- DROP SCHEMA Tipos;

CREATE SCHEMA Tipos;
-- DbSigaUNAH.Tipos.tblCategorias definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tipos.tblCategorias;

CREATE TABLE DbSigaUNAH.Tipos.tblCategorias ( idCategoria int IDENTITY(1, 1) NOT NULL,
codigoCategoria nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreCategoria nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionCategoria nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoCategoria bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkCategoria PRIMARY KEY (idCategoria),
CONSTRAINT ukCategoria_CodigoCategoria UNIQUE (codigoCategoria));
-- DbSigaUNAH.Tipos.tblTipos definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tipos.tblTipos;

CREATE TABLE DbSigaUNAH.Tipos.tblTipos ( idTipo int IDENTITY(1, 1) NOT NULL,
idCategoria int NOT NULL,
codigoTipo nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipo nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipo nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
estadoTipo bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipo PRIMARY KEY (idTipo),
CONSTRAINT ukTipo_CategoriaCodigo UNIQUE (idCategoria, codigoTipo),
CONSTRAINT fkTipo_Categoria FOREIGN KEY (idCategoria) REFERENCES DbSigaUNAH.Tipos.tblCategorias(idCategoria));

CREATE NONCLUSTERED INDEX ixTipo_TipoCategoriaEstado ON
DbSigaUNAH.Tipos.tblTipos (idCategoria,
estadoTipo);
-- DbSigaUNAH.Tipos.tblTiposValores definition
-- Drop table
-- DROP TABLE DbSigaUNAH.Tipos.tblTiposValores;

CREATE TABLE DbSigaUNAH.Tipos.tblTiposValores ( idTipoValor int IDENTITY(1, 1) NOT NULL,
idTipo int NOT NULL,
codigoTipoValor nvarchar(100) COLLATE Modern_Spanish_CI_AS NOT NULL,
nombreTipoValor nvarchar(150) COLLATE Modern_Spanish_CI_AS NOT NULL,
descripcionTipoValor nvarchar(500) COLLATE Modern_Spanish_CI_AS NULL,
ordenTipoValor smallint DEFAULT 0 NOT NULL,
valorAdicionalTipoValor nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
estadoTipoValor bit DEFAULT 1 NOT NULL,
usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
fechaRegistro datetime2(0) DEFAULT sysdatetime() NOT NULL,
usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
fechaActualizacion datetime2(0) NULL,
CONSTRAINT pkTipoValor PRIMARY KEY (idTipoValor),
CONSTRAINT ukTipoValor_TipoCodigo UNIQUE (idTipo, codigoTipoValor),
CONSTRAINT fkTipoValor_Tipo FOREIGN KEY (idTipo) REFERENCES DbSigaUNAH.Tipos.tblTipos(idTipo));

CREATE NONCLUSTERED INDEX ixTipoValor_TipoEstado ON
DbSigaUNAH.Tipos.tblTiposValores (idTipo,
estadoTipoValor);
