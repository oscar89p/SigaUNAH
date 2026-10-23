# Implementación de Mi Cuenta → Mi Tarjeta

## Resultado de la verificación del modelo

No existe una relación explícita y verificable entre el usuario autenticado y un beneficiario.

### Relaciones confirmadas

- `Seguridad.tblUsuarios` tiene `idUsuario`, datos de cuenta y autenticación, pero no `idPersona` ni `idBeneficiario` (`database/SIGADll.sql`, líneas 1467–1484).
- `Beneficiarios.tblBeneficiarios.idPersona` referencia `Beneficiarios.tblPersonas.idPersona`.
- `Tarjetas.tblAsignaciones.idBeneficiario` referencia `Beneficiarios.tblBeneficiarios.idBeneficiario`.
- `Tarjetas.tblAsignaciones.idTarjeta` referencia `Tarjetas.tblTarjetas.idTarjeta`.
- `Accesos.tblAsignacionesPerfilesAcceso.idAsignacion` referencia `Tarjetas.tblAsignaciones.idAsignacion`.
- `Accesos.tblAsignacionesPerfilesAcceso.idPerfilAcceso` referencia `Accesos.tblPerfilesAcceso.idPerfilAcceso`.
- `Accesos.tblPerfilesAccesoElevadores.idPerfilAcceso` referencia `Accesos.tblPerfilesAcceso.idPerfilAcceso` y `idElevador` referencia `Accesos.tblElevadores.idElevador`.

Las FK de usuario existentes corresponden a sesiones, perfiles, auditoría, aprobaciones, responsables de asignación, integración y organización; ninguna establece la identidad personal del beneficiario.

No se utilizaron coincidencias por nombre, correo, identidad, carné o valores numéricos coincidentes.

## Funcionalidad implementada

Se implementó únicamente la estructura visual segura:

- Ruta Vue: `/mi-cuenta/tarjeta`.
- Vista: `frontend/src/views/MyCardView.vue`.
- Estado informativo de vinculación pendiente.
- Secciones preparadas para tarjeta asignada, accesos autorizados e historial personal.
- No se creó endpoint backend porque no existe una relación segura para resolver el beneficiario desde `auth.idUsuario`.
- No se muestran tarjetas, asignaciones ni datos de demostración.

La vista utiliza la sesión existente solo para mostrar el nombre de la cuenta autenticada; no consulta ni selecciona un beneficiario.

## Propuesta mínima de modelo

Se recomienda una tabla de vínculo explícita, en lugar de unir por coincidencia textual:

```text
Seguridad.tblUsuariosBeneficiarios
- idUsuario bigint NOT NULL FK -> Seguridad.tblUsuarios(idUsuario)
- idBeneficiario bigint NOT NULL FK -> Beneficiarios.tblBeneficiarios(idBeneficiario)
- estadoVinculacion bit NOT NULL DEFAULT 1
- fechaInicio datetime2 NOT NULL
- fechaFin datetime2 NULL
- usuarioRegistro / fechaRegistro
- usuarioActualizacion / fechaActualizacion
```

Reglas recomendadas:

1. Una sola vinculación vigente por usuario mediante índice único filtrado sobre `idUsuario WHERE estadoVinculacion=1`.
2. Decidir explícitamente si un beneficiario puede vincularse a más de un usuario; si no, agregar una restricción única equivalente para el beneficiario vigente.
3. Registrar quién vincula y desvincula, con auditoría.
4. Validar que usuario y beneficiario estén activos.
5. No eliminar físicamente vínculos históricos.
6. Resolver tarjetas solo con `auth.idUsuario -> tblUsuariosBeneficiarios -> tblBeneficiarios -> tblAsignaciones`.

Esta propuesta no se ejecutó y no modifica el esquema actual.

## Archivos modificados

- `frontend/src/router/index.ts` — ruta `/mi-cuenta/tarjeta`.
- `frontend/src/views/MyCardView.vue` — pantalla segura sin datos simulados.

No se modificaron backend, SQL Server, tarjetas, beneficiarios, solicitudes ni TableroUNAH.

## Pruebas y limitaciones

La pantalla no tiene consulta HTTP porque el modelo no permite una autorización segura. Deben ejecutarse typecheck/build frontend tras integrar la vista y validar la ruta con un usuario autenticado cuya navegación `MI_TARJETA` esté activa.

No es posible probar aislamiento de tarjetas personales hasta crear y aprobar la relación explícita usuario-beneficiario. Implementar un endpoint antes de esa vinculación comprometería la seguridad y queda deliberadamente omitido.
