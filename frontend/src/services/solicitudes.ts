import { get, post, put } from "./http";
import type { Paginated } from "@/types/access";

export interface Solicitud {
  idSolicitud: number; codigoSolicitud: string; idBeneficiario: number; idPeriodoAcademico: number | null; idTipoSolicitud: number | null; idTipoVigencia: number; idEstadoSolicitud: number;
  fechaSolicitud: string; fechaInicioSolicitada: string | null; fechaFinSolicitada: string | null; motivoSolicitud: string | null; origenSolicitud: string; estadoSolicitud: boolean;
  nombreBeneficiario: string; numeroCuenta: string | null; codigoTipoSolicitud: string | null; nombreTipoSolicitud: string | null; nombreTipoVigencia: string; nombreEstadoSolicitud: string; codigoPeriodoAcademico: string | null; nombrePeriodoAcademico: string | null;
}
export interface SolicitudOptions { beneficiarios: Array<{ idBeneficiario: number; nombreBeneficiario: string; numeroCuenta: string | null }>; tiposSolicitud: Array<{ idTipoSolicitud: number; codigoTipoSolicitud: string; nombreTipoSolicitud: string }>; tiposVigencia: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>; estadosSolicitud: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>; periodos: Array<{ idPeriodoAcademico: number; codigoPeriodoAcademico: string; nombrePeriodoAcademico: string }> }
export interface SolicitudPayload { codigoSolicitud: string; idBeneficiario: number; idPeriodoAcademico: number | null; idTipoSolicitud: number | null; idTipoVigencia: number; idEstadoSolicitud: number; fechaInicioSolicitada: Date | null; fechaFinSolicitada: Date | null; motivoSolicitud: string | null; origenSolicitud: string }
const query = (search: string, page: number) => new URLSearchParams({ page: String(page), pageSize: "10", search, sortBy: "fechaSolicitud", sortDirection: "desc" }).toString();
export const listSolicitudes = (search: string, page = 1) => get<Paginated<Solicitud>>(`/api/v1/solicitudes?${query(search, page)}`);
export const getSolicitudOptions = () => get<SolicitudOptions>("/api/v1/solicitudes/opciones");
export const createSolicitud = (payload: SolicitudPayload) => post<Solicitud>("/api/v1/solicitudes", { ...payload, usuarioRegistro: "backoffice" });
export const updateSolicitud = (id: number, payload: SolicitudPayload) => put<Solicitud>(`/api/v1/solicitudes/${id}`, { ...payload, usuarioActualizacion: "backoffice" });
