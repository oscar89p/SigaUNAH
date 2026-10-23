import { get, patch, post, put } from "@/services/http";

const base = "/api/v1/seguridad/admin";
export interface Page<T> { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export interface Profile { idPerfil: number; codigoPerfil: string; nombrePerfil: string; descripcionPerfil: string | null; estadoPerfil: boolean; fechaRegistro: string; usuarios: number; permisos: number }
export interface Permission { idPermiso: number; codigoPermiso: string; nombrePermiso: string; descripcionPermiso: string | null; moduloPermiso: string; estadoPermiso: boolean; operativo: boolean; perfiles: number }
export interface Navigation { idNavegacion: number; codigoNavegacion: string; nombreNavegacion: string; tituloNavegacion: string; descripcionNavegacion: string | null; tipoNavegacion: string; enlaceNavegacion: string | null; claseNavegacion: string | null; ordenNavegacion: number; idNavegacionPadre: number | null; esVisible: boolean; estadoNavegacion: boolean; tituloPadre: string | null }
export interface Parameter { idParametro: number; codigoParametro: string; nombreParametro: string; descripcionParametro: string | null; tipoDato: string; valorPredeterminado: string | null; permiteModificacion: boolean; estadoParametro: boolean }
export interface ParameterValue { idParametroValor: number | string; idParametro: number; codigoParametro: string; nombreParametro: string; valorParametro: string; fechaInicioVigencia: string | null; fechaFinVigencia: string | null; estadoParametroValor: boolean; codigoParametroValor: string; nombreParametroValor: string; descripcionParametroValor: string | null; tipoParametroValor: string }
export interface Catalog { idTipo: number; idCategoria: number; codigoCategoria: string; nombreCategoria: string; codigoTipo: string; nombreTipo: string; descripcionTipo: string | null; estadoTipo: boolean }
export interface CatalogValue { idTipoValor: number; idTipo: number; codigoTipo: string; nombreTipo: string; codigoTipoValor: string; nombreTipoValor: string; descripcionTipoValor: string | null; ordenTipoValor: number; estadoTipoValor: boolean }
export interface AuditEvent { idEvento: number; fuente: "BITACORA" | "AUTENTICACION"; fecha: string; idUsuario: number | null; usuario: string; modulo: string; evento: string; resultado: "correcto" | "fallido" | null; entidad: string; identificador: string | null; ip: string | null; correlacion: string | null }
export type ProfilePayload = Pick<Profile, "codigoPerfil" | "nombrePerfil" | "descripcionPerfil">;
export type PermissionPayload = Pick<Permission, "codigoPermiso" | "nombrePermiso" | "descripcionPermiso" | "moduloPermiso">;
export type NavigationPayload = Pick<Navigation, "codigoNavegacion" | "nombreNavegacion" | "tituloNavegacion" | "descripcionNavegacion" | "tipoNavegacion" | "enlaceNavegacion" | "claseNavegacion" | "ordenNavegacion" | "idNavegacionPadre" | "esVisible">;

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const result = search.toString(); return result ? `?${result}` : "";
}
export const listAdminProfiles = (params: Record<string, string | number | undefined> = {}) => get<Page<Profile>>(`${base}/perfiles${query(params)}`);
export const getAdminProfile = (id: number) => get<Profile>(`${base}/perfiles/${id}`);
export const createAdminProfile = (data: ProfilePayload) => post<Profile>(`${base}/perfiles`, data);
export const updateAdminProfile = (id: number, data: ProfilePayload) => put<Profile>(`${base}/perfiles/${id}`, data);
export const setAdminProfileState = (id: number, estado: boolean) => patch<Profile>(`${base}/perfiles/${id}/estado`, { estado });
export const listProfileUsers = (id: number, params: Record<string, string | number | undefined> = {}) => get<Page<{ idUsuario: number; nombreUsuario: string; nombreAcceso: string; correoElectronico: string; estadoUsuario: boolean }>>(`${base}/perfiles/${id}/usuarios${query(params)}`);
export const getProfilePermissionIds = (id: number) => get<number[]>(`${base}/perfiles/${id}/permisos`);
export const setProfilePermissions = (id: number, ids: number[]) => put(`${base}/perfiles/${id}/permisos`, { ids });
export const getProfileNavigationIds = (id: number) => get<number[]>(`${base}/perfiles/${id}/navegaciones`);
export const setProfileNavigations = (id: number, ids: number[]) => put(`${base}/perfiles/${id}/navegaciones`, { ids });

export const listPermissions = (params: Record<string, string | number | undefined> = {}) => get<Page<Permission>>(`${base}/permisos${query(params)}`);
export const createPermission = (data: PermissionPayload) => post<Permission>(`${base}/permisos`, data);
export const updatePermission = (id: number, data: PermissionPayload) => put<Permission>(`${base}/permisos/${id}`, data);
export const setPermissionState = (id: number, estado: boolean) => patch<Permission>(`${base}/permisos/${id}/estado`, { estado });
export const profilesForPermission = (id: number) => get<Array<{ idPerfil: number; codigoPerfil: string; nombrePerfil: string; estadoPerfil: boolean }>>(`${base}/permisos/${id}/perfiles`);

export const listNavigations = (params: Record<string, string | number | undefined> = {}) => get<Page<Navigation>>(`${base}/navegaciones${query(params)}`);
export const createNavigation = (data: NavigationPayload) => post<Navigation>(`${base}/navegaciones`, data);
export const updateNavigation = (id: number, data: NavigationPayload) => put<Navigation>(`${base}/navegaciones/${id}`, data);
export const setNavigationState = (id: number, estado: boolean) => patch<Navigation>(`${base}/navegaciones/${id}/estado`, { estado });

export const listParameters = () => get<Parameter[]>(`${base}/configuracion`);
export const updateParameter = (id: number, valor: string) => put<Parameter>(`${base}/configuracion/${id}`, { valor });
export const listAdminParameters = (params: Record<string, string | number | undefined> = {}) => get<Page<Parameter>>(`${base}/configuracion/parametros${query(params)}`);
export const createAdminParameter = (data: unknown) => post<Parameter>(`${base}/configuracion/parametros`, data);
export const updateAdminParameter = (id: number, data: unknown) => put<Parameter>(`${base}/configuracion/parametros/${id}`, data);
export const setAdminParameterState = (id: number, estado: boolean) => patch<Parameter>(`${base}/configuracion/parametros/${id}/estado`, { estado });
export const listParameterValues = (params: Record<string, string | number | undefined> = {}) => get<Page<ParameterValue>>(`${base}/configuracion/valores${query(params)}`);
export const createParameterValue = (data: unknown) => post<ParameterValue>(`${base}/configuracion/valores`, data);
export const updateParameterValue = (id: number | string, data: unknown) => put<ParameterValue>(`${base}/configuracion/valores/${id}`, data);
export const setParameterValueState = (id: number | string, estado: boolean) => patch<ParameterValue>(`${base}/configuracion/valores/${id}/estado`, { estado });
export const listCatalogs = (params: Record<string, string | number | undefined> = {}) => get<Page<Catalog>>(`${base}/configuracion/catalogos${query(params)}`);
export const createCatalog = (data: unknown) => post<Catalog>(`${base}/configuracion/catalogos`, data);
export const updateCatalog = (id: number, data: unknown) => put<Catalog>(`${base}/configuracion/catalogos/${id}`, data);
export const setCatalogState = (id: number, estado: boolean) => patch<Catalog>(`${base}/configuracion/catalogos/${id}/estado`, { estado });
export const listCatalogValues = (params: Record<string, string | number | undefined> = {}) => get<Page<CatalogValue>>(`${base}/configuracion/catalogos/valores${query(params)}`);
export const createCatalogValue = (data: unknown) => post<CatalogValue>(`${base}/configuracion/catalogos/valores`, data);
export const updateCatalogValue = (id: number, data: unknown) => put<CatalogValue>(`${base}/configuracion/catalogos/valores/${id}`, data);
export const setCatalogValueState = (id: number, estado: boolean) => patch<CatalogValue>(`${base}/configuracion/catalogos/valores/${id}/estado`, { estado });
export const listAudit = (params: Record<string, string | number | undefined> = {}) => get<Page<AuditEvent>>(`${base}/auditoria${query(params)}`);
export const getAuditDetail = (source: AuditEvent["fuente"], id: number) => get<Record<string, unknown>>(`${base}/auditoria/${source}/${id}`);
