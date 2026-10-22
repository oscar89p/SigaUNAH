import { describe, expect, it } from "vitest";
import { createSchema, querySchema, updateSchema } from "./solicitudes.types.js";

const fields = {
  codigoSolicitud: "SOL-1",
  idBeneficiario: 1,
  idPeriodoAcademico: null,
  idTipoSolicitud: null,
  idTipoVigencia: 2,
  fechaInicioSolicitada: null,
  fechaFinSolicitada: null,
  motivoSolicitud: null,
  origenSolicitud: "BACKOFFICE"
};

describe("solicitudes contracts", () => {
  it("filters list queries by a positive state id and bounds pagination", () => {
    expect(querySchema.parse({}).pageSize).toBe(10);
    expect(querySchema.parse({ idEstadoSolicitud: "3" }).idEstadoSolicitud).toBe(3);
    expect(querySchema.safeParse({ idEstadoSolicitud: 0 }).success).toBe(false);
    expect(querySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it("requires a state when creating but strips it from PUT updates so transitions use the audited PATCH", () => {
    expect(createSchema.parse({ ...fields, idEstadoSolicitud: 4, usuarioRegistro: "tester" }).idEstadoSolicitud).toBe(4);
    const update = updateSchema.parse({ ...fields, idEstadoSolicitud: 99, usuarioActualizacion: "tester" });
    expect(update).not.toHaveProperty("idEstadoSolicitud");
  });

  it("rejects a requested end date before its start date", () => {
    const result = createSchema.safeParse({
      ...fields,
      idEstadoSolicitud: 4,
      fechaInicioSolicitada: "2026-06-02",
      fechaFinSolicitada: "2026-06-01",
      usuarioRegistro: "tester"
    });
    expect(result.success).toBe(false);
  });
});
