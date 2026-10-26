import { get, patch, post, put } from "./http";
import type { Paginated } from "@/types/access";

export interface Beneficiary {
  idBeneficiario: number; idPersona: number; idTipoBeneficiario: number; idCarrera: number | null;
  numeroCuenta: string | null; correoInstitucional: string | null; codigoCarne: string | null; estadoAcademico: string | null; estadoBeneficiario: boolean;
  primerNombre: string; segundoNombre: string | null; primerApellido: string; segundoApellido: string | null; numeroIdentificacion: string | null; telefonoPrincipal: string | null; correoPersonal: string | null; fechaNacimiento: string | null;
  codigoTipoBeneficiario: string; nombreTipoBeneficiario: string; codigoCarrera: string | null; nombreCarrera: string | null;
}
export interface BeneficiaryOptions { tiposBeneficiario: Array<{ idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }>; carreras: Array<{ idCarrera: number; codigoCarrera: string; nombreCarrera: string }> }
export interface BeneficiarySearchResult { idBeneficiario: number; nombreCompleto: string; identificacionEnmascarada: string | null; codigoBeneficiario: string | null; estadoBeneficiario: boolean; cuentaEnmascarada: string | null }
export interface BeneficiaryCondition { idBeneficiarioCondicion: number | string; idBeneficiario: number | string; idTipoCondicion: number; codigoTipoCondicion: string; nombreTipoCondicion: string; descripcionCondicion: string | null; esTemporal: boolean; fechaInicio: string | null; fechaFinEstimada: string | null; requiereRevision: boolean; estadoBeneficiarioCondicion: boolean }
export interface ConditionOption { idTipoValor: number; codigoTipoValor: string; nombreTipoValor: string }
export interface BeneficiaryPayload { person: Omit<Beneficiary, "idBeneficiario" | "idPersona" | "idTipoBeneficiario" | "idCarrera" | "numeroCuenta" | "correoInstitucional" | "codigoCarne" | "estadoAcademico" | "estadoBeneficiario" | "codigoTipoBeneficiario" | "nombreTipoBeneficiario" | "codigoCarrera" | "nombreCarrera">; beneficiary: { idTipoBeneficiario: number; idCarrera: number | null; numeroCuenta: string | null; correoInstitucional: string | null; codigoCarne: string | null; estadoAcademico: string | null } }
const query = (search: string, page: number) => new URLSearchParams({ page: String(page), pageSize: "10", search, sortBy: "primerApellido", sortDirection: "asc" }).toString();
export const listBeneficiaries = (search: string, page = 1) => get<Paginated<Beneficiary>>(`/api/v1/beneficiarios?${query(search, page)}`);
export const getBeneficiary = (id: number | string) => get<Beneficiary>(`/api/v1/beneficiarios/${id}`);
export const searchBeneficiaries = (search: string, page = 1, signal?: AbortSignal) => get<Paginated<BeneficiarySearchResult>>(`/api/v1/beneficiarios/busqueda?${new URLSearchParams({ search, page: String(page), pageSize: "10" })}`, signal);
export const getBeneficiaryOptions = () => get<BeneficiaryOptions>("/api/v1/beneficiarios/opciones");
export const createBeneficiary = (payload: BeneficiaryPayload) => post<Beneficiary>("/api/v1/beneficiarios", { ...payload, usuarioRegistro: "backoffice" });
export const updateBeneficiary = (id: number, payload: BeneficiaryPayload) => put<Beneficiary>(`/api/v1/beneficiarios/${id}`, { ...payload, usuarioActualizacion: "backoffice" });
export const toggleBeneficiary = (id: number, estadoBeneficiario: boolean) => patch<Beneficiary>(`/api/v1/beneficiarios/${id}/estado`, { estadoBeneficiario, usuarioActualizacion: "backoffice" });
export const listConditionOptions = () => get<ConditionOption[]>("/api/v1/beneficiarios/condiciones/opciones");
export const listBeneficiaryConditions = (id: number | string, params: Record<string, string | number | undefined> = {}) => get<Paginated<BeneficiaryCondition>>(`/api/v1/beneficiarios/${id}/condiciones?${new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 10), search: String(params.search ?? ""), estado: String(params.estado ?? "all") })}`);
export const createBeneficiaryCondition = (id: number | string, data: unknown) => post<BeneficiaryCondition>(`/api/v1/beneficiarios/${id}/condiciones`, data);
export const updateBeneficiaryCondition = (id: number | string, conditionId: number | string, data: unknown) => put<BeneficiaryCondition>(`/api/v1/beneficiarios/${id}/condiciones/${conditionId}`, data);
export const toggleBeneficiaryCondition = (id: number | string, conditionId: number | string, estado: boolean) => patch<BeneficiaryCondition>(`/api/v1/beneficiarios/${id}/condiciones/${conditionId}/estado`, { estadoBeneficiario: estado, usuarioActualizacion: "backoffice" });
