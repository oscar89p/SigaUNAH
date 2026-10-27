import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDatabasePool } from "../database/pool.js";
import { alertParameterCodes, alertParameterValuesQuery, readAlertThresholds, resolveAlertParameterRows, validateAlertThresholds, type AlertParameterValueRow, type AlertThresholds } from "./parameters.js";

vi.mock("../database/pool.js", () => ({ getDatabasePool: vi.fn() }));

const valid: AlertThresholds = { pendingMediumDays: 3, pendingHighDays: 7, assignmentUpcomingDays: 30, approvedWithoutAssignmentDays: 0 };
const row = (code: string, value: string, extra: Partial<AlertParameterValueRow> = {}): AlertParameterValueRow => ({ codigoParametroValor: code, valorParametro: value, tipoParametroValor: "INT", ...extra });
const rows = (): AlertParameterValueRow[] => [row(alertParameterCodes.pendingMedium, "3"), row(alertParameterCodes.pendingHigh, "7"), row(alertParameterCodes.assignmentUpcoming, "30"), row(alertParameterCodes.approvedWithoutAssignment, "0")];

beforeEach(() => vi.clearAllMocks());

describe("lectura institucional de parámetros de alertas", () => {
  it("usa tblParametrosValores relacionado con la cabecera, no valorPredeterminado", () => {
    expect(alertParameterValuesQuery).toContain("Configuracion.tblParametrosValores");
    expect(alertParameterValuesQuery).toContain("pv.idParametro=p.idParametro");
    expect(alertParameterValuesQuery).toContain("@headerCode");
    expect(alertParameterValuesQuery).toContain("pv.valorParametro");
    expect(alertParameterValuesQuery).not.toContain("valorPredeterminado");
  });

  it("resuelve los cuatro valores desde el detalle vigente", () => {
    expect(resolveAlertParameterRows(rows())).toEqual(valid);
  });

  it("consulta la cabecera CONFIGURACION_GENERAL y el detalle relacionado", async () => {
    const queries: string[] = [];
    const request = { input() { return request; }, async query(text: string) { queries.push(text); return queries.length === 1 ? { recordset: [{ idParametro: 1 }] } : { recordset: rows() }; } };
    vi.mocked(getDatabasePool).mockResolvedValue({ request: () => request } as never);
    await expect(readAlertThresholds()).resolves.toEqual(valid);
    expect(queries[0]).toContain("codigoParametro=@headerCode");
    expect(queries[1]).toContain("Configuracion.tblParametrosValores");
    expect(queries[1]).toContain("pv.idParametro=p.idParametro");
  });

  it("rechaza parámetros inactivos o fuera de vigencia", () => {
    expect(() => resolveAlertParameterRows(rows().map(item => item.codigoParametroValor === alertParameterCodes.pendingMedium ? { ...item, estadoParametroValor: false } : item))).toThrow();
    expect(() => resolveAlertParameterRows(rows().map(item => item.codigoParametroValor === alertParameterCodes.pendingMedium ? { ...item, fechaFinVigencia: "2020-01-01T00:00:00Z" } : item))).toThrow();
  });

  it.each(["abc", "-1", "1.5"]) ("rechaza el valor no entero/no negativo %s", value => {
    expect(() => resolveAlertParameterRows(rows().map(item => item.codigoParametroValor === alertParameterCodes.pendingMedium ? { ...item, valorParametro: value } : item))).toThrow();
  });

  it("rechaza valores duplicados vigentes", () => {
    expect(() => resolveAlertParameterRows([...rows(), row(alertParameterCodes.pendingMedium, "4")])).toThrow();
  });

  it("rechaza parámetros faltantes", () => {
    expect(() => resolveAlertParameterRows(rows().filter(item => item.codigoParametroValor !== alertParameterCodes.pendingHigh))).toThrow();
  });

  it("rechaza prioridad alta menor o igual que media", () => {
    expect(() => validateAlertThresholds({ ...valid, pendingHighDays: 3 })).toThrow();
    expect(() => validateAlertThresholds({ ...valid, pendingHighDays: 2 })).toThrow();
  });
});
