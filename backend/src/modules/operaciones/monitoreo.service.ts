import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./monitoreo.repository.js";
import type { AccessQuery, IncidentQuery } from "./monitoreo.types.js";

export async function listAccessEvents(query: AccessQuery) {
  const result = await repository.listAccessEvents(query);
  return paginationResult(result.items, result.total, query);
}
export async function listIncidents(query: IncidentQuery) {
  const result = await repository.listIncidents(query);
  return paginationResult(result.items, result.total, query);
}
