import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./beneficiarios.repository.js";
import type { Create, Query, SearchQuery, State, Update } from "./beneficiarios.types.js";

export async function list(query: Query) { const result = await repository.list(query); return paginationResult(result.items, result.total, query); }
export async function search(query: SearchQuery) { const result = await repository.search(query); return paginationResult(result.items, result.total, { ...query, sortDirection: "asc" }); }
export async function get(id: bigint) { const item = await repository.find(id); if (!item) throw new HttpError(404, "Beneficiario no encontrado"); return item; }
export const options = repository.options;
export async function create(data: Create) { return repository.create(data); }
export async function update(id: bigint, data: Update) { await get(id); return repository.update(id, data); }
export async function state(id: bigint, data: State) { await get(id); return repository.state(id, data); }
