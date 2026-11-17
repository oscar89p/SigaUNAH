import { describe, expect, it } from "vitest";
import { institutionalEmailSchema, validateInstitutionalEmail } from "./institutional-email.js";
import { createSchema, updateSchema } from "./beneficiarios.types.js";

describe("institutional email validation", () => {
  it.each(["persona@unah.hn", " PERSONA@UNAH.HN "])('accepts valid email "%s"', value => expect(institutionalEmailSchema.parse(value)).toBe("persona@unah.hn"));
  it.each(["", "persona", "persona@", "persona@unah", "persona@unah.hn\n", "persona\u0007@unah.hn"])('rejects invalid email "%s"', value => expect(institutionalEmailSchema.safeParse(value).success).toBe(false));
  it("keeps null and undefined optional values", () => { expect(validateInstitutionalEmail(null)).toBeNull(); expect(validateInstitutionalEmail(undefined)).toBeUndefined(); });

  it("requires valid institutional email on create but permits legacy value shape on update", () => {
    const person = { primerNombre: "Ana", primerApellido: "Prueba" };
    const beneficiary = { idTipoBeneficiario: 13, idCarrera: null, numeroCuenta: null, codigoCarne: null, estadoAcademico: null };
    expect(createSchema.safeParse({ person, beneficiary: { ...beneficiary, correoInstitucional: "legacy" }, usuarioRegistro: "test" }).success).toBe(false);
    expect(updateSchema.safeParse({ person, beneficiary: { ...beneficiary, correoInstitucional: "legacy" }, usuarioActualizacion: "test" }).success).toBe(true);
  });
});
