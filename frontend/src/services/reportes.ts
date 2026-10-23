import { download, get } from "./http";

export interface ReportFilter { idCampus?: number; idEdificio?: number; idTipoBeneficiario?: number; estado?: "all" | "active" | "inactive"; desde?: string; hasta?: string }
export interface ReportOptions { campus: Array<{ idCampus: number; codigoCampus: string; nombreCampus: string }>; edificios: Array<{ idEdificio: number; idCampus: number; codigoEdificio: string; nombreEdificio: string }>; tiposBeneficiario: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }> }
export interface DistributionRow { codigoEstado?: string; nombreEstado?: string; codigoTipo?: string; nombreTipo?: string; total: number | string }
export interface ReportSummary { beneficiarios: { total: number | string; porTipo: DistributionRow[] }; solicitudes: { total: number | string; porEstado: DistributionRow[] }; tarjetas: { porEstado: DistributionRow[] }; asignacionesVigentes: number | string; infraestructura: { campus: number | string; edificios: number | string; elevadores: number | string; dispositivos: number | string }; filtros: ReportFilter }
function query(filters: ReportFilter) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value)); const text = params.toString(); return text ? `?${text}` : ""; }
export const getReportSummary = (filters: ReportFilter = {}) => get<ReportSummary>(`/api/v1/reportes/resumen${query(filters)}`);
export const getReportOptions = () => get<ReportOptions>("/api/v1/reportes/opciones");
export const downloadReportSummary = (filters: ReportFilter = {}) => download(`/api/v1/reportes/exportar${query(filters)}`);
