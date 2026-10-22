import { get, patch, post, put } from "./http";
import type { Paginated } from "@/types/access";

export interface CampusOption { idCampus: number; codigoCampus: string; nombreCampus: string; estadoCampus: boolean; }
export interface BuildingOption { idEdificio: number; codigoEdificio: string; nombreEdificio: string; estadoEdificio: boolean; }
export interface Building { idEdificio:number; idCampus:number; codigoEdificio:string; nombreEdificio:string; direccionEdificio:string|null; estadoEdificio:boolean; nombreCampus:string; }
export interface Elevator { idElevador:number; idEdificio:number; codigoElevador:string; nombreElevador:string; cantidadPisos:number|null; codigoSistemaExterno:string|null; estadoElevador:boolean; nombreEdificio:string; }
export interface Device { idDispositivo:number; idElevador:number|null; codigoDispositivo:string; nombreDispositivo:string; tipoDispositivo:string; direccionIp:string|null; macAddress:string|null; fabricante:string|null; modelo:string|null; versionFirmware:string|null; estadoDispositivo:boolean; nombreElevador:string|null; }
const query = (search:string, page:number, pageSize:number, estado:"all"|"active"|"inactive" = "all") => new URLSearchParams({ page:String(page), pageSize:String(pageSize), search, estado, sortDirection:"asc" }).toString();
export const listCampusOptions = () => get<Paginated<CampusOption>>("/api/v1/campus?page=1&pageSize=100&estado=all&sortBy=nombreCampus&sortDirection=asc");
export const listBuildingOptions = () => get<Paginated<BuildingOption>>("/api/v1/edificios?page=1&pageSize=100&estado=all&sortBy=nombreEdificio&sortDirection=asc");
export const listBuildings = (search:string, page=1, pageSize=10, estado:"all"|"active"|"inactive" = "all") => get<Paginated<Building>>(`/api/v1/edificios?${query(search, page, pageSize, estado)}`);
export const saveBuilding = (id:number|null, data:unknown) => id ? put<Building>(`/api/v1/edificios/${id}`, data) : post<Building>("/api/v1/edificios", data);
export const toggleBuilding = (id:number, estadoEdificio:boolean) => patch<Building>(`/api/v1/edificios/${id}/estado`, { estadoEdificio, usuarioActualizacion:"backoffice" });
export const listElevators = (search:string, page=1, pageSize=10, estado:"all"|"active"|"inactive" = "all") => get<Paginated<Elevator>>(`/api/v1/elevadores?${query(search, page, pageSize, estado)}`);
export const saveElevator = (id:number|null, data:unknown) => id ? put<Elevator>(`/api/v1/elevadores/${id}`, data) : post<Elevator>("/api/v1/elevadores", data);
export const toggleElevator = (id:number, estadoElevador:boolean) => patch<Elevator>(`/api/v1/elevadores/${id}/estado`, { estadoElevador, usuarioActualizacion:"backoffice" });
export const listDevices = (search:string, page=1, pageSize=10, estado:"all"|"active"|"inactive" = "all") => get<Paginated<Device>>(`/api/v1/dispositivos?${query(search, page, pageSize, estado)}`);
export const saveDevice = (id:number|null, data:unknown) => id ? put<Device>(`/api/v1/dispositivos/${id}`, data) : post<Device>("/api/v1/dispositivos", data);
export const toggleDevice = (id:number, estadoDispositivo:boolean) => patch<Device>(`/api/v1/dispositivos/${id}/estado`, { estadoDispositivo, usuarioActualizacion:"backoffice" });
