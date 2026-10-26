# Dependencias institucionales

La matriz fue contrastada con PROSENE. Estas dependencias requieren recursos, decisiones o servicios que UNAH no ha proporcionado y no deben contarse como incumplimientos del equipo.

| Dependencia | Referencia PROSENE | Evidencia/modelo actual | Recurso requerido | Responsable sugerido |
|---|---|---|---|---|
| Autenticación institucional | P5, VIII–IX; P4, VII | `backend/src/modules/auth/` implementa contexto local | Protocolo, claims, grupos, credenciales y ambiente de prueba | UNAH TI/Seguridad |
| Registro y matrícula académica | P2, IV.i; P5, IX | `Academico.tblMatriculas` existe, sin sincronización | API/extracción oficial, claves, frecuencia y regla de vigencia | Registro/Dirección académica + TI |
| Notificaciones institucionales | No es un módulo detallado del PDF, pero forma parte de servicios institucionales posibles | Tablas de comunicación sin canal | SMTP/API, plantillas y autorización | UNAH TI/Comunicaciones |
| Building Management y dispositivos | P2–3, IV.d; VI Control de acceso | Catálogos y `Operaciones.tblRegistrosAcceso`; no hay fuente de eventos | Protocolo, eventos, identificadores, seguridad, reintentos y ambiente | TI + Infraestructura/BMS |
| Uso por edificio/condición | P3, VI Reportes | Solo se pueden consultar eventos si existen | Datos reales de acceso y relación confiable con edificio/condición | UNAH/BMS |
| Uso irregular/excesivo/fuera de horario | P3, VI Control de acceso | `tblIncidentesAcceso` modelada, sin reglas/eventos | Umbrales, calendario, reglas y eventos BMS | PROSENE + TI/BMS |
| Habilitación de carné UNAH | P7, XII | El PDF exige oficio VOAE y remisión a SEAPI | Proceso, formatos, responsable y confirmación de habilitación | VOAE/PROSENE + SEAPI |
| Perfiles de acceso efectivos | P2, IV.b; P4, VII | Tablas `tblPerfilesAcceso*`, sin publicación externa | Reglas, autorización y mecanismo de sincronización BMS | TI + Infraestructura |
| Servidores, dominio y SSL | P5, VIII–IX | Proyecto preparado para VPS; documento menciona DEGT/dominio institucional | Hosting institucional, DNS, certificados y operación | DEGT/UNAH TI |

## Correos institucionales

Los correos institucionales que respaldan solicitudes de acceso constituyen evidencia de coordinación, pero no sustituyen contratos técnicos, credenciales, documentación de interfaces ni eventos de prueba.

## Puede avanzar sin estas dependencias

- Reportería administrativa sobre datos persistidos.
- Vigencias, historial y exportaciones.
- Alertas internas de vencimientos y solicitudes.
- Gestión documental y auditoría local, sujeto a reglas de privacidad.
- Configuración de roles locales, sujeto a la matriz aprobada.

## Debe esperar recursos institucionales

- Uso real de elevadores y estadísticas por edificio/condición.
- Detección de irregularidades basada en eventos.
- Habilitación efectiva de carnés por SEAPI.
- Sincronización académica y autenticación institucional.
- Operación productiva en infraestructura DEGT/dominio institucional.
