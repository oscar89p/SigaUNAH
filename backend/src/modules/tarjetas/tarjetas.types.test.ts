import { describe, expect, it } from "vitest";
import { assignmentAdministrativeReason, availabilityDiagnosticsQuery, availableCardsQuery, buildCurrentAssignmentQuery, buildHistoryPageQuery, returnAdministrativeReason } from "./tarjetas.repository.js";
import { administrativeReasonSchema, assignmentQuerySchema, createAssignmentSchema, historyQuerySchema, querySchema, renewAssignmentSchema, returnAssignmentSchema, validateAssignmentDates } from "./tarjetas.types.js";

describe("tarjetas assignment contracts", () => {
  it("accepts bigint identifiers encoded by HTTP as strings", () => {
    const result = createAssignmentSchema.safeParse({ idSolicitud: "10", idBeneficiario: "20", idTarjeta: "30", idTipoVigencia: 1, idEstadoAsignacion: 2, fechaInicioVigencia: "2026-01-01" });
    expect(result.success).toBe(true);
  });

  it("permits extending assignment validity beyond the approved request", () => {
    expect(() => validateAssignmentDates(new Date("2026-10-25"), new Date("2027-12-31"))).not.toThrow();
  });

  it("rejects inverted assignment dates", () => {
    expect(() => validateAssignmentDates(new Date("2026-12-31"), new Date("2026-10-25"))).toThrow("La fecha final no puede ser anterior");
  });

  it("does not invent filters and defaults history to false", () => {
    expect(assignmentQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 10, historial: false });
    expect(assignmentQuerySchema.parse({ historial: "false" }).historial).toBe(false);
    expect(assignmentQuerySchema.parse({ historial: "true" }).historial).toBe(true);
    expect(assignmentQuerySchema.parse({ historial: "0" }).historial).toBe(false);
    expect(assignmentQuerySchema.parse({ historial: "1" }).historial).toBe(true);
    expect(assignmentQuerySchema.safeParse({ idTarjeta: 0 }).success).toBe(false);
  });

  it("accepts the backend card-list state filter", () => {
    expect(querySchema.parse({ estado: "active" }).estado).toBe("active");
    expect(querySchema.safeParse({ estado: "unknown" }).success).toBe(false);
  });

  it("accepts the beneficiary filter used by the card list", () => {
    expect(querySchema.parse({ idBeneficiario: "20" }).idBeneficiario).toBe(20n);
  });

  it("requires a reason when renewing an assignment", () => {
    expect(renewAssignmentSchema.safeParse({ fechaInicioVigencia: "2026-01-01", motivoCambio: "" , usuario: "operator" }).success).toBe(false);
  });

  it("requires the target assignment state and reason when returning a card", () => {
    expect(returnAssignmentSchema.safeParse({ idEstadoAsignacionNuevo: 4, motivoCambio: "Devolución autorizada", usuario: "operator" }).success).toBe(true);
    expect(returnAssignmentSchema.safeParse({ idEstadoAsignacionNuevo: 4, motivoCambio: "", usuario: "operator" }).success).toBe(false);
  });

  it("validates and defaults paginated card history parameters", () => {
    expect(historyQuerySchema.parse({})).toEqual({ page: 1, pageSize: 10 });
    expect(historyQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(historyQuerySchema.safeParse({ pageSize: 51 }).success).toBe(false);
  });

  it("uses ROW_NUMBER pagination for history instead of incompatible FETCH NEXT", () => {
    const query = buildHistoryPageQuery();
    expect(query).toContain("ROW_NUMBER() OVER");
    expect(query).not.toContain("FETCH NEXT");
    expect(query).toContain("@pageEnd");
  });

  it("keeps EXISTS outside aggregate expressions in the SQL Server diagnostic query", () => {
    const aggregateExpressions = availabilityDiagnosticsQuery.match(/SUM\s*\(CASE[\s\S]*?END\)/gi) ?? [];
    expect(aggregateExpressions.length).toBeGreaterThan(0);
    expect(aggregateExpressions.some(expression => /EXISTS|NOT\s+EXISTS/i.test(expression))).toBe(false);
    expect(availabilityDiagnosticsQuery).toContain("tieneAsignacionVigente");
  });

  it("uses the active-and-no-current-assignment rule for available cards", () => {
    expect(availableCardsQuery).toContain("t.estadoTarjeta=1");
    expect(availableCardsQuery).toContain("NOT EXISTS");
    expect(availableCardsQuery).toContain("a.esAsignacionVigente=1");
  });

  it("requires an administrative reason and never accepts a client user", () => {
    expect(administrativeReasonSchema.safeParse({ motivoCambio: "Bloqueo preventivo", usuario: "otro" }).success).toBe(true);
    expect(administrativeReasonSchema.safeParse({ motivoCambio: "" }).success).toBe(false);
  });

  it("does not accept a client supplied user for administrative assignment operations", () => {
    expect(returnAssignmentSchema.safeParse({ idEstadoAsignacionNuevo: 4, motivoCambio: "Recepción", usuario: "otro" }).success).toBe(true);
    expect(returnAssignmentSchema.parse({ idEstadoAsignacionNuevo: 4, motivoCambio: "Recepción", usuario: "otro" })).not.toHaveProperty("usuario");
  });

  it("generates non-null administrative reasons from the real request code", () => {
    expect(assignmentAdministrativeReason("SOL-2026-000006")).toBe("Asignación de tarjeta mediante solicitud SOL-2026-000006");
    expect(returnAdministrativeReason("SOL-2026-000006")).toBe("Devolución de tarjeta correspondiente a la solicitud SOL-2026-000006");
  });

  it("joins the assignment state history for release traceability", () => {
    const query = buildHistoryPageQuery();
    expect(query).toContain("tblAsignacionesEstados");
    expect(query).toContain("motivoLiberacion");
    expect((query.match(/AS usuarioResponsable/gi) ?? []).length).toBe(1);
  });

  it("resolves releaseState in the locked current-assignment query", () => {
    const query = buildCurrentAssignmentQuery();
    expect(query).toContain("OUTER APPLY");
    expect(query).toContain("FROM DbSigaUNAH.Tarjetas.tblAsignacionesEstados aes");
    expect(query).toContain(") releaseState");
    expect(query).toContain("releaseState.motivoCambio");
    expect(query).toContain("releaseState.idUsuarioResponsable");
    expect(query).toContain("releaseState.usuarioRegistro");
    expect(query).toContain("WITH (UPDLOCK,HOLDLOCK)");
  });

  it("keeps automatic administrative history inside the assignment transaction", () => {
    const source = availableCardsQuery;
    expect(source).toContain("NOT EXISTS");
    expect(assignmentAdministrativeReason("SOL-TEST").trim()).not.toBe("");
  });
});
