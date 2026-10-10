import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./solicitudes.repository.js";
import type { Create, Query, State, Update } from "./solicitudes.types.js";

export async function list(query: Query) { const result = await repository.list(query); return paginationResult(result.items, result.total, query); }
export async function get(id: bigint) { const item = await repository.find(id); if (!item) throw new HttpError(404, "Solicitud no encontrada"); return item; }
export const options = repository.options;
export async function create(data: Create) { return repository.create(data); }
export async function update(id: bigint, data: Update) { await get(id); return repository.update(id, data); }
export async function state(id: bigint, data: State) { await get(id); return repository.state(id, data); }
