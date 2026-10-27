import sql from "mssql";

import { getDatabasePool } from "../database/pool.js";
import { HttpError } from "../../shared/errors/http-error.js";

export const alertParameterCodes = {
  pendingMedium: "ALERTAS_SOLICITUD_PENDIENTE_MEDIA_DIAS",
  pendingHigh: "ALERTAS_SOLICITUD_PENDIENTE_ALTA_DIAS",
  assignmentUpcoming: "ALERTAS_ASIGNACION_PROXIMA_VENCER_DIAS",
  approvedWithoutAssignment: "ALERTAS_SOLICITUD_APROBADA_SIN_ASIGNACION_DIAS"
} as const;

const generalParameterCode = "CONFIGURACION_GENERAL";

export type AlertThresholds = {
  pendingMediumDays: number;
  pendingHighDays: number;
  assignmentUpcomingDays: number;
  approvedWithoutAssignmentDays: number;
};

export type AlertParameterValueRow = {
  codigoParametroValor: string;
  valorParametro: string | null;
  tipoParametroValor: string;
  estadoParametroValor?: boolean;
  fechaInicioVigencia?: Date | string | null;
  fechaFinVigencia?: Date | string | null;
};

export function validateAlertThresholds(thresholds: AlertThresholds): AlertThresholds {
  if (!Object.values(thresholds).every(value => Number.isSafeInteger(value) && value >= 0)) throw new HttpError(503, "Los umbrales de alertas deben ser enteros no negativos");
  if (thresholds.pendingHighDays <= thresholds.pendingMediumDays) throw new HttpError(503, "Los umbrales de prioridad alta y media de solicitudes pendientes son inconsistentes");
  return thresholds;
}

function isEffective(row: AlertParameterValueRow, now: Date): boolean {
  if (row.estadoParametroValor === false) return false;
  const start = row.fechaInicioVigencia ? new Date(row.fechaInicioVigencia) : null;
  const end = row.fechaFinVigencia ? new Date(row.fechaFinVigencia) : null;
  return (!start || start <= now) && (!end || end > now);
}

function parseNonNegativeInteger(row: AlertParameterValueRow | undefined, code: string): number {
  if (!row) throw new HttpError(503, `Falta el parámetro institucional ${code}`);
  if (!/^(INT|INTEGER|SMALLINT|BIGINT|ENTERO)$/i.test(row.tipoParametroValor.trim())) throw new HttpError(503, `El parámetro institucional ${code} no está configurado como entero`);
  if (!/^(?:0|[1-9]\d*)$/.test(row.valorParametro ?? "")) throw new HttpError(503, `El parámetro institucional ${code} no contiene un entero no negativo`);
  const value = Number(row.valorParametro);
  if (!Number.isSafeInteger(value) || value < 0) throw new HttpError(503, `El parámetro institucional ${code} está fuera de rango`);
  return value;
}

export function resolveAlertParameterRows(rows: AlertParameterValueRow[], now = new Date()): AlertThresholds {
  const effective = rows.filter(row => isEffective(row, now));
  const byCode = new Map<string, AlertParameterValueRow>();
  for (const row of effective) {
    if (byCode.has(row.codigoParametroValor)) throw new HttpError(503, `Existen múltiples valores vigentes para el parámetro ${row.codigoParametroValor}`);
    byCode.set(row.codigoParametroValor, row);
  }
  const thresholds = {
    pendingMediumDays: parseNonNegativeInteger(byCode.get(alertParameterCodes.pendingMedium), alertParameterCodes.pendingMedium),
    pendingHighDays: parseNonNegativeInteger(byCode.get(alertParameterCodes.pendingHigh), alertParameterCodes.pendingHigh),
    assignmentUpcomingDays: parseNonNegativeInteger(byCode.get(alertParameterCodes.assignmentUpcoming), alertParameterCodes.assignmentUpcoming),
    approvedWithoutAssignmentDays: parseNonNegativeInteger(byCode.get(alertParameterCodes.approvedWithoutAssignment), alertParameterCodes.approvedWithoutAssignment)
  };
  return validateAlertThresholds(thresholds);
}

export const alertParameterValuesQuery = `
SELECT pv.codigoParametroValor,pv.valorParametro,pv.tipoParametroValor,pv.estadoParametroValor,pv.fechaInicioVigencia,pv.fechaFinVigencia
FROM Configuracion.tblParametros p
INNER JOIN Configuracion.tblParametrosValores pv ON pv.idParametro=p.idParametro
WHERE p.codigoParametro=@headerCode
  AND p.estadoParametro=1
  AND pv.estadoParametroValor=1
  AND pv.codigoParametroValor IN (@pendingMedium,@pendingHigh,@assignmentUpcoming,@approvedWithoutAssignment)
  AND (pv.fechaInicioVigencia IS NULL OR pv.fechaInicioVigencia<=SYSDATETIME())
  AND (pv.fechaFinVigencia IS NULL OR pv.fechaFinVigencia>SYSDATETIME())`;

export async function readAlertThresholds(): Promise<AlertThresholds> {
  const pool = await getDatabasePool();
  const header = await pool.request().input("headerCode", sql.NVarChar(80), generalParameterCode).query<{ idParametro: number }>("SELECT idParametro FROM Configuracion.tblParametros WHERE codigoParametro=@headerCode AND estadoParametro=1");
  const idParametro = header.recordset[0]?.idParametro;
  if (!idParametro) throw new HttpError(503, `Falta la cabecera activa de parámetros ${generalParameterCode}`);

  const request = pool.request().input("headerCode", sql.NVarChar(80), generalParameterCode).input("pendingMedium", sql.NVarChar(80), alertParameterCodes.pendingMedium).input("pendingHigh", sql.NVarChar(80), alertParameterCodes.pendingHigh).input("assignmentUpcoming", sql.NVarChar(80), alertParameterCodes.assignmentUpcoming).input("approvedWithoutAssignment", sql.NVarChar(80), alertParameterCodes.approvedWithoutAssignment);
  const result = await request.query<AlertParameterValueRow>(alertParameterValuesQuery);
  return resolveAlertParameterRows(result.recordset);
}
