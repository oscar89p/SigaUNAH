# Matriz de cumplimiento PROSENE

**Documento rector revisado:** `Requerimiento Unah - Prosene.pdf` (raíz del repositorio).  
**Revisión:** 26 de octubre de 2026.  
**Método:** se revisaron las 7 páginas escaneadas. La matriz ya fue contrastada con el documento original de PROSENE y conserva los hallazgos técnicos de la auditoría anterior.

## Método y alcance del cálculo

Se descompuso el documento en **54 requisitos funcionales atómicos** de las secciones IV, V, VI, VII y XII. No se contaron como requisitos independientes la justificación, costos, duración del proyecto ni actividades de gestión de la sección X. La infraestructura, responsables y supuestos de las secciones VIII–IX se registran como dependencias/condiciones, no como funcionalidad implementada.

La evidencia se obtuvo por inspección estática de backend, frontend, SQL y pruebas existentes. `IMPLEMENTADO` significa que existe flujo técnico identificable; no significa validación productiva. La ausencia de prueba end-to-end, datos institucionales o permisos provisionados se refleja en `PARCIAL` o `NO VERIFICABLE` cuando impide confirmar el alcance.

### Resultado cuantitativo

| Estado | Cantidad | Porcentaje del total |
|---|---:|---:|
| IMPLEMENTADO | 19 | 35.2 % |
| PARCIAL | 17 | 31.5 % |
| PENDIENTE | 8 | 14.8 % |
| DEPENDENCIA EXTERNA | 10 | 18.5 % |
| **Total** | **54** | **100 %** |

- **Cumplimiento técnico del alcance total:** `19 / 54 = 35.2 %`. Solo se cuentan requisitos `IMPLEMENTADO`; los parciales no se redondean a completos.
- **Cumplimiento técnico del alcance ejecutable sin dependencias externas:** `19 / 44 = 43.2 %`, excluyendo los 10 requisitos clasificados `DEPENDENCIA EXTERNA`.
- **Requerimientos pendientes por dependencia institucional:** 10 de 54 (18.5 %). Esto no se atribuye al equipo de desarrollo.
- Estos porcentajes son de inspección técnica, no de aceptación funcional ni producción.

## Matriz trazable

| ID | Página/sección PROSENE | Funcionalidad solicitada | Evidencia SIGA | Estado | Brecha / dependencia | Prioridad |
|---:|---|---|---|---|---|---|
| 1 | 1, IV.a | Registrar beneficiarios | `backend/src/modules/beneficiarios/`; `BeneficiariosView.vue`; `/api/v1/beneficiarios` | IMPLEMENTADO | Falta validación funcional productiva con sesión institucional. | P1 |
| 2 | 1, IV.a | Validar beneficiarios | Tipos/condiciones en `beneficiarios`; transacciones y permisos del módulo | PARCIAL | No hay evidencia de aprobación integral ni validación end-to-end. | P1 |
| 3 | 2, IV.b | Asignación digital de tarjetas | `/api/v1/tarjetas/asignaciones`; `Tarjetas.tblAsignaciones`; `AsignarTarjetaModal.vue` | IMPLEMENTADO | La operación técnica existe; su activación física no está demostrada. | P1 |
| 4 | 2, IV.b | Activar y registrar la tarjeta en el sistema | `tarjetas.routes.ts`; `tblTarjetas`; gestión administrativa | PARCIAL | Activa/desactiva estado local; no hay integración que active el lector/BMS. | P1 / externa |
| 5 | 2, IV.c | Control de vigencia permanente o temporal | Fechas/tipo de vigencia en `tblAsignaciones`; `GestionTarjetaView.vue` | IMPLEMENTADO | Falta prueba de casos límite y reglas institucionales. | P1 |
| 6 | 2, IV.d | Monitorear uso mediante registros de acceso | `Operaciones.tblRegistrosAcceso`; `/api/v1/operaciones/monitoreo/accesos` | DEPENDENCIA EXTERNA | Requiere eventos reales de dispositivos/Building Management. | Externa |
| 7 | 2, IV.e | Bloquear o suspender tarjetas | Bloqueo/desbloqueo en `tarjetas.service.ts`; `GestionTarjetaView.vue` | IMPLEMENTADO | No prueba integración con controladores externos. | P1 / externa |
| 8 | 2, IV.f | Generar reportes estadísticos | `/api/v1/reportes/resumen`; `ReportsView.vue` | PARCIAL | Solo resumen agregado y CSV; faltan reportes PROSENE completos. | P1 |
| 9 | 2, IV.g | Alertas automáticas por vencimiento | No se localizó módulo/ruta/vista de alertas | PENDIENTE | Requiere reglas, bandeja y deduplicación; no necesariamente servicio externo. | P1 |
| 10 | 2, IV.h | Historial individual de uso | Historial de tarjeta (`/tarjetas/:id/historial`) | PARCIAL | Es historial de asignaciones, no historial de uso real; este último depende de eventos. | P1 / externa |
| 11 | 2, IV.i | Integración con matrícula/registro | Tablas académicas en `database/SIGADll.sql`, sin sincronizador | DEPENDENCIA EXTERNA | UNAH no proporcionó API, extracción ni contrato de datos. | Externa |
| 12 | 2, V Datos generales | Nombre completo | `Beneficiarios.tblPersonas`; formulario de beneficiarios | IMPLEMENTADO | Validación técnica localizada; aceptación funcional pendiente. | P1 |
| 13 | 2, V Datos generales | Número de cuenta | `tblBeneficiarios.numeroCuenta`; servicios y vistas de beneficiarios | IMPLEMENTADO | La fuente institucional todavía no está sincronizada. | P1 / externa |
| 14 | 2, V Datos generales | Carrera | `Academico.tblCarreras`; opciones de beneficiario | IMPLEMENTADO | Solo catálogo local/indirecto; no matrícula oficial. | P1 / externa |
| 15 | 2, V Datos generales | Nivel académico (pregrado/posgrado) | Campo/catálogo académico modelado parcialmente | PARCIAL | No se verificó flujo completo de captura/actualización del nivel en beneficiario. | P2 |
| 16 | 2, V Datos generales | Correo institucional | Campo `correoInstitucional` en tipos/beneficiario | IMPLEMENTADO | No prueba correo institucional real ni notificación. | P1 / externa |
| 17 | 2, V Datos generales | Teléfono | Persona/beneficiario y formulario existente | PARCIAL | No se verificó evidencia suficiente del campo en todo el flujo. | P2 |
| 18 | 2, V Tarjeta | Código/número de tarjeta | `Tarjetas.tblTarjetas.codigoTarjeta`; CRUD y vista de tarjetas | IMPLEMENTADO | No equivale a habilitación física. | P1 |
| 19 | 2, V Tarjeta | Tipo temporal o permanente | `idTipoTarjeta`/tipos de vigencia y opciones | IMPLEMENTADO | Confirmar catálogo institucional. | P1 |
| 20 | 2, V Tarjeta | Fecha de entrega | `tblAsignaciones.fechaAsignacion` y vista de gestión | IMPLEMENTADO | Falta validar nomenclatura exacta con PROSENE. | P1 |
| 21 | 2, V Tarjeta | Fecha de devolución | `fechaDevolucion`; devolución de asignación | IMPLEMENTADO | No se ejecutó prueba end-to-end. | P1 |
| 22 | 2, V Tarjeta | Estados activa, suspendida, retornada, extraviada y dañada | Catálogos de estado de tarjeta/asignación | PARCIAL | Existen estados, pero no se verificó correspondencia completa con todos los valores del PDF. | P1 |
| 23 | 3, V Categoría | Discapacidad visual, auditiva, intelectual, física u otra | Condiciones y catálogos en `tblBeneficiariosCondiciones`/`Tipos` | PARCIAL | Falta comprobar que todos los valores estén provisionados y reportables. | P1 |
| 24 | 3, V Categoría | Embarazo | Mismo módulo de condiciones | PARCIAL | Falta catálogo/flujo probado con datos institucionales. | P1 |
| 25 | 3, V Categoría | Adulto mayor | Mismo módulo de condiciones | PARCIAL | Falta catálogo/flujo probado con datos institucionales. | P1 |
| 26 | 3, V Categoría | Condición médica especificada | Condiciones con descripción y fechas | PARCIAL | Falta respaldo documental y validación de privacidad. | P1 |
| 27 | 3, V Documento de respaldo | Constancia/certificación médica | Tablas de documentos existentes, sin API/vista de carga | PENDIENTE | Implementar gestión documental y permisos; no modificar esquema ahora. | P1 |
| 28 | 3, V Documento de respaldo | Formulario/hoja de compromiso | No se localizó flujo de documentos asociado | PENDIENTE | Requiere tipo documental, carga, consulta y trazabilidad. | P1 |
| 29 | 3, V Documento de respaldo | Observación | Campos de observación existen en algunas entidades | PENDIENTE | No hay expediente documental completo que la vincule al respaldo. | P1 |
| 30 | 3, VI Registro y validación | Ingreso de datos personales | Beneficiarios + personas CRUD | IMPLEMENTADO | Pendiente prueba visual/autenticada. | P1 |
| 31 | 3, VI Registro y validación | Carga de documentación médica | No hay endpoint/frontend de documentos | PENDIENTE | Depende de almacenamiento y política institucional, no de integración BMS. | P1 |
| 32 | 3, VI Registro y validación | Clasificar condición permanente/temporal | `Beneficiarios.tblBeneficiariosCondiciones`; CRUD de condiciones | IMPLEMENTADO | Debe confirmarse catálogo y regla de fechas. | P1 |
| 33 | 3, VI Registro y validación | Aprobación por PROSENE | Transiciones de solicitudes y aprobaciones modeladas | PARCIAL | Falta flujo explícito/rol PROSENE y prueba de estados de aprobación. | P1 |
| 34 | 3, VI Gestión de tarjetas | Asignación de número de tarjeta | Alta de `tblTarjetas` y asignación | IMPLEMENTADO | Registro técnico, no impresión/habilitación física. | P1 |
| 35 | 3, VI Gestión de tarjetas | Activación/desactivación | Estados administrativos, bloqueo/desbloqueo/baja | IMPLEMENTADO | La efectividad en lectores externos depende de BMS. | P1 / externa |
| 36 | 3, VI Gestión de tarjetas | Renovación automática o manual | `POST /api/v1/tarjetas/asignaciones/:id/renovacion` | IMPLEMENTADO | Renovación automática programada no está demostrada; manual sí está modelada. | P1 |
| 37 | 3, VI Gestión de tarjetas | Historial de movimientos | Historial de asignación y estados; `GestionTarjetaView.vue` | IMPLEMENTADO | Falta cobertura funcional de todas las transiciones. | P1 |
| 38 | 3, VI Control de acceso | Registro automático de uso por edificio | Registros de acceso y relaciones edificio/elevador | DEPENDENCIA EXTERNA | Requiere eventos de dispositivos/BMS y mapeo confiable a edificio. | Externa |
| 39 | 3, VI Control de acceso | Fecha y hora de acceso | `tblRegistrosAcceso.fechaHoraAcceso` y monitoreo | DEPENDENCIA EXTERNA | El campo existe, pero UNAH no proporcionó eventos de origen. | Externa |
| 40 | 3, VI Control de acceso | Detección de uso irregular | `tblIncidentesAcceso` modelada; consulta de incidentes | DEPENDENCIA EXTERNA | Faltan eventos, reglas de irregularidad y definición institucional. | Externa |
| 41 | 3, VI Control de acceso | Alertas por uso excesivo/fuera de horario | No existe regla/bandeja; depende de eventos | DEPENDENCIA EXTERNA | Requiere datos BMS y umbrales aprobados; la bandeja interna puede desarrollarse después. | Externa |
| 42 | 3, VI Reportes | Número de beneficiarios activos | Resumen con filtro `estado` en `reportes.repository.ts` | PARCIAL | Falta reporte dedicado y evidencia de ejecución contra datos reales. | P1 |
| 43 | 3, VI Reportes | Uso por edificio | Conteos de infraestructura, no uso | DEPENDENCIA EXTERNA | Requiere registros de acceso reales por edificio. | Externa |
| 44 | 3, VI Reportes | Uso por tipo de condición | Condiciones modeladas; no eventos agregados por condición | DEPENDENCIA EXTERNA | Requiere unión con uso real y datos BMS. | Externa |
| 45 | 3, VI Reportes | Descarga PDF/Excel | Exportador actual `text/csv`; botón “Exportar CSV” | PENDIENTE | Faltan formatos PDF y XLSX, con permisos y pruebas de contenido. | P1 |
| 46 | 3–4, VI Administrativo | Gestión de usuarios | `seguridad/usuarios`; `UsersView.vue`; RBAC | IMPLEMENTADO | Validación funcional por perfiles reales pendiente. | P1 |
| 47 | 4, VI Administrativo | Configuración de parámetros | `ConfigurationView.vue`, catálogos/períodos parciales | PENDIENTE | No se verificó administración completa de parámetros del documento. | P2 |
| 48 | 4, VI Administrativo | Bitácora de auditoría | `AuditView.vue`; `Auditoria.tblBitacoras` e intentos | PARCIAL | La vista advierte que no todos los eventos de negocio están instrumentados. | P1 |
| 49 | 4, VII Roles | Administrador general/PROSENE con acceso total | Perfiles, permisos y navegación administrables | PARCIAL | RBAC existe, pero la asignación efectiva y prueba de “total” no están verificadas. | P1 |
| 50 | 4, VII Roles | Rol PROSENE para validar solicitudes y autorizar tarjetas | Solicitudes/tarjetas y permisos separados | PARCIAL | Falta perfil PROSENE configurado y flujo de autorización probado. | P1 |
| 51 | 4, VII Roles | Mantenimiento consulta tarjetas y reportes de uso | Permisos de reportes/tarjetas; uso depende de BMS | DEPENDENCIA EXTERNA | Reportes de uso requieren eventos externos y mapa de roles institucional. | Externa |
| 52 | 4, VII Roles | Beneficiario consulta vigencia/estado propio | `MyCardView.vue` existe, pero documenta falta de vínculo usuario-beneficiario | PARCIAL | Falta relación verificable usuario-beneficiario y consulta personal completa. | P1 |
| 53 | 4, VII Roles | Soporte técnico con acceso limitado de mantenimiento | RBAC genérico disponible | PENDIENTE | Falta perfil/permisos específicos y matriz de alcance del rol. | P2 |
| 54 | 7, XII | Proceso especial para estudiantes con carné UNAH: oficio VOAE, respaldos y habilitación SEAPI | No se localizó módulo/workflow de oficio, F03, copia de carné ni integración SEAPI | DEPENDENCIA EXTERNA | SIGA podría registrar expediente, pero la habilitación la realiza SEAPI y requiere proceso institucional. | P1 / externa |

## Condiciones de infraestructura del documento

Las páginas 5–6 describen servidores institucionales/DEGT, dominio, SSL, conexión a matrícula/usuarios, permisos institucionales y un piloto. Son condiciones de despliegue y operación, no requisitos funcionales adicionales. Se mantienen en `05_DEPENDENCIAS_INSTITUCIONALES.md`; no se cuentan en los 54 para evitar inflar el porcentaje.

## Conclusión

La matriz fue contrastada con las siete páginas originales. La prioridad de cierre es reportería administrativa basada en datos persistidos, seguida de vigencias/historial, PDF/XLSX y alertas internas. Uso real, habilitación física y sincronización académica permanecen condicionados a UNAH/terceros.
