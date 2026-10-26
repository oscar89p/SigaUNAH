import type { AssignmentReportQuery, BeneficiaryReportQuery, CardReportQuery, HistoryReportQuery, ReportQuery, RequestReportQuery } from "./reportes.types.js";
import * as repository from "./reportes.repository.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { buildPdf, buildXlsx, exportColumns, pdfReportConfig, pdfReportTitles, reportFileNames, reportTitles } from "./reportes.export.js";
import type { ReportExportFormat, ReportExportType } from "./reportes.types.js";

export const summary = repository.summary;
export const options = repository.options;
export const beneficiaries = (query: BeneficiaryReportQuery) => repository.beneficiaries(query);
export const requests = (query: RequestReportQuery) => repository.requests(query);
export const cards = (query: CardReportQuery) => repository.cards(query);
export const assignments = (query: AssignmentReportQuery) => repository.assignments(query);
export const history = (query: HistoryReportQuery) => repository.history(query);

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

const MAX_EXPORT_ROWS = 10000;
type ExportQuery = BeneficiaryReportQuery | RequestReportQuery | CardReportQuery | AssignmentReportQuery | HistoryReportQuery;
type PagedResult = { items: Array<Record<string, unknown>>; pagination: { page: number; pageSize: number; total: number; totalPages: number } };

async function collectRows(type: ReportExportType, query: ExportQuery): Promise<Array<Record<string, unknown>>> {
  const loadPage = (page: number): Promise<PagedResult> => {
    const pageQuery = { ...query, page, pageSize: 100 } as never;
    if (type === "beneficiarios") return repository.beneficiaries(pageQuery as BeneficiaryReportQuery) as Promise<PagedResult>;
    if (type === "solicitudes") return repository.requests(pageQuery as RequestReportQuery) as Promise<PagedResult>;
    if (type === "tarjetas") return repository.cards(pageQuery as CardReportQuery) as Promise<PagedResult>;
    if (type === "asignaciones") return repository.assignments(pageQuery as AssignmentReportQuery) as Promise<PagedResult>;
    return repository.history(pageQuery as HistoryReportQuery) as Promise<PagedResult>;
  };
  const first = await loadPage(1);
  if (first.pagination.total > MAX_EXPORT_ROWS) throw new HttpError(413, `El reporte contiene ${first.pagination.total} registros; restrinja los filtros para exportar un máximo de ${MAX_EXPORT_ROWS}.`);
  const rows = [...first.items];
  for (let page = 2; page <= first.pagination.totalPages; page += 1) rows.push(...(await loadPage(page)).items);
  return rows;
}

export async function exportDetailed(type: ReportExportType, format: ReportExportFormat, query: ExportQuery) {
  const rows = await collectRows(type, query);
  const columns = exportColumns(type);
  const title = reportTitles[type];
  const content = format === "xlsx" ? await buildXlsx(title, rows, columns, query as unknown as Record<string, unknown>) : await buildPdf(pdfReportTitles[type], rows, columns, query as unknown as Record<string, unknown>, pdfReportConfig(type));
  return { content, contentType: format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf", fileName: `siga-${reportFileNames[type]}.${format}` };
}
