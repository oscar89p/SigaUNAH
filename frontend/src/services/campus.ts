import { get, patch, post, put } from "./http";
import type { Campus, Paginated } from "@/types/access";

export function listCampus(params: { page: number; pageSize: number; search: string; sortDirection: "asc" | "desc" }) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    search: params.search,
    sortDirection: params.sortDirection
  });
  return get<Paginated<Campus>>(`/api/v1/campus?${query}`);
}

export function createCampus(data: { codigoCampus: string; nombreCampus: string; usuarioRegistro: string }) {
  return post<Campus>("/api/v1/campus", data);
}

export function updateCampus(id: number, data: { codigoCampus: string; nombreCampus: string; usuarioActualizacion: string }) {
  return put<Campus>(`/api/v1/campus/${id}`, data);
}

export function updateCampusState(id: number, estadoCampus: boolean, usuarioActualizacion: string) {
  return patch<Campus>(`/api/v1/campus/${id}/estado`, { estadoCampus, usuarioActualizacion });
}
