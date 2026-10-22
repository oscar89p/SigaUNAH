# Inventario de base de datos — SIGA UNAH

## Alcance y verificación

**DbSigaUNAH fue consultada en SQL Server mediante consultas exclusivamente `SELECT` a `sys.tables`, `sys.foreign_keys` y `INFORMATION_SCHEMA`.** La conexión respondió `DB_NAME() = DbSigaUNAH`. No se consultaron registros personales ni valores de credenciales. No se ejecutó DDL, DML ni scripts del repositorio.

| Evidencia | SQL Server real | `database/SIGADll.sql` |
|---|---:|---:|
| Esquemas con tablas | 16 | 16 declarados |
| Tablas | 83 | 82 `CREATE TABLE` |
| Llaves primarias | 83 | 82 |
| Llaves foráneas | 125 | 125 |
| Tablas, PK y FK presentes solo en el script | 0 | 0 |

La diferencia única observada es **`Migracion.tblCargaBeneficiariosDemo`**, presente en SQL Server, ausente del DDL versionado y con PK `idCarga`. No tiene FK. Su estructura real incluye `idRespaldoTarjeta`, `idPersona`, `nombreCompleto`, `numeroCuenta`, `telefono`, `carreraTexto` y `correo`; no se leyeron valores de esas columnas. Las PK y las 125 relaciones FK del script coinciden con SQL Server; las PK son de una columna. La comprobación de tablas, PK y FK se hizo comparando los metadatos del catálogo con las definiciones del script.

Las cifras y el inventario siguiente están **verificados en SQL Server**. La columna PK muestra la columna de la llave primaria. El DDL indica dónde revisar las definiciones locales: `database/SIGADll.sql`.

## Esquemas, tablas y llaves primarias

| Esquema | Tablas (PK) | Tipo predominante |
|---|---|---|
| `Academico` (6) | `tblInstituciones` (`idInstitucion`); `tblCentrosUniversitarios` (`idCentroUniversitario`); `tblFacultades` (`idFacultad`); `tblPeriodosAcademicos` (`idPeriodoAcademico`); `tblCarreras` (`idCarrera`); `tblMatriculas` (`idMatricula`) | Catálogos institucionales y matrículas |
| `Accesos` (8) | `tblCampus` (`idCampus`); `tblPerfilesAcceso` (`idPerfilAcceso`); `tblEdificios` (`idEdificio`); `tblElevadores` (`idElevador`); `tblPerfilesAccesoElevadores` (`idPerfilAccesoElevador`); `tblVersionesPerfilesAcceso` (`idVersionPerfilAcceso`); `tblDispositivos` (`idDispositivo`); `tblAsignacionesPerfilesAcceso` (`idAsignacionPerfilAcceso`) | Infraestructura, políticas de acceso y relaciones |
| `Auditoria` (3) | `tblLogsSistema` (`idLogSistema`); `tblBitacoras` (`idBitacora`); `tblIntentosAutenticacion` (`idIntentoAutenticacion`) | Logs y eventos de auditoría; consulta, no CRUD |
| `Beneficiarios` (5) | `tblPersonas` (`idPersona`); `tblBeneficiarios` (`idBeneficiario`); `tblBeneficiariosCondiciones` (`idBeneficiarioCondicion`); `tblExpedientes` (`idExpediente`); `tblExpedientesDocumentos` (`idExpedienteDocumento`) | Personas, beneficiarios, condiciones y expedientes |
| `Comunicacion` (4) | `tblConversaciones` (`idConversacion`); `tblAlertas` (`idAlerta`); `tblMensajes` (`idMensaje`); `tblNotificacionesEnviadas` (`idNotificacionEnviada`) | Mensajería y entrega de notificaciones |
| `Configuracion` (10) | `tblIdiomas` (`idIdioma`); `tblListas` (`idLista`); `tblMacroProcesos` (`idMacroProceso`); `tblParametros` (`idParametro`); `tblVersionesSistema` (`idVersionSistema`); `tblListasValores` (`idListaValor`); `tblParametrosValores` (`idParametroValor`); `tblProcesos` (`idProceso`); `tblErrores` (`idError`); `tblErroresIdiomas` (`idErrorIdioma`) | Catálogos y parámetros de configuración |
| `Documentos` (4) | `tblTiposDocumentos` (`idTipoDocumento`); `tblAdjuntos` (`idAdjunto`); `tblDocumentos` (`idDocumento`); `tblDocumentosVersiones` (`idDocumentoVersion`) | Metadatos, adjuntos y versiones documentales |
| `Indicadores` (3) | `tblIndicadores` (`idIndicador`); `tblIndicadoresFormulas` (`idIndicadorFormula`); `tblIndicadoresValores` (`idIndicadorValor`) | Definiciones y mediciones |
| `Integracion` (4) | `tblSistemas` (`idSistema`); `tblIntegraciones` (`idIntegracion`); `tblCredenciales` (`idCredencial`); `tblEndpoints` (`idEndpoint`) | Configuración de conectores; credenciales sensibles |
| `Migracion` (3) | `tblCargasMigracion` (`idCargaMigracion`); `tblRespaldoTarjetas` (`idRespaldoTarjeta`); **`tblCargaBeneficiariosDemo` (`idCarga`)** | Lotes, respaldos y staging/demo |
| `Operaciones` (7) | `tblIncidentesAcceso` (`idIncidenteAcceso`); `tblRegistrosAcceso` (`idRegistroAcceso`); `tblRespuestasIntegracion` (`idRespuestaIntegracion`); `tblResumenesAccesos` (`idResumenAcceso`); `tblSincronizaciones` (`idSincronizacion`); `tblSolicitudesIntegracion` (`idSolicitudIntegracion`); `tblTarjetasMovimientos` (`idTarjetaMovimiento`) | Eventos, incidentes, integración y resumen operacional |
| `Organizacion` (3) | `tblTiposUnidadesOrganizativas` (`idTipoUnidadOrganizativa`); `tblUnidadesOrganizativas` (`idUnidadOrganizativa`); `tblUsuariosUnidadesOrganizativas` (`idUsuarioUnidadOrganizativa`) | Estructura organizativa y asignaciones |
| `Seguridad` (9) | `tblPerfiles` (`idPerfil`); `tblPermisos` (`idPermiso`); `tblUsuarios` (`idUsuario`); `tblNavegaciones` (`idNavegacion`); `tblPerfilesNavegaciones` (`idPerfilNavegacion`); `tblPerfilesPermisos` (`idPerfilPermiso`); `tblSesionesUsuarios` (`idSesionUsuario`); `tblUsuariosPerfiles` (`idUsuarioPerfil`); `tblNavegacionesIdiomas` (`idNavegacionIdioma`) | Identidad, RBAC, navegación y sesiones |
| `Solicitudes` (5) | `tblTiposSolicitudes` (`idTipoSolicitud`); `tblSolicitudes` (`idSolicitud`); `tblSolicitudesAprobaciones` (`idSolicitudAprobacion`); `tblSolicitudesDocumentos` (`idSolicitudDocumento`); `tblSolicitudesEstados` (`idSolicitudEstado`) | Solicitudes, decisiones, documentos e historial |
| `Tarjetas` (6) | `tblTiposTarjetas` (`idTipoTarjeta`); `tblAsignaciones` (`idAsignacion`); `tblAsignacionesEstados` (`idAsignacionEstado`); `tblTarjetas` (`idTarjeta`); `tblTarjetasReemplazos` (`idTarjetaReemplazo`); `tblTarjetasRevisiones` (`idTarjetaRevision`) | Inventario, asignaciones e historial de tarjetas |
| `Tipos` (3) | `tblCategorias` (`idCategoria`); `tblTipos` (`idTipo`); `tblTiposValores` (`idTipoValor`) | Catálogos tipados compartidos |

## Relaciones verificadas

Las 125 FK se encontraron tanto en el catálogo real como en `SIGADll.sql`. El listado agrupa por tabla dependiente; la flecha muestra columna → tabla/columna referenciada.

<details>
<summary>Mapa completo de llaves foráneas (60 tablas dependientes)</summary>

- `Academico.tblCarreras`: `idFacultad` → `Academico.tblFacultades.idFacultad`.
- `Academico.tblCentrosUniversitarios`: `idInstitucion` → `Academico.tblInstituciones.idInstitucion`.
- `Academico.tblFacultades`: `idInstitucion` → `Academico.tblInstituciones.idInstitucion`.
- `Academico.tblMatriculas`: `idCarrera` → `Academico.tblCarreras`; `idCentroUniversitario` → `Academico.tblCentrosUniversitarios`; `idPeriodoAcademico` → `Academico.tblPeriodosAcademicos`; `idUsuario` → `Seguridad.tblUsuarios`.
- `Academico.tblPeriodosAcademicos`: `idInstitucion` → `Academico.tblInstituciones`.
- `Accesos.tblAsignacionesPerfilesAcceso`: `idAsignacion` → `Tarjetas.tblAsignaciones`; `idPerfilAcceso` → `Accesos.tblPerfilesAcceso`.
- `Accesos.tblDispositivos`: `idElevador` → `Accesos.tblElevadores`.
- `Accesos.tblEdificios`: `idCampus` → `Accesos.tblCampus`.
- `Accesos.tblElevadores`: `idEdificio` → `Accesos.tblEdificios`.
- `Accesos.tblPerfilesAccesoElevadores`: `idElevador` → `Accesos.tblElevadores`; `idPerfilAcceso` → `Accesos.tblPerfilesAcceso`.
- `Accesos.tblVersionesPerfilesAcceso`: `idPerfilAcceso` → `Accesos.tblPerfilesAcceso`.
- `Auditoria.tblBitacoras`, `Auditoria.tblIntentosAutenticacion`: `idUsuario` → `Seguridad.tblUsuarios`.
- `Beneficiarios.tblBeneficiarios`: `idCarrera` → `Academico.tblCarreras`; `idPersona` → `Beneficiarios.tblPersonas`; `idTipoBeneficiario` → `Tipos.tblTiposValores`.
- `Beneficiarios.tblBeneficiariosCondiciones`: `idBeneficiario` → `Beneficiarios.tblBeneficiarios`; `idTipoCondicion` → `Tipos.tblTiposValores`.
- `Beneficiarios.tblExpedientes`: `idBeneficiario` → `Beneficiarios.tblBeneficiarios`.
- `Beneficiarios.tblExpedientesDocumentos`: `idDocumento` → `Documentos.tblDocumentos`; `idExpediente` → `Beneficiarios.tblExpedientes`.
- `Comunicacion.tblAlertas`: `idUsuario` → `Seguridad.tblUsuarios`.
- `Comunicacion.tblMensajes`: `idConversacion` → `Comunicacion.tblConversaciones`; `idUsuarioRemitente` → `Seguridad.tblUsuarios`.
- `Comunicacion.tblNotificacionesEnviadas`: `idAlerta` → `Comunicacion.tblAlertas`; `idUsuario` → `Seguridad.tblUsuarios`.
- `Configuracion.tblErrores`: `idTipoValor` → `Tipos.tblTiposValores`.
- `Configuracion.tblErroresIdiomas`: `idError` → `Configuracion.tblErrores`; `idIdioma` → `Configuracion.tblIdiomas`.
- `Configuracion.tblListasValores`: `idLista` → `Configuracion.tblListas`; `idListaValorPadre` → `Configuracion.tblListasValores` (jerarquía).
- `Configuracion.tblParametrosValores`: `idParametro` → `Configuracion.tblParametros`.
- `Configuracion.tblProcesos`: `idMacroProceso` → `Configuracion.tblMacroProcesos`.
- `Documentos.tblAdjuntos`: `idDocumento` → `Documentos.tblDocumentos`.
- `Documentos.tblDocumentos`: `idTipoDocumento` → `Documentos.tblTiposDocumentos`; `idUnidadOrganizativa` → `Organizacion.tblUnidadesOrganizativas`; `idUsuarioPropietario` → `Seguridad.tblUsuarios`.
- `Documentos.tblDocumentosVersiones`: `idDocumento` → `Documentos.tblDocumentos`.
- `Indicadores.tblIndicadoresFormulas`: `idIndicador` → `Indicadores.tblIndicadores`.
- `Indicadores.tblIndicadoresValores`: `idCampus` → `Accesos.tblCampus`; `idEdificio` → `Accesos.tblEdificios`; `idElevador` → `Accesos.tblElevadores`; `idIndicador` → `Indicadores.tblIndicadores`.
- `Integracion.tblCredenciales`, `Integracion.tblEndpoints`: `idIntegracion` → `Integracion.tblIntegraciones`.
- `Integracion.tblIntegraciones`: `idSistemaDestino`, `idSistemaOrigen` → `Integracion.tblSistemas`.
- `Migracion.tblRespaldoTarjetas`: `idCargaMigracion` → `Migracion.tblCargasMigracion`.
- `Operaciones.tblIncidentesAcceso`: beneficiario, dispositivo, registro y tarjeta → `Beneficiarios.tblBeneficiarios`, `Accesos.tblDispositivos`, `Operaciones.tblRegistrosAcceso`, `Tarjetas.tblTarjetas` respectivamente.
- `Operaciones.tblRegistrosAcceso`: asignación, beneficiario, dispositivo, elevador y tarjeta → `Tarjetas.tblAsignaciones`, `Beneficiarios.tblBeneficiarios`, `Accesos.tblDispositivos`, `Accesos.tblElevadores`, `Tarjetas.tblTarjetas`.
- `Operaciones.tblRespuestasIntegracion`: `idSolicitudIntegracion` → `Operaciones.tblSolicitudesIntegracion`.
- `Operaciones.tblResumenesAccesos`: campus, edificio y elevador → sus tablas `Accesos` correspondientes.
- `Operaciones.tblSincronizaciones`, `Operaciones.tblSolicitudesIntegracion`: `idIntegracion` → `Integracion.tblIntegraciones`.
- `Operaciones.tblTarjetasMovimientos`: asignación/tarjeta → `Tarjetas`; usuario responsable → `Seguridad.tblUsuarios`; tipo de movimiento y estados anterior/nuevo → `Tipos.tblTiposValores`.
- `Organizacion.tblUnidadesOrganizativas`: institución → `Academico.tblInstituciones`; tipo → `Organizacion.tblTiposUnidadesOrganizativas`; padre → la propia tabla.
- `Organizacion.tblUsuariosUnidadesOrganizativas`: tipo → `Tipos.tblTiposValores`; unidad → `Organizacion.tblUnidadesOrganizativas`; usuario → `Seguridad.tblUsuarios`.
- `Seguridad.tblNavegaciones`: `idNavegacionPadre` → la propia tabla.
- `Seguridad.tblNavegacionesIdiomas`: idioma → `Configuracion.tblIdiomas`; navegación → `Seguridad.tblNavegaciones`.
- `Seguridad.tblPerfilesNavegaciones`: navegación → `Seguridad.tblNavegaciones`; perfil → `Seguridad.tblPerfiles`.
- `Seguridad.tblPerfilesPermisos`: perfil → `Seguridad.tblPerfiles`; permiso → `Seguridad.tblPermisos`.
- `Seguridad.tblSesionesUsuarios`: usuario → `Seguridad.tblUsuarios`.
- `Seguridad.tblUsuariosPerfiles`: perfil → `Seguridad.tblPerfiles`; usuario → `Seguridad.tblUsuarios`.
- `Solicitudes.tblSolicitudes`: beneficiario → `Beneficiarios.tblBeneficiarios`; estado/vigencia → `Tipos.tblTiposValores`; período → `Academico.tblPeriodosAcademicos`; tipo → `Solicitudes.tblTiposSolicitudes`; usuario resolutor → `Seguridad.tblUsuarios`.
- `Solicitudes.tblSolicitudesAprobaciones`: solicitud → `Solicitudes.tblSolicitudes`; aprobador → `Seguridad.tblUsuarios`.
- `Solicitudes.tblSolicitudesDocumentos`: documento → `Documentos.tblDocumentos`; solicitud → `Solicitudes.tblSolicitudes`.
- `Solicitudes.tblSolicitudesEstados`: solicitud → `Solicitudes.tblSolicitudes`; estados anterior/nuevo → `Tipos.tblTiposValores`; responsable → `Seguridad.tblUsuarios`.
- `Tarjetas.tblAsignaciones`: beneficiario → `Beneficiarios.tblBeneficiarios`; solicitud → `Solicitudes.tblSolicitudes`; tarjeta → `Tarjetas.tblTarjetas`; vigencia/estado → `Tipos.tblTiposValores`; entrega/recepción → `Seguridad.tblUsuarios`.
- `Tarjetas.tblAsignacionesEstados`: asignación → `Tarjetas.tblAsignaciones`; estados anterior/nuevo → `Tipos.tblTiposValores`; responsable → `Seguridad.tblUsuarios`.
- `Tarjetas.tblTarjetas`: estado → `Tipos.tblTiposValores`; tipo → `Tarjetas.tblTiposTarjetas`.
- `Tarjetas.tblTarjetasReemplazos`: asignación/tarjetas anterior y nueva → `Tarjetas`; responsable → `Seguridad.tblUsuarios`.
- `Tarjetas.tblTarjetasRevisiones`: tarjeta → `Tarjetas.tblTarjetas`; responsable → `Seguridad.tblUsuarios`.
- `Tipos.tblTipos`: categoría → `Tipos.tblCategorias`.
- `Tipos.tblTiposValores`: tipo → `Tipos.tblTipos`.

</details>

## Clasificación por dominio

- **Catálogos:** `Academico` instituciones, centros, facultades, períodos y carreras; `Accesos` campus y perfiles; `Configuracion` listas, parámetros, idiomas, procesos y tipos de documento; `Solicitudes` tipos; `Tarjetas` tipos; `Tipos` categorías/tipos/valores; `Organizacion` tipos de unidad. Son tablas de referencia o configuración, no todas tienen CRUD en el sistema.
- **Transaccionales:** solicitudes, asignaciones y tarjetas, beneficiarios, matrículas, aprobaciones, incidentes y asignaciones organizativas.
- **Seguridad/RBAC:** nueve tablas `Seguridad`; relaciones M:N usuario-perfil, perfil-permiso y perfil-navegación; jerarquía autoreferenciada de navegación.
- **Configuración:** `Configuracion` y catálogos auxiliares asociados; `Integracion` contiene endpoints y credenciales sensibles.
- **Auditoría/operación:** `Auditoria` conserva logs/bitácoras/intentos; `Operaciones` almacena eventos y estados que deben tratarse como registros de consulta o monitoreo, no como CRUD destructivo.
- **Técnicas/históricas:** `Migracion`, versiones, relaciones, estados y movimientos. Las PK/FK no implican que deban exponerse como CRUD independiente.

## Datos reales de Seguridad y navegación

Consultas de agregación y catálogos (sin usuarios ni credenciales):

- 5 perfiles activos, 19 permisos activos, 15 opciones de navegación activas/visibles.
- 32 filas de asignación perfil-navegación, 39 filas perfil-permiso y 3 filas usuario-perfil.
- Códigos de permisos existentes: `ACCESOS_CONSULTAR`, `ACCESOS_HISTORIAL`, `AUDITORIA_CONSULTAR`, cuatro permisos `BENEFICIARIOS_*`, `CONFIGURACION_ADMINISTRAR`, `REPORTES_CONSULTAR`, `REPORTES_EXPORTAR`, `PERFILES_ADMINISTRAR`, `PERMISOS_ADMINISTRAR`, `USUARIOS_ADMINISTRAR`, `SOPORTE_TECNICO` y cinco permisos `TARJETAS_*` (`ACTIVAR`, `ASIGNAR`, `CONSULTAR`, `DESACTIVAR`, `RENOVAR`).
- Todos esos 19 permisos y los cinco perfiles leídos están activos. Tras el trabajo P1, `authorization.ts` referencia 14 códigos que ya existen (incluye `ACCESOS_HISTORIAL`, Accesos lectura y permisos granulares de administración) y 9 códigos de escritura propuestos para revisión. Los cinco códigos existentes aún no conectados son `REPORTES_CONSULTAR`, `REPORTES_EXPORTAR`, `SOPORTE_TECNICO`, `TARJETAS_DESACTIVAR` y `TARJETAS_RENOVAR`.
- Los valores de navegación, perfiles y permisos fueron leídos de SQL Server; no se infieren de `navegacion-inicial-revision.sql`.

## Scripts/documentación revisados

- `database/SIGADll.sql`: DDL de referencia; no se ejecutó. Define 82 tablas.
- `docs/navegacion-inicial-revision.sql`: consulta el perfil `ADMIN_GENERAL`; sus INSERT están dentro de comentarios y no se ejecutaron.
- `docs/verificar-primer-administrador.sql`: consultas SELECT; no se ejecutó.
- `docs/crear-primer-administrador.sql`: contiene una transacción de INSERT para uso controlado. No se ejecutó; antes de reutilizarla deben revisarse sus parámetros y reemplazarse los valores de ejemplo, incluido el hash literal, por valores aprobados.
- `docs/propuesta-permisos-navegacion-p1.sql`: propuesta de DML idempotente para los permisos P1 y filas/relaciones de menú. No se ejecutó; el script se detiene por defecto y termina en `ROLLBACK`.
- No se encontró carpeta de migraciones ni otra fuente versionada de DDL. `README.md` § Conexión a SQL Server dice que `SIGADll.sql` “cuando sea incorporado”; esa frase está desactualizada porque el archivo sí existe.

**Límite de verificación:** la conexión SQL Server sí respondió y los metadatos se consultaron en solo lectura. No se validaron pantallas en navegador ni se leyó contenido de tablas de negocio. El nuevo objeto `Migracion.tblCargaBeneficiariosDemo` requiere que el responsable del esquema determine si se incorpora a una migración/DDL de referencia; este diagnóstico no lo modifica.
