import { describe, expect, it } from "vitest";
import { createPermissionSchema, idsBodySchema, permissionQuerySchema, profileQuerySchema, updatePermissionSchema } from "./administracion.types.js";

describe("administration request contracts", () => {
  it("accepts only permission codes backed by a real API operation", () => {
    const valid = createPermissionSchema.safeParse({ codigoPermiso: "USUARIOS_ADMINISTRAR", nombrePermiso: "Administración", moduloPermiso: "SEGURIDAD" });
    const pendingPermission = createPermissionSchema.safeParse({ codigoPermiso: "CAMPUS_ADMINISTRAR", nombrePermiso: "Administrar campus", moduloPermiso: "ACCESOS" });
    const arbitrary = createPermissionSchema.safeParse({ codigoPermiso: "SUPER_ADMIN_TOTAL", nombrePermiso: "Arbitrario", moduloPermiso: "TODO" });
    const approvedOperation = updatePermissionSchema.safeParse({ codigoPermiso: "CAMPUS_ADMINISTRAR", nombrePermiso: "Administrar campus", moduloPermiso: "ACCESOS" });
    expect(valid.success).toBe(true);
    expect(pendingPermission.success).toBe(false);
    expect(arbitrary.success).toBe(false);
    expect(approvedOperation.success).toBe(true);
  });

  it("rejects duplicate role assignments and caps their size", () => {
    expect(idsBodySchema.safeParse({ ids: [1, 2] }).success).toBe(true);
    expect(idsBodySchema.safeParse({ ids: [1, 1] }).success).toBe(false);
    expect(idsBodySchema.safeParse({ ids: Array.from({ length: 201 }, (_, i) => i + 1) }).success).toBe(false);
  });

  it("bounds paginated administrative queries", () => {
    expect(profileQuerySchema.parse({}).pageSize).toBe(10);
    expect(permissionQuerySchema.safeParse({ page: 1, pageSize: 101 }).success).toBe(false);
  });
});
