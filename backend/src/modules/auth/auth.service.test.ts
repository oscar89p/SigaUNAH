import { afterEach, describe, expect, it, vi } from "vitest";
import argon2 from "argon2";
import * as repository from "./auth.repository.js";
import { authenticate, can, csrfMatches, csrfTokenForSession, isSessionValid, login, logout, sessionIdentifier } from "./auth.service.js";
import { canGrantPermissions, canSearchBeneficiariesForSolicitud, isAuthManagedRequest, permissionFor } from "./authorization.js";

afterEach(() => vi.restoreAllMocks());

describe("auth policies", () => {
  it("validates CSRF tokens using a constant-time-safe comparison", () => {
    const token = csrfTokenForSession("session-1");
    expect(csrfMatches("session-1", token)).toBe(true);
    expect(csrfMatches("session-2", token)).toBe(false);
    expect(csrfMatches("session-1", undefined)).toBe(false);
  });

  it("denies administrative routes without an explicit permission", () => {
    expect(permissionFor("/api/v1/campus", "GET")).toBe("ACCESOS_CONSULTAR");
    expect(permissionFor("/api/v1/campus", "POST")).toBe("CAMPUS_ADMINISTRAR");
    expect(permissionFor("/api/v1/edificios/1", "PUT")).toBe("EDIFICIOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/elevadores/1/estado", "PATCH")).toBe("ELEVADORES_ADMINISTRAR");
    expect(permissionFor("/api/v1/dispositivos/1/estado", "PATCH")).toBe("DISPOSITIVOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/solicitudes", "GET")).toBe("SOLICITUDES_CONSULTAR");
    expect(permissionFor("/api/v1/solicitudes", "POST")).toBe("SOLICITUDES_REGISTRAR");
    expect(permissionFor("/api/v1/solicitudes/1", "PUT")).toBe("SOLICITUDES_MODIFICAR");
    expect(permissionFor("/api/v1/solicitudes/1/estado", "PATCH")).toBe("SOLICITUDES_GESTIONAR");
    expect(permissionFor("/api/v1/operaciones/monitoreo/accesos", "GET")).toBe("ACCESOS_HISTORIAL");
    expect(permissionFor("/api/v1/operaciones/monitoreo/incidentes", "POST")).toBeNull();
    expect(permissionFor("/api/v1/reportes/resumen", "GET")).toBe("REPORTES_CONSULTAR");
    expect(permissionFor("/api/v1/reportes/opciones", "GET")).toBe("REPORTES_CONSULTAR");
    expect(permissionFor("/api/v1/reportes/exportar", "GET")).toBe("REPORTES_EXPORTAR");
    expect(permissionFor("/api/v1/inexistente", "GET")).toBeNull();
    expect(permissionFor("/api/v1/beneficiarios", "GET")).toBe("BENEFICIARIOS_CONSULTAR");
  });

  it("authorizes only explicit database permissions", () => {
    const context = { idUsuario: 1, nombreAcceso: "u", nombreUsuario: "U", perfiles: [], permisos: ["TARJETAS_CONSULTAR"] };
    expect(can(context, "TARJETAS_CONSULTAR")).toBe(true);
    expect(can(context, "USUARIOS_ADMINISTRAR")).toBe(false);
    const accessReader = { ...context, permisos: ["ACCESOS_CONSULTAR"] };
    expect(can(accessReader, permissionFor("/api/v1/campus", "GET")!)).toBe(true);
    expect(can(accessReader, permissionFor("/api/v1/campus", "POST")!)).toBe(false);
  });

  it("allows masked beneficiary lookup only inside request capture permissions", () => {
    expect(canSearchBeneficiariesForSolicitud("/api/v1/beneficiarios/busqueda", "GET", ["SOLICITUDES_REGISTRAR"])).toBe(true);
    expect(canSearchBeneficiariesForSolicitud("/api/v1/beneficiarios/busqueda", "GET", ["SOLICITUDES_MODIFICAR"])).toBe(true);
    expect(canSearchBeneficiariesForSolicitud("/api/v1/beneficiarios/busqueda", "GET", ["BENEFICIARIOS_CONSULTAR"])).toBe(false);
    expect(canSearchBeneficiariesForSolicitud("/api/v1/beneficiarios", "GET", ["SOLICITUDES_REGISTRAR"])).toBe(false);
  });

  it("prevents granting permissions the actor does not possess", () => {
    expect(canGrantPermissions(["USUARIOS_ADMINISTRAR"], ["USUARIOS_ADMINISTRAR"])).toBe(true);
    expect(canGrantPermissions(["USUARIOS_ADMINISTRAR", "TARJETAS_ASIGNAR"], ["USUARIOS_ADMINISTRAR"])).toBe(false);
    expect(canGrantPermissions([], [])).toBe(true);
  });

  it("maps administrative resources to their specific existing permissions", () => {
    expect(permissionFor("/api/v1/seguridad/usuarios", "GET")).toBe("USUARIOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/usuarios/1", "PUT")).toBe("USUARIOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/perfiles", "GET")).toBe("USUARIOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/perfiles", "GET")).toBe("PERFILES_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/perfiles/1/permisos", "PUT")).toBe("PERFILES_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/permisos", "GET")).toBe("PERMISOS_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/navegaciones", "POST")).toBe("NAVEGACION_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/configuracion", "GET")).toBe("CONFIGURACION_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/configuracion/catalogos", "POST")).toBe("CONFIGURACION_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/configuracion/catalogos/1/estado", "PATCH")).toBe("CONFIGURACION_ADMINISTRAR");
    expect(permissionFor("/api/v1/seguridad/admin/auditoria", "GET")).toBe("AUDITORIA_CONSULTAR");
    expect(permissionFor("/api/v1/seguridad/admin/auditoria", "PUT")).toBeNull();
    expect(permissionFor("/api/v1/seguridad/admin/perfiles", "DELETE")).toBeNull();
  });

  it("routes auth endpoints around global RBAC only when their handlers enforce session and CSRF", () => {
    expect(isAuthManagedRequest("/api/v1/auth/logout", "POST")).toBe(true);
    expect(isAuthManagedRequest("/api/v1/auth/logout?source=menu", "POST")).toBe(true);
    expect(isAuthManagedRequest("/api/v1/auth/me", "GET")).toBe(true);
    expect(isAuthManagedRequest("/api/v1/usuarios/mi-informacion", "GET")).toBe(true);
    expect(isAuthManagedRequest("/api/v1/auth/logout", "GET")).toBe(false);
    expect(isAuthManagedRequest("/api/v1/auth/me", "POST")).toBe(false);
    expect(permissionFor("/api/v1/auth/logout", "POST")).toBeNull();
  });

  it("rejects requests without a session", async () => {
    await expect(authenticate(undefined)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("does not throw when the HTTP headers context is absent", async () => {
    vi.spyOn(repository, "findUser").mockResolvedValue(undefined);
    const recordAttempt = vi.spyOn(repository, "recordAttempt").mockResolvedValue(undefined);

    await expect(login(
      { usuario: "usuario-prueba", password: "password-prueba" },
      { ip: "127.0.0.1", headers: undefined, setCookie: vi.fn() }
    )).rejects.toMatchObject({ statusCode: 401 });

    expect(recordAttempt).toHaveBeenCalledOnce();
  });

  it("logs in with a local account and persists the session", async () => {
    const passwordHash = await argon2.hash("ClaveSegura123");
    vi.spyOn(repository, "findUser").mockResolvedValue({
      idUsuario: 7, nombreUsuario: "Usuario Prueba", nombreAcceso: "prueba", claveHash: passwordHash,
      tipoAutenticacion: "LOCAL", intentosFallidos: 0, fechaBloqueo: null, estadoUsuario: true
    });
    const createSession = vi.spyOn(repository, "createSession").mockResolvedValue(undefined);
    vi.spyOn(repository, "loadAccess").mockResolvedValue([{ codigoPerfil: "LECTOR", codigoPermiso: "PRUEBA_CONSULTAR" }]);
    vi.spyOn(repository, "registerSuccess").mockResolvedValue(undefined);
    vi.spyOn(repository, "recordAttempt").mockResolvedValue(undefined);
    const setCookie = vi.fn();

    const result = await login({ usuario: "prueba", password: "ClaveSegura123" }, { setCookie, headers: {} });

    expect(result.authenticated).toBe(true);
    expect(result.user.username).toBe("prueba");
    expect(result.csrfToken).toBeTruthy();
    expect(setCookie).toHaveBeenCalledOnce();
    expect(createSession).toHaveBeenCalledOnce();
  });

  it("invalidates a persisted session on logout and rejects it afterwards", async () => {
    let sessionActive = true;
    const session = {
      idSesionUsuario: 3, idUsuario: 7, fechaInicio: new Date(Date.now() - 1_000),
      fechaExpiracion: new Date(Date.now() + 60_000), nombreUsuario: "Usuario Prueba",
      nombreAcceso: "prueba", estadoUsuario: true
    };
    vi.spyOn(repository, "findSession").mockImplementation(async () => sessionActive ? session : undefined);
    vi.spyOn(repository, "touchSession").mockResolvedValue(undefined);
    vi.spyOn(repository, "loadAccess").mockResolvedValue([]);
    const closeSession = vi.spyOn(repository, "closeSession").mockImplementation(async () => { sessionActive = false; });

    await authenticate("session-activa");
    await logout("session-activa");

    expect(closeSession).toHaveBeenCalledWith(sessionIdentifier("session-activa"));
    await expect(authenticate("session-activa")).rejects.toMatchObject({ statusCode: 401 });
  });

  it("enforces idle and absolute session limits", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    expect(isSessionValid(start, new Date("2026-01-01T00:29:00Z"), new Date("2026-01-01T00:20:00Z").getTime())).toBe(true);
    expect(isSessionValid(start, new Date("2026-01-01T00:01:00Z"), new Date("2026-01-01T00:02:00Z").getTime())).toBe(false);
    expect(isSessionValid(start, new Date("2026-01-01T08:01:00Z"), new Date("2026-01-01T08:00:01Z").getTime())).toBe(false);
  });
});
