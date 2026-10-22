import { afterEach, describe, expect, it, vi } from "vitest";
import * as repository from "./usuarios.repository.js";
import { list, update } from "./usuarios.service.js";

afterEach(() => vi.restoreAllMocks());

describe("user service", () => {
  it("returns the paginated response shape expected by the users screen", async () => {
    vi.spyOn(repository, "list").mockResolvedValue({
      items: [{ idUsuario: "1" } as never], total: 21
    });

    const response = await list({
      page: 2, pageSize: 10, estado: "all", sortBy: "nombreUsuario", sortDirection: "asc"
    });

    expect(response).toEqual({
      items: [{ idUsuario: "1" }],
      pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 }
    });
  });

  it("does not set local passwords on non-local authentication accounts", async () => {
    vi.spyOn(repository, "find").mockResolvedValue({
      idUsuario: "55", nombreUsuario: "Institucional", correoElectronico: "u@unah.edu.hn", nombreAcceso: "u",
      identificadorInstitucional: "55", tipoAutenticacion: "INSTITUCIONAL", estadoUsuario: true,
      ultimoAcceso: null, fechaRegistro: new Date(), usuarioRegistro: "admin", usuarioActualizacion: null,
      fechaActualizacion: null, perfiles: []
    });
    const updateSpy = vi.spyOn(repository, "update");

    await expect(update(55n, {
      nombreUsuario: "Institucional", correoElectronico: "u@unah.edu.hn", nombreAcceso: "u",
      identificadorInstitucional: "55", profileIds: [1], password: "ClaveSegura123"
    }, { actorId: 1, actorName: "admin" })).rejects.toMatchObject({ statusCode: 400 });
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
