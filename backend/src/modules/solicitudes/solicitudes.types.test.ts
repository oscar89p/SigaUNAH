import { describe, expect, it } from "vitest";
import { createSchema, querySchema, stateSchema, updateSchema } from "./solicitudes.types.js";

const fields = {
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

  it("does not accept a client-provided initial state", () => {
    expect(createSchema.parse({ ...fields, idEstadoSolicitud: 4, usuarioRegistro: "tester" })).not.toHaveProperty("idEstadoSolicitud");
    expect(updateSchema.parse({ ...fields, idEstadoSolicitud: 99, usuarioActualizacion: "tester" })).not.toHaveProperty("idEstadoSolicitud");
  });

  it("does not accept a client-provided request number", () => {
    expect(createSchema.parse({ ...fields, codigoSolicitud: "ARBITRARIO", idEstadoSolicitud: 4, usuarioRegistro: "tester" })).not.toHaveProperty("codigoSolicitud");
  });

  it("uses catalog codes for approval and rejection transitions", () => {
    expect(stateSchema.parse({ codigoEstadoSolicitudNuevo: "APROBADA", usuarioRegistro: "tester", usuarioActualizacion: "tester" }).codigoEstadoSolicitudNuevo).toBe("APROBADA");
    expect(stateSchema.safeParse({ idEstadoSolicitudNuevo: 12, usuarioRegistro: "tester", usuarioActualizacion: "tester" }).success).toBe(false);
  });

  it("rejects a requested end date before its start date", () => {
    const result = createSchema.safeParse({
      ...fields,
            fechaInicioSolicitada: "2026-06-02",
      fechaFinSolicitada: "2026-06-01",
      usuarioRegistro: "tester"
    });
    expect(result.success).toBe(false);
  });
});
