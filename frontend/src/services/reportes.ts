import { download, get } from "./http";

export interface ReportFilter { idCampus?: number; idEdificio?: number; idTipoBeneficiario?: number; estado?: "all" | "active" | "inactive"; desde?: string; hasta?: string }
export interface ReportOptions {
  campus: Array<{ idCampus: number; codigoCampus: string; nombreCampus: string }>;
  edificios: Array<{ idEdificio: number; idCampus: number; codigoEdificio: string; nombreEdificio: string }>;
  tiposBeneficiario: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>;
  condiciones: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>;
  estadosSolicitud: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>;
  periodos: Array<{ idPeriodoAcademico: number; codigoPeriodoAcademico: string; nombrePeriodoAcademico: string }>;
  estadosTarjeta: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>;
  tiposTarjeta: Array<{ idTipoTarjeta: number; codigoTipoTarjeta: string; nombreTipoTarjeta: string }>;
  estadosAsignacion: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>;
  beneficiarios: Array<{ idBeneficiario: number | string; nombreBeneficiario: string; numeroCuenta: string | null }>;
}
export interface DistributionRow { codigoEstado?: string; nombreEstado?: string; codigoTipo?: string; nombreTipo?: string; total: number | string }
export interface ReportSummary { beneficiarios: { total: number | string; porTipo: DistributionRow[] }; solicitudes: { total: number | string; porEstado: DistributionRow[] }; tarjetas: { porEstado: DistributionRow[] }; asignacionesVigentes: number | string; infraestructura: { campus: number | string; edificios: number | string; elevadores: number | string; dispositivos: number | string }; filtros: ReportFilter }
export interface Paginated<T> { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export interface BeneficiaryReport { idBeneficiario: number | string; nombreCompleto: string; codigoTipoBeneficiario: string; nombreTipoBeneficiario: string; codigoTipoCondicion: string | null; nombreTipoCondicion: string | null; descripcionCondicion: string | null; esTemporal: boolean | null; fechaInicio: string | null; fechaFinEstimada: string | null; requiereRevision: boolean | null; estadoBeneficiario: boolean; fechaRegistro: string; numeroCuenta: string | null; correoInstitucional: string | null; codigoCarne: string | null; estadoAcademico: string | null; codigoCarrera: string | null; nombreCarrera: string | null; nivelAcademico: string | null }
export interface RequestReport { idSolicitud: number | string; codigoSolicitud: string; idBeneficiario: number | string; nombreBeneficiario: string; fechaSolicitud: string; codigoPeriodoAcademico: string | null; nombrePeriodoAcademico: string | null; codigoTipoSolicitud: string | null; nombreTipoSolicitud: string | null; codigoEstadoSolicitud: string; nombreEstadoSolicitud: string; fechaResolucion: string | null; tipoDecision: string | null; fechaAprobacion: string | null; observacionAprobacion: string | null; idAsignacion: number | string | null; codigoTarjeta: string | null; tieneAsignacionVigente: boolean }
export interface CardReport { idTarjeta: number | string; codigoTarjeta: string; codigoExterno: string | null; numeroSerie: string | null; codigoTipoTarjeta: string | null; nombreTipoTarjeta: string | null; codigoEstadoTarjeta: string; nombreEstadoTarjeta: string; estadoTarjeta: boolean; fechaAlta: string; idAsignacion: number | string | null; nombreBeneficiario: string | null; codigoSolicitud: string | null; fechaAsignacion: string | null; fechaDevolucion: string | null; fechaInicioVigencia: string | null; fechaFinVigencia: string | null; nombreEstadoAsignacion: string | null; disponible: boolean }
export interface AssignmentReport { idAsignacion: number | string; idBeneficiario: number | string; idTarjeta: number | string; idSolicitud: number | string; nombreBeneficiario: string; codigoTarjeta: string; codigoSolicitud: string; codigoEstadoAsignacion: string; nombreEstadoAsignacion: string; fechaAsignacion: string; fechaInicioVigencia: string; fechaFinVigencia: string | null; fechaDevolucion: string | null; esAsignacionVigente: boolean; diasRestantes: number | null }
export interface HistoryReport { tipoMovimiento: string; idMovimiento: number | string; idBeneficiario: number | string | null; idTarjeta: number | string | null; idSolicitud: number | string | null; nombreBeneficiario: string | null; codigoTarjeta: string | null; codigoSolicitud: string | null; fechaMovimiento: string; codigoEstadoAnterior: string | null; nombreEstadoAnterior: string | null; codigoEstadoNuevo: string; nombreEstadoNuevo: string; idUsuarioResponsable: number | string | null; usuarioResponsable: string | null; motivoCambio: string | null }

function query(filters: object) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value)); const text = params.toString(); return text ? `?${text}` : ""; }
export const getReportSummary = (filters: ReportFilter = {}) => get<ReportSummary>(`/api/v1/reportes/resumen${query(filters)}`);
export const getReportOptions = () => get<ReportOptions>("/api/v1/reportes/opciones");
export const downloadReportSummary = (filters: ReportFilter = {}) => download(`/api/v1/reportes/exportar${query(filters)}`);
export type DetailedReportType = "beneficiarios" | "solicitudes" | "tarjetas" | "asignaciones" | "historial";
export type ReportExportFormat = "xlsx" | "pdf";
export const downloadDetailedReport = (type: DetailedReportType, format: ReportExportFormat, filters: object = {}) => download(`/api/v1/reportes/${type}/exportar${query({ ...filters, formato: format })}`);
export const listBeneficiaryReport = (filters: Record<string, unknown> = {}) => get<Paginated<BeneficiaryReport>>(`/api/v1/reportes/beneficiarios${query(filters)}`);
export const listRequestReport = (filters: Record<string, unknown> = {}) => get<Paginated<RequestReport>>(`/api/v1/reportes/solicitudes${query(filters)}`);
export const listCardReport = (filters: Record<string, unknown> = {}) => get<Paginated<CardReport>>(`/api/v1/reportes/tarjetas${query(filters)}`);
export const listAssignmentReport = (filters: Record<string, unknown> = {}) => get<Paginated<AssignmentReport>>(`/api/v1/reportes/asignaciones${query(filters)}`);
export const listHistoryReport = (filters: Record<string, unknown> = {}) => get<Paginated<HistoryReport>>(`/api/v1/reportes/historial${query(filters)}`);
