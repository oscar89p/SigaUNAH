import ExcelJS from "exceljs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PdfPrinter = (require("pdfmake/js/Printer.js") as { default: new (fonts: PdfFontDefinitions, virtualFileSystem?: unknown, urlResolver?: PdfUrlResolver) => PdfPrinterInstance }).default;

export type ExportRow = Record<string, unknown>;

export const reportTitles = {
  beneficiarios: "Reporte de beneficiarios",
  solicitudes: "Reporte de solicitudes",
  tarjetas: "Reporte de tarjetas",
  asignaciones: "Reporte de asignaciones y vigencias",
  historial: "Historial consolidado de movimientos"
} as const;

export const pdfReportTitles = {
  beneficiarios: "REPORTE DE BENEFICIARIOS",
  solicitudes: "REPORTE DE SOLICITUDES",
  tarjetas: "REPORTE DE TARJETAS",
  asignaciones: "ASIGNACIONES Y VIGENCIAS",
  historial: "HISTORIAL CONSOLIDADO DE MOVIMIENTOS"
} as const;

export const reportFileNames = {
  beneficiarios: "beneficiarios",
  solicitudes: "solicitudes",
  tarjetas: "tarjetas",
  asignaciones: "asignaciones-vigencias",
  historial: "historial-movimientos"
} as const;

export type ExportColumnKind = "text" | "date" | "status" | "boolean" | "number";
export interface ExportColumn { key: string; label: string; width?: number; kind?: ExportColumnKind; trueLabel?: string; falseLabel?: string }
export interface PdfReportConfig { mode: "table" | "blocks"; orientation: "landscape" | "portrait"; fontSize: number; columnWeights?: number[] }
export const pdfTablePresentation = {
  cellPadding: [8, 6, 8, 6] as [number, number, number, number],
  headerPadding: [10, 8, 10, 8] as [number, number, number, number],
  numericCellPadding: [8, 6, 10, 6] as [number, number, number, number],
  pageMargins: [36, 118, 36, 52] as [number, number, number, number]
};
export const pdfHeaderPresentation = {
  institutionFontSize: 14,
  subtitleFontSize: 10,
  reportTitleFontSize: 16,
  metadataFontSize: 9,
  reportTitleTopSpacing: 12,
  alignment: "center" as const
};

interface PdfFontDefinitions { Roboto: Record<string, string> }
interface PdfUrlResolver { resolve(url: string, headers?: Record<string, string>): void; resolved(): Promise<void> }
interface PdfPrinterDocument { on(event: "data" | "end" | "error", listener: (value?: unknown) => void): PdfPrinterDocument; end(): void }
interface PdfPrinterInstance { createPdfKitDocument(definition: Record<string, unknown>): Promise<PdfPrinterDocument> }

const pdfPrinter = new PdfPrinter({
  Roboto: {
    normal: require.resolve("pdfmake/fonts/Roboto/Roboto-Regular.ttf"),
    bold: require.resolve("pdfmake/fonts/Roboto/Roboto-Medium.ttf"),
    italics: require.resolve("pdfmake/fonts/Roboto/Roboto-Italic.ttf"),
    bolditalics: require.resolve("pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf")
  }
}, undefined, { resolve: () => undefined, resolved: async () => undefined });

export function safeExcelValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date || typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function dateValue(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: unknown): string {
  const date = dateValue(value);
  return date ? date.toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" }) : String(value ?? "");
}

function displayValue(value: unknown, column?: ExportColumn): string {
  if (value === null || value === undefined || value === "") return "Sin información";
  if (column?.kind === "date") return formatDate(value);
  if (typeof value === "boolean") return value ? (column?.trueLabel ?? "Sí") : (column?.falseLabel ?? "No");
  if (value instanceof Date) return formatDate(value);
  return String(value);
}

const filterLabels: Record<string, string> = {
  estado: "Estado", search: "Búsqueda", idTipoBeneficiario: "Tipo de beneficiario", idTipoCondicion: "Condición",
  codigoEstadoSolicitud: "Estado de solicitud", idPeriodoAcademico: "Período académico", idBeneficiario: "Beneficiario",
  sinAsignacion: "Sin asignación vigente", idEstadoTarjeta: "Estado de tarjeta", idTipoTarjeta: "Tipo de tarjeta",
  disponibilidad: "Disponibilidad", idEstadoAsignacion: "Estado de asignación", idTarjeta: "Tarjeta", proximasDias: "Días próximos",
  tipoMovimiento: "Tipo de movimiento", desde: "Desde", hasta: "Hasta", idCampus: "Campus", idEdificio: "Edificio"
};

function filtersText(filters: Record<string, unknown>): string {
  const technical = new Set(["page", "pageSize", "sortDirection", "sortBy"]);
  const entries = Object.entries(filters).filter(([key, value]) => !technical.has(key) && value !== undefined && value !== "" && value !== false && value !== "all");
  return entries.length ? entries.map(([key, value]) => `${filterLabels[key] ?? key}: ${typeof value === "boolean" ? (value ? "Sí" : "No") : String(value)}`).join(" · ") : "Sin filtros adicionales";
}

function exportValue(value: unknown, column: ExportColumn): string | number | boolean | Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (column.kind === "date") return dateValue(value) ?? String(value);
  if (typeof value === "boolean") return column.trueLabel && column.falseLabel ? (value ? column.trueLabel : column.falseLabel) : value;
  return value instanceof Date || typeof value === "number" ? value : String(value);
}

export async function buildXlsx(title: string, rows: ExportRow[], columns: ExportColumn[], filters: Record<string, unknown>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIGA UNAH";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Reporte", { views: [{ state: "frozen", ySplit: 6 }] });
  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = "Universidad Nacional Autónoma de Honduras";
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = "Sistema de Gestión de Accesos a Ascensores";
  sheet.mergeCells(3, 1, 3, columns.length);
  sheet.getCell(3, 1).value = title;
  sheet.mergeCells(4, 1, 4, columns.length);
  sheet.getCell(4, 1).value = `Generado: ${new Date().toLocaleString("es-HN")}`;
  sheet.mergeCells(5, 1, 5, columns.length);
  sheet.getCell(5, 1).value = `Filtros: ${filtersText(filters)} · Total: ${rows.length}`;
  for (const rowNumber of [1, 2, 3, 4, 5]) {
    const cell = sheet.getCell(rowNumber, 1);
    cell.font = { bold: true, color: { argb: rowNumber === 3 ? "FFFFFFFF" : "FF1F2937" }, size: rowNumber === 3 ? 14 : 10 };
    cell.alignment = { vertical: "middle", wrapText: true };
    if (rowNumber === 3) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174A5B" } };
  }
  const headerRow = sheet.addRow(columns.map(column => column.label));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF267A8A" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  headerRow.height = 24;
  columns.forEach((column, index) => { sheet.getColumn(index + 1).width = column.width ?? 18; });
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: columns.length } };
  for (const row of rows) {
    const values = columns.map(column => safeExcelValue(exportValue(row[column.key], column)));
    const excelRow = sheet.addRow(values);
    excelRow.alignment = { vertical: "top", wrapText: true };
    columns.forEach((column, index) => {
      const cell = excelRow.getCell(index + 1);
      if (column.kind === "date" && cell.value instanceof Date) cell.numFmt = "dd/mm/yyyy hh:mm";
    });
  }
  sheet.getRow(5).height = 28;
  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

export function pdfReportConfig(type: keyof typeof reportTitles): PdfReportConfig {
  if (type === "historial") return { mode: "table", orientation: "landscape", fontSize: 7.5, columnWeights: [12, 11, 17, 10, 10, 12, 12, 12, 18] };
  if (type === "beneficiarios") return { mode: "table", orientation: "landscape", fontSize: 8, columnWeights: [9, 22, 15, 17, 10, 15, 14, 18, 14] };
  if (type === "solicitudes") return { mode: "table", orientation: "landscape", fontSize: 8, columnWeights: [14, 22, 16, 13, 14, 16, 16, 13] };
  if (type === "tarjetas") return { mode: "table", orientation: "landscape", fontSize: 7.5, columnWeights: [13, 15, 18, 13, 21, 16, 16, 15, 15] };
  return { mode: "table", orientation: "landscape", fontSize: 8, columnWeights: [22, 14, 14, 17, 15, 15, 15, 13] };
}

export async function buildPdf(title: string, rows: ExportRow[], columns: ExportColumn[], filters: Record<string, unknown>, config: PdfReportConfig = { mode: "table", orientation: "landscape", fontSize: 8 }): Promise<Buffer> {
  const generated = new Date().toLocaleString("es-HN");
  const rawWeights = config.columnWeights?.length === columns.length ? config.columnWeights : columns.map(column => Math.max(column.width ?? 18, 12));
  const tableWidth = config.orientation === "landscape" ? 720 : 540;
  const weightTotal = rawWeights.reduce((total, weight) => total + weight, 0) || 1;
  const columnWeights = rawWeights.map(weight => Number((weight / weightTotal * tableWidth).toFixed(2)));
  const tableRows = rows.map(row => columns.map(column => ({ text: displayValue(row[column.key], column), style: column.kind === "number" ? "numberCell" : "cell" })));
  const blockRows = rows.map(row => ({
    table: {
      widths: [125, "*"],
      body: columns.map(column => [{ text: column.label, style: "blockLabel" }, { text: displayValue(row[column.key], column), style: "blockValue" }])
    },
    layout: "lightHorizontalLines",
    margin: [0, 0, 0, 10]
  }));
  const definition: Record<string, unknown> = {
    pageSize: "LETTER",
    pageOrientation: config.orientation,
    pageMargins: pdfTablePresentation.pageMargins,
    defaultStyle: { font: "Roboto", fontSize: config.fontSize, color: "#1F2937" },
    styles: {
      title: { fontSize: pdfHeaderPresentation.institutionFontSize, bold: true, color: "#005A87", alignment: pdfHeaderPresentation.alignment, lineHeight: 1.05 },
      subtitle: { fontSize: pdfHeaderPresentation.subtitleFontSize, color: "#334155", alignment: pdfHeaderPresentation.alignment },
      reportTitle: { fontSize: pdfHeaderPresentation.reportTitleFontSize, bold: true, color: "#005A87", alignment: pdfHeaderPresentation.alignment, margin: [0, pdfHeaderPresentation.reportTitleTopSpacing, 0, 0], lineHeight: 1.05 },
      metadata: { fontSize: pdfHeaderPresentation.metadataFontSize, color: "#334155", alignment: pdfHeaderPresentation.alignment, lineHeight: 1.1 },
      header: { bold: true, color: "white", fillColor: "#267A8A", alignment: "left", margin: pdfTablePresentation.headerPadding, lineHeight: 1.1 },
      cell: { margin: pdfTablePresentation.cellPadding, lineHeight: 1.08 },
      numberCell: { alignment: "right", margin: pdfTablePresentation.numericCellPadding, lineHeight: 1.08 },
      blockLabel: { bold: true, color: "#174A5B", fillColor: "#F1F5F7", margin: pdfTablePresentation.cellPadding },
      blockValue: { margin: pdfTablePresentation.cellPadding, lineHeight: 1.1 }
    },
    header: () => ({ stack: [
      { text: "UNIVERSIDAD NACIONAL AUTÓNOMA DE HONDURAS", style: "title" },
      { text: "Sistema de Gestión de Accesos a Ascensores (SIGA)", style: "subtitle", margin: [0, 4, 0, 0] },
      { text: title, style: "reportTitle" },
      { stack: [
        { text: `Generado: ${generated}`, style: "metadata" },
        { text: `Filtros: ${filtersText(filters)}`, style: "metadata", margin: [0, 3, 0, 0] },
        { text: `Total: ${rows.length} registros`, style: "metadata", margin: [0, 3, 0, 0] }
      ], margin: [0, 5, 0, 0] }
    ], alignment: "center", margin: [0, 16, 0, 0] }),
    footer: (currentPage: number, pageCount: number) => ({ text: `SIGA UNAH · ${generated} · Página ${currentPage} de ${pageCount}`, alignment: "center", fontSize: 7, color: "#475569", margin: [0, 16, 0, 0] }),
    content: [{ canvas: [{ type: "line", x1: 0, y1: 0, x2: tableWidth, y2: 0, lineWidth: 0.6, lineColor: "#CBD5E1" }], margin: [0, 10, 0, 12] }, ...(config.mode === "blocks" ? (blockRows.length ? blockRows : [{ text: "No hay registros para los filtros seleccionados.", style: "cell" }]) : [{
      table: {
        headerRows: 1,
        keepWithHeaderRows: 1,
        dontBreakRows: true,
        widths: columnWeights,
        body: [columns.map(column => ({ text: column.label, style: "header" })), ...(tableRows.length ? tableRows : [[{ text: "No hay registros para los filtros seleccionados.", colSpan: columns.length, style: "cell" }, ...columns.slice(1).map(() => ({}))]])]
      },
      layout: {
        fillColor: (rowIndex: number) => rowIndex > 0 && rowIndex % 2 === 1 ? "#F1F5F7" : null,
        hLineColor: () => "#CBD5E1",
        vLineColor: () => "#CBD5E1",
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      }
    }])]
  };
  const document = await pdfPrinter.createPdfKitDocument(definition);
  const chunks: Buffer[] = [];
  const output = new Promise<Buffer>((resolve, reject) => {
    document.on("data", chunk => chunks.push(Buffer.from(chunk as Uint8Array)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", error => reject(error));
  });
  document.end();
  return output;
}

export function exportColumns(type: keyof typeof reportTitles): ExportColumn[] {
  if (type === "beneficiarios") return [{ key: "idBeneficiario", label: "ID beneficiario", width: 16, kind: "number" }, { key: "nombreCompleto", label: "Nombre completo", width: 28 }, { key: "nombreTipoBeneficiario", label: "Tipo", width: 20 }, { key: "nombreTipoCondicion", label: "Condición", width: 22 }, { key: "estadoBeneficiario", label: "Estado", width: 12, kind: "boolean", trueLabel: "Activo", falseLabel: "Inactivo" }, { key: "fechaRegistro", label: "Fecha de registro", width: 18, kind: "date" }, { key: "numeroCuenta", label: "Cuenta", width: 18, kind: "text" }, { key: "nombreCarrera", label: "Carrera", width: 24 }, { key: "nivelAcademico", label: "Nivel académico", width: 18 }];
  if (type === "solicitudes") return [{ key: "codigoSolicitud", label: "Solicitud", width: 18 }, { key: "nombreBeneficiario", label: "Beneficiario", width: 28 }, { key: "fechaSolicitud", label: "Fecha de solicitud", width: 20, kind: "date" }, { key: "codigoPeriodoAcademico", label: "Período", width: 18 }, { key: "codigoEstadoSolicitud", label: "Estado", width: 18 }, { key: "fechaResolucion", label: "Fecha resolución", width: 20, kind: "date" }, { key: "tieneAsignacionVigente", label: "Asignación vigente", width: 20, kind: "boolean", trueLabel: "Sí", falseLabel: "No" }, { key: "codigoTarjeta", label: "Tarjeta", width: 18, kind: "text" }];
  if (type === "tarjetas") return [{ key: "codigoTarjeta", label: "Tarjeta", width: 18, kind: "text" }, { key: "nombreTipoTarjeta", label: "Tipo", width: 20 }, { key: "nombreEstadoTarjeta", label: "Estado administrativo", width: 24 }, { key: "disponible", label: "Disponible", width: 15, kind: "boolean", trueLabel: "Disponible", falseLabel: "No disponible" }, { key: "nombreBeneficiario", label: "Beneficiario", width: 28 }, { key: "fechaAsignacion", label: "Fecha asignación", width: 20, kind: "date" }, { key: "fechaDevolucion", label: "Fecha devolución", width: 20, kind: "date" }, { key: "fechaInicioVigencia", label: "Inicio vigencia", width: 18, kind: "date" }, { key: "fechaFinVigencia", label: "Fin vigencia", width: 18, kind: "date" }];
  if (type === "asignaciones") return [{ key: "nombreBeneficiario", label: "Beneficiario", width: 28 }, { key: "codigoTarjeta", label: "Tarjeta", width: 18, kind: "text" }, { key: "codigoSolicitud", label: "Solicitud", width: 18, kind: "text" }, { key: "nombreEstadoAsignacion", label: "Estado", width: 22 }, { key: "fechaInicioVigencia", label: "Inicio", width: 18, kind: "date" }, { key: "fechaFinVigencia", label: "Fin", width: 18, kind: "date" }, { key: "fechaDevolucion", label: "Devolución", width: 20, kind: "date" }, { key: "diasRestantes", label: "Días restantes", width: 16, kind: "number" }];
  return [{ key: "fechaMovimiento", label: "Fecha", width: 22, kind: "date" }, { key: "tipoMovimiento", label: "Movimiento", width: 18 }, { key: "nombreBeneficiario", label: "Beneficiario", width: 26 }, { key: "codigoTarjeta", label: "Tarjeta", width: 18, kind: "text" }, { key: "codigoSolicitud", label: "Solicitud", width: 18, kind: "text" }, { key: "nombreEstadoAnterior", label: "Estado anterior", width: 20 }, { key: "nombreEstadoNuevo", label: "Estado nuevo", width: 20 }, { key: "usuarioResponsable", label: "Responsable", width: 22 }, { key: "motivoCambio", label: "Motivo", width: 30 }];
}
