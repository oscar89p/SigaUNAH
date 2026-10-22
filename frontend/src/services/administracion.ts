import { get, patch, post, put } from "@/services/http";

const base = "/api/v1/seguridad/admin";
export interface Page<T> { items: T[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }
export interface Profile { idPerfil: number; codigoPerfil: string; nombrePerfil: string; descripcionPerfil: string | null; estadoPerfil: boolean; fechaRegistro: string; usuarios: number; permisos: number }
export interface Permission { idPermiso: number; codigoPermiso: string; nombrePermiso: string; descripcionPermiso: string | null; moduloPermiso: string; estadoPermiso: boolean; operativo: boolean; perfiles: number }
export interface Navigation { idNavegacion: number; codigoNavegacion: string; nombreNavegacion: string; tituloNavegacion: string; descripcionNavegacion: string | null; tipoNavegacion: string; enlaceNavegacion: string | null; claseNavegacion: string | null; ordenNavegacion: number; idNavegacionPadre: number | null; esVisible: boolean; estadoNavegacion: boolean; tituloPadre: string | null }
export interface Parameter { idParametro: number; codigoParametro: string; nombreParametro: string; descripcionParametro: string | null; tipoDato: string; valorPredeterminado: string | null; permiteModificacion: boolean; estadoParametro: boolean }
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
export const listAudit = (params: Record<string, string | number | undefined> = {}) => get<Page<AuditEvent>>(`${base}/auditoria${query(params)}`);
export const getAuditDetail = (source: AuditEvent["fuente"], id: number) => get<Record<string, unknown>>(`${base}/auditoria/${source}/${id}`);
