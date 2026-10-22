import { afterEach, describe, expect, it, vi } from "vitest";
import * as database from "../../shared/database/pool.js";
import { findForUser } from "./navegacion.repository.js";

afterEach(() => vi.restoreAllMocks());

describe("navegacion repository", () => {
  it("usa el id de sesión como parámetro y solo consulta asignaciones activas", async () => {
    const input = vi.fn().mockReturnThis();
    const query = vi.fn().mockResolvedValue({ recordset: [] });
    vi.spyOn(database, "getDatabasePool").mockResolvedValue({ request: () => ({ input, query }) } as never);

    await findForUser(42);

    expect(input).toHaveBeenCalledWith("idUsuario", expect.anything(), 42);
    expect(query).toHaveBeenCalledOnce();
    const statement = query.mock.calls[0]?.[0] as string;
    expect(statement).toContain("up.estadoUsuarioPerfil = 1");
    expect(statement).toContain("pn.estadoPerfilNavegacion = 1");
    expect(statement).toContain("pn.permiteVisualizar = 1");
    expect(statement).toContain("n.estadoNavegacion = 1");
    expect(statement).toContain("n.esVisible = 1");
    expect(statement).toContain("@idUsuario");
  });
});
