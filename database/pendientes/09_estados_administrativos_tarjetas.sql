/* Pendiente: ejecutar manualmente después de inspeccionar constraints del ambiente destino. No ejecuta correcciones de datos. */
IF OBJECT_ID(N'DbSigaUNAH.Tarjetas.tblTarjetasEstados', N'U') IS NULL
BEGIN
  CREATE TABLE DbSigaUNAH.Tarjetas.tblTarjetasEstados (
    idTarjetaEstado bigint IDENTITY(1,1) NOT NULL,
    idTarjeta bigint NOT NULL,
    idEstadoTarjetaAnterior int NULL,
    idEstadoTarjetaNuevo int NOT NULL,
    motivoCambio nvarchar(1000) COLLATE Modern_Spanish_CI_AS NOT NULL,
    idUsuarioResponsable bigint NOT NULL,
    usuarioRegistro nvarchar(90) COLLATE Modern_Spanish_CI_AS NOT NULL,
    fechaRegistro datetime2(0) NOT NULL CONSTRAINT dfTarjetaEstado_FechaRegistro DEFAULT sysdatetime(),
    usuarioActualizacion nvarchar(90) COLLATE Modern_Spanish_CI_AS NULL,
    fechaActualizacion datetime2(0) NULL,
    CONSTRAINT pkTarjetaEstado PRIMARY KEY (idTarjetaEstado),
    CONSTRAINT fkTarjetaEstado_Tarjeta FOREIGN KEY (idTarjeta) REFERENCES DbSigaUNAH.Tarjetas.tblTarjetas(idTarjeta),
    CONSTRAINT fkTarjetaEstado_EstadoAnterior FOREIGN KEY (idEstadoTarjetaAnterior) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor),
    CONSTRAINT fkTarjetaEstado_EstadoNuevo FOREIGN KEY (idEstadoTarjetaNuevo) REFERENCES DbSigaUNAH.Tipos.tblTiposValores(idTipoValor),
    CONSTRAINT fkTarjetaEstado_UsuarioResponsable FOREIGN KEY (idUsuarioResponsable) REFERENCES DbSigaUNAH.Seguridad.tblUsuarios(idUsuario)
  );
  CREATE NONCLUSTERED INDEX ixTarjetaEstado_TarjetaFecha ON DbSigaUNAH.Tarjetas.tblTarjetasEstados(idTarjeta,fechaRegistro);
END;
GO
