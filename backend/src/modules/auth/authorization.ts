/** Existing catalog codes suitable for the current permission-management UI. */
export const permissionCatalogCodes = [
  "BENEFICIARIOS_CONSULTAR", "BENEFICIARIOS_REGISTRAR", "BENEFICIARIOS_VALIDAR", "BENEFICIARIOS_MODIFICAR",
  "TARJETAS_CONSULTAR", "TARJETAS_ACTIVAR", "TARJETAS_ASIGNAR", "TARJETAS_DESACTIVAR", "TARJETAS_RENOVAR", "ACCESOS_CONSULTAR", "ACCESOS_HISTORIAL",
  "USUARIOS_ADMINISTRAR", "PERFILES_ADMINISTRAR", "PERMISOS_ADMINISTRAR", "CONFIGURACION_ADMINISTRAR", "AUDITORIA_CONSULTAR", "REPORTES_CONSULTAR", "REPORTES_EXPORTAR"
] as const;

/** Codes bound to implemented handlers. Several P1 write codes are proposed but not yet provisioned in SQL. */
export const backendPermissionCodes = [
  ...permissionCatalogCodes,
  "CAMPUS_ADMINISTRAR", "EDIFICIOS_ADMINISTRAR", "ELEVADORES_ADMINISTRAR", "DISPOSITIVOS_ADMINISTRAR",
  "SOLICITUDES_CONSULTAR", "SOLICITUDES_REGISTRAR", "SOLICITUDES_MODIFICAR", "SOLICITUDES_GESTIONAR",
  "NAVEGACION_ADMINISTRAR"
] as const;

export function canGrantPermissions(grantedPermissions: string[], actorPermissions: string[]): boolean {
  const actorSet = new Set(actorPermissions);
  return grantedPermissions.every(permission => actorSet.has(permission));
}

export function permissionFor(url: string, method: string): string | null {
  const path = url.split("?", 1)[0] ?? "";
  if (isResource(path, "/api/v1/campus")) return method === "GET" ? "ACCESOS_CONSULTAR" : isWriteMethod(method) ? "CAMPUS_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/edificios")) return method === "GET" ? "ACCESOS_CONSULTAR" : isWriteMethod(method) ? "EDIFICIOS_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/elevadores")) return method === "GET" ? "ACCESOS_CONSULTAR" : isWriteMethod(method) ? "ELEVADORES_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/dispositivos")) return method === "GET" ? "ACCESOS_CONSULTAR" : isWriteMethod(method) ? "DISPOSITIVOS_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/solicitudes")) {
    return method === "GET" ? "SOLICITUDES_CONSULTAR"
      : method === "POST" ? "SOLICITUDES_REGISTRAR"
        : method === "PUT" ? "SOLICITUDES_MODIFICAR"
          : method === "PATCH" ? "SOLICITUDES_GESTIONAR" : null;
  }
  if (isResource(path, "/api/v1/operaciones/monitoreo")) return method === "GET" ? "ACCESOS_HISTORIAL" : null;
  if (path === "/api/v1/reportes/exportar" || (isResource(path, "/api/v1/reportes") && path.endsWith("/exportar"))) return method === "GET" ? "REPORTES_EXPORTAR" : null;
  if (isResource(path, "/api/v1/reportes")) return method === "GET" ? "REPORTES_CONSULTAR" : null;
  if (isResource(path, "/api/v1/beneficiarios")) {
    return method === "GET" ? "BENEFICIARIOS_CONSULTAR"
      : method === "POST" ? "BENEFICIARIOS_REGISTRAR"
        : method === "PATCH" ? "BENEFICIARIOS_VALIDAR"
          : method === "PUT" ? "BENEFICIARIOS_MODIFICAR" : null;
  }
  if (isResource(path, "/api/v1/tarjetas")) {
    if (path.endsWith("/bloqueo") || path.endsWith("/baja")) return method === "POST" ? "TARJETAS_DESACTIVAR" : null;
    if (path.endsWith("/desbloqueo")) return method === "POST" ? "TARJETAS_ACTIVAR" : null;
    if (path.endsWith("/devolucion")) return method === "PATCH" ? "TARJETAS_DESACTIVAR" : null;
    if (path.endsWith("/renovacion")) return method === "POST" ? "TARJETAS_RENOVAR" : null;
    if (path.endsWith("/asignaciones") || path.endsWith("/reemplazo")) return method === "GET" ? "TARJETAS_CONSULTAR" : "TARJETAS_ASIGNAR";
    return method === "GET" ? "TARJETAS_CONSULTAR"
      : method === "PATCH" ? "TARJETAS_ACTIVAR"
        : method === "POST" || method === "PUT" ? "TARJETAS_ASIGNAR" : null;
  }
  if (isResource(path, "/api/v1/seguridad/admin/perfiles")) return isAdminMethod(method) ? "PERFILES_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/seguridad/admin/permisos")) return isAdminMethod(method) ? "PERMISOS_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/seguridad/admin/navegaciones")) return isAdminMethod(method) ? "NAVEGACION_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/seguridad/admin/configuracion")) return ["GET", "POST", "PUT", "PATCH"].includes(method) ? "CONFIGURACION_ADMINISTRAR" : null;
  if (isResource(path, "/api/v1/seguridad/admin/auditoria")) return method === "GET" ? "AUDITORIA_CONSULTAR" : null;
  if (isResource(path, "/api/v1/seguridad/usuarios") || isResource(path, "/api/v1/seguridad/perfiles")) {
    return method === "GET" || method === "POST" || method === "PUT" || method === "PATCH"
      ? "USUARIOS_ADMINISTRAR" : null;
  }
  return path.startsWith("/api/v1/") ? null : null;
}

/** The masked beneficiary search is also a dependency of the request capture flow.
 * It does not grant access to the beneficiary administration endpoints. */
export function canSearchBeneficiariesForSolicitud(url: string, method: string, permissions: string[]): boolean {
  const path = url.split("?", 1)[0] ?? "";
  return path === "/api/v1/beneficiarios/busqueda" && method === "GET" && ["SOLICITUDES_CONSULTAR", "SOLICITUDES_REGISTRAR", "SOLICITUDES_MODIFICAR"].some(permission => permissions.includes(permission));
}

function isWriteMethod(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH";
}

function isAdminMethod(method: string): boolean {
  return method === "GET" || isWriteMethod(method);
}

/** These auth endpoints validate their session and (for writes) CSRF in their own handlers. */
export function isAuthManagedRequest(url: string, method: string): boolean {
  const path = url.split("?", 1)[0] ?? "";
  return (path === "/api/v1/auth/logout" && method === "POST") || (path === "/api/v1/auth/me" && method === "GET") || (path === "/api/v1/usuarios/mi-informacion" && method === "GET");
}

function isResource(path: string, resource: string): boolean {
  return path === resource || path.startsWith(`${resource}/`);
}
