import { describe, expect, it } from "vitest";
import { campusQuerySchema } from "./campus/campus.types.js";
import { querySchema as buildingsQuerySchema } from "./edificios/edificios.types.js";
import { querySchema as elevatorsQuerySchema } from "./elevadores/elevadores.types.js";
import { querySchema as devicesQuerySchema } from "./dispositivos/dispositivos.types.js";
import { querySchema as requestsQuerySchema } from "./solicitudes/solicitudes.types.js";

describe("P1 operational list filters", () => {
  const schemas = [campusQuerySchema, buildingsQuerySchema, elevatorsQuerySchema, devicesQuerySchema];

  it("defaults infrastructure status filters to all and accepts active/inactive", () => {
    for (const schema of schemas) {
      expect(schema.parse({}).estado).toBe("all");
      expect(schema.parse({ estado: "active" }).estado).toBe("active");
      expect(schema.parse({ estado: "inactive" }).estado).toBe("inactive");
      expect(schema.safeParse({ estado: "enabled" }).success).toBe(false);
    }
  });

  it("keeps request state filtering paginated and validates state identifiers", () => {
    expect(requestsQuerySchema.parse({}).pageSize).toBe(10);
    expect(requestsQuerySchema.parse({ idEstadoSolicitud: "12" }).idEstadoSolicitud).toBe(12);
    expect(requestsQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
    expect(requestsQuerySchema.safeParse({ idEstadoSolicitud: 0 }).success).toBe(false);
  });
});
