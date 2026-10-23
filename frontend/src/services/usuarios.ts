import { get, patch, post, put } from "./http";
import type { Paginated } from "@/types/access";

export interface Profile { idPerfil: number; codigoPerfil: string; nombrePerfil: string; descripcionPerfil?: string | null; }
export interface User {
  idUsuario: number | string; nombreUsuario: string; correoElectronico: string; nombreAcceso: string;
  identificadorInstitucional: string | null; tipoAutenticacion: string; estadoUsuario: boolean;
  ultimoAcceso: string | null; fechaRegistro: string; usuarioRegistro: string;
  usuarioActualizacion: string | null; fechaActualizacion: string | null; perfiles: Profile[];
}
export interface UserPayload { nombreUsuario: string; correoElectronico: string; nombreAcceso: string; identificadorInstitucional: string | null; profileIds: number[]; password?: string; }
export interface PersonalInformation { nombreUsuario: string; correoElectronico: string; nombreAcceso: string; identificadorInstitucional: string | null; tipoAutenticacion: string; estadoUsuario: boolean; ultimoAcceso: string | null; }
const pageSize = 10;
function query(search: string, page: number, estado: string) { return new URLSearchParams({ page: String(page), pageSize: String(pageSize), search, estado, sortBy: "nombreUsuario", sortDirection: "asc" }).toString(); }

interface UserListResponse { items?: User[]; total?: number; pagination?: Paginated<User>["pagination"]; }

export async function listUsers(search: string, page = 1, estado = "all"): Promise<Paginated<User>> {
  const response = await get<UserListResponse>(`/api/v1/seguridad/usuarios?${query(search, page, estado)}`);
  if (!response || !Array.isArray(response.items)) throw new Error("La respuesta del listado de usuarios no es válida");

  // Acepta el contrato paginado vigente y normaliza respuestas antiguas { items, total }.
  const pagination = response.pagination ?? (Number.isFinite(response.total) ? {
    page,
    pageSize,
    total: response.total as number,
    totalPages: Math.ceil((response.total as number) / pageSize)
  } : undefined);
  if (!pagination || !Number.isFinite(pagination.total) || !Number.isFinite(pagination.totalPages)) {
    throw new Error("La respuesta del listado no incluye metadatos de paginación válidos");
  }
  return { items: response.items, pagination };
}
export const getUser = (id: number | string) => get<User>(`/api/v1/seguridad/usuarios/${id}`);
export const getMyInformation = () => get<PersonalInformation>("/api/v1/usuarios/mi-informacion");
export const listProfiles = () => get<Profile[]>("/api/v1/seguridad/perfiles");
export const createUser = (payload: UserPayload) => post<User>("/api/v1/seguridad/usuarios", payload);
export const updateUser = (id: number | string, payload: UserPayload) => put<User>(`/api/v1/seguridad/usuarios/${id}`, payload);
export const toggleUser = (id: number | string, estadoUsuario: boolean) => patch<User>(`/api/v1/seguridad/usuarios/${id}/estado`, { estadoUsuario });
