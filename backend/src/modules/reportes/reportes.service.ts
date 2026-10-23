import type { ReportQuery } from "./reportes.types.js";
import * as repository from "./reportes.repository.js";

export const summary = repository.summary;
export const options = repository.options;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function exportSummary(query: ReportQuery) {
  const data = await repository.summary(query);
  const rows: Array<[string, unknown]> = [
    ["Indicador", "Valor"],
    ["Total de beneficiarios", data.beneficiarios.total],
    ["Total de solicitudes", data.solicitudes.total],
    ["Asignaciones vigentes", data.asignacionesVigentes],
    ["Campus", data.infraestructura.campus],
    ["Edificios", data.infraestructura.edificios],
    ["Elevadores", data.infraestructura.elevadores],
    ["Dispositivos", data.infraestructura.dispositivos]
  ];
  rows.push(["", ""], ["Beneficiarios por tipo", ""]);
  for (const row of data.beneficiarios.porTipo as Array<{ nombreTipo: string; total: number }>) rows.push([row.nombreTipo, row.total]);
  rows.push(["", ""], ["Solicitudes por estado", ""]);
  for (const row of data.solicitudes.porEstado as Array<{ nombreEstado: string; total: number }>) rows.push([row.nombreEstado, row.total]);
  rows.push(["", ""], ["Tarjetas por estado", ""]);
  for (const row of data.tarjetas.porEstado as Array<{ nombreEstado: string; total: number }>) rows.push([row.nombreEstado, row.total]);
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
