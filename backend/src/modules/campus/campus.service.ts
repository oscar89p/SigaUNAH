import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./campus.repository.js";
import type { CampusCreate, CampusQuery, CampusState, CampusUpdate } from "./campus.types.js";

export async function list(query: CampusQuery) {
  const result = await repository.listCampuses(query);
  return paginationResult(result.items, result.total, query);
}

export async function get(id: number) {
  const campus = await repository.findCampus(id);
  if (!campus) throw new HttpError(404, "Campus no encontrado");
  return campus;
}

export async function create(data: CampusCreate) {
  return repository.createCampus(data);
}

export async function update(id: number, data: CampusUpdate) {
  await get(id);
  return repository.updateCampus(id, data);
}

export async function updateState(id: number, data: CampusState) {
  await get(id);
  return repository.updateCampusState(id, data);
}
