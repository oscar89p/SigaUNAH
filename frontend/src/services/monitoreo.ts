import { get } from "@/services/http";

export interface MonitoreoPage<T> { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export interface AccessEvent {
  idRegistroAcceso: number | string; fechaHoraAcceso: string; resultadoAcceso: string; codigoResultado: string | null;
  direccionMovimiento: string | null; pisoOrigen: number | null; pisoDestino: number | null; origenRegistro: string;
  idTarjeta: number | string | null; codigoTarjeta: string | null; idBeneficiario: number | string | null; nombreBeneficiario: string | null;
  idDispositivo: number | string | null; codigoDispositivo: string | null; nombreDispositivo: string | null;
  idElevador: number | null; codigoElevador: string | null; nombreElevador: string | null;
}
export interface AccessIncident {
  idIncidenteAcceso: number | string; codigoIncidenteAcceso: string; tipoIncidenteAcceso: string; descripcionIncidenteAcceso: string;
  nivelSeveridadIncidenteAcceso: string; fechaIncidenteAcceso: string; fechaResolucionIncidenteAcceso: string | null;
  resueltoIncidenteAcceso: boolean; resolucionIncidenteAcceso: string | null; idRegistroAcceso: number | string | null;
  idTarjeta: number | string | null; codigoTarjeta: string | null; idBeneficiario: number | string | null;
  nombreBeneficiario: string | null; idDispositivo: number | string | null; codigoDispositivo: string | null; nombreDispositivo: string | null;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const result = search.toString();
  return result ? `?${result}` : "";
}

const base = "/api/v1/operaciones/monitoreo";
export const listAccessEvents = (params: Record<string, string | number | undefined> = {}) => get<MonitoreoPage<AccessEvent>>(`${base}/accesos${query(params)}`);
export const listAccessIncidents = (params: Record<string, string | number | undefined> = {}) => get<MonitoreoPage<AccessIncident>>(`${base}/incidentes${query(params)}`);
