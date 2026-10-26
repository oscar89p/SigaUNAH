import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildPdf, buildXlsx, exportColumns, pdfHeaderPresentation, pdfReportConfig, pdfReportTitles, pdfTablePresentation, safeExcelValue, type ExportColumn } from "./reportes.export.js";

const columns: ExportColumn[] = [{ key: "codigo", label: "Código" }, { key: "fecha", label: "Fecha" }];

describe("report exports", () => {
  it("protects formula-like Excel values", () => {
    expect(safeExcelValue("=1+1")).toBe("'=1+1");
    expect(safeExcelValue("@usuario")).toBe("'@usuario");
    expect(safeExcelValue("normal")).toBe("normal");
    expect(safeExcelValue(null)).toBeNull();
  });

  it("preserves semantic values in XLSX and PDF", async () => {
    const semanticColumns: ExportColumn[] = [
      { key: "nombre", label: "Nombre completo", width: 30 },
      { key: "estado", label: "Estado", width: 16, kind: "boolean", trueLabel: "Activo", falseLabel: "Inactivo" },
      { key: "fecha", label: "Fecha", width: 18, kind: "date" },
      { key: "cuenta", label: "Cuenta", width: 18, kind: "text" }
    ];
    const rows = [{ nombre: "Muñoz, María José", estado: true, fecha: new Date("2026-01-01T10:00:00Z"), cuenta: "00001234" }];
    const xlsx = await buildXlsx("Reporte de prueba", rows, semanticColumns, { estado: "active", page: 2, pageSize: 10, sortDirection: "asc" });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx as never);
    const data = workbook.getWorksheet("Reporte")?.getRow(7).values as unknown[];
    const pdf = await buildPdf("Reporte de prueba", rows, semanticColumns, { estado: "active" });
    const emptyPdf = await buildPdf("Reporte vacío", [], columns, {});
    expect(xlsx.subarray(0, 2).toString()).toBe("PK");
    expect(data).toContain("Activo");
    expect(data).toContain("00001234");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(emptyPdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("handles all report column sets and multiple PDF pages", async () => {
    const types = ["beneficiarios", "solicitudes", "tarjetas", "asignaciones", "historial"] as const;
    for (const type of types) expect(exportColumns(type).length).toBeGreaterThan(1);
    const manyRows = Array.from({ length: 60 }, (_, index) => ({ codigo: `A-${index}`, fecha: new Date() }));
    const pdf = await buildPdf("Reporte con muchas páginas", manyRows, columns, {});
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const pageCount = Number(pdf.toString("latin1").match(/\/Count (\d+)/)?.[1] ?? 0);
    expect(pageCount).toBeGreaterThan(1);
  });

  it("uses a readable horizontal layout for history movements", async () => {
    const history = exportColumns("historial");
    const row = Object.fromEntries(history.map((column, index) => [column.key, index === 2 ? "Beneficiario con un nombre completo deliberadamente extenso para validar el ajuste natural" : index === 8 ? "Motivo extenso con acentos: revisión de devolución y actualización de vigencia" : `Dato ${index}`]));
    const pdf = await buildPdf("Historial consolidado de movimientos", [row], history, { tipoMovimiento: "tarjeta" }, pdfReportConfig("historial"));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
    expect(pdfReportConfig("historial").mode).toBe("table");
    expect(history[0]?.key).toBe("fechaMovimiento");
  });

  it("keeps the shared PDF spacing contract", () => {
    expect(pdfReportTitles.historial).toBe("HISTORIAL CONSOLIDADO DE MOVIMIENTOS");
    expect(pdfHeaderPresentation).toMatchObject({
      institutionFontSize: 14,
      subtitleFontSize: 10,
      reportTitleFontSize: 16,
      metadataFontSize: 9,
      reportTitleTopSpacing: 12,
      alignment: "center"
    });
    expect(pdfTablePresentation.cellPadding).toEqual([8, 6, 8, 6]);
    expect(pdfTablePresentation.headerPadding).toEqual([10, 8, 10, 8]);
    expect(pdfTablePresentation.numericCellPadding[2]).toBeGreaterThanOrEqual(10);
    expect(pdfTablePresentation.pageMargins[0]).toBe(pdfTablePresentation.pageMargins[2]);
    expect(pdfTablePresentation.pageMargins[3]).toBeGreaterThan(42);
  });

  it("keeps a 55-record history compact and multipage", async () => {
    const history = exportColumns("historial");
    const rows = Array.from({ length: 55 }, (_, index) => Object.fromEntries(history.map(column => [column.key, column.kind === "date" ? new Date("2026-01-01T10:00:00Z") : `${column.label} ${index + 1}`])));
    const pdf = await buildPdf("Historial consolidado de movimientos", rows, history, {}, pdfReportConfig("historial"));
    const pageCount = Number(pdf.toString("latin1").match(/\/Count (\d+)/)?.[1] ?? 0);
    expect(pageCount).toBe(5);
  });
});
