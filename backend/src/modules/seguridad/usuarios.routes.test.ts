import Fastify from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as service from "./usuarios.service.js";
import { usuariosRoutes } from "./usuarios.routes.js";

describe("self-service user information", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the authenticated user id and ignores a supplied idUsuario", async () => {
    const app = Fastify();
    app.addHook("preHandler", async request => {
      (request as { auth?: unknown }).auth = { idUsuario: 7, nombreAcceso: "prueba", nombreUsuario: "Usuario", perfiles: [], permisos: [] };
    });
    const ownInfo = vi.spyOn(service, "getPersonalInformation").mockResolvedValue({
      nombreUsuario: "Usuario", correoElectronico: "usuario@unah.edu.hn", nombreAcceso: "prueba",
      identificadorInstitucional: "U-7", tipoAutenticacion: "LOCAL", estadoUsuario: true, ultimoAcceso: null
    });
    await app.register(usuariosRoutes);
    const response = await app.inject({ method: "GET", url: "/api/v1/usuarios/mi-informacion?idUsuario=99" });
    expect(response.statusCode).toBe(200);
    expect(ownInfo).toHaveBeenCalledWith(7);
    expect(ownInfo).not.toHaveBeenCalledWith(99);
    expect(response.json()).not.toHaveProperty("claveHash");
    await app.close();
  });
});
