import { describe, expect, it } from "vitest";
import { createSchema, updateSchema } from "./usuarios.types.js";

const base = { nombreUsuario: "Usuario de Prueba", correoElectronico: "prueba@unah.edu.hn", nombreAcceso: "prueba", identificadorInstitucional: null, profileIds: [1] };

describe("validación de usuarios", () => {
  it("requiere contraseña para usuarios locales nuevos", () => {
    expect(createSchema.safeParse(base).success).toBe(false);
    expect(createSchema.safeParse({ ...base, password: "ClaveSegura123" }).success).toBe(true);
  });

  it("rechaza perfiles duplicados y autenticaciones no soportadas", () => {
    expect(updateSchema.safeParse({ ...base, profileIds: [1, 1] }).success).toBe(false);
    expect(createSchema.safeParse({ ...base, password: "ClaveSegura123", tipoAutenticacion: "LDAP" }).success).toBe(false);
  });
});
