import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repo from "./edificios.repository.js";
import type { Create, Query, State, Update } from "./edificios.types.js";
const required = async (id: number) => { const item = await repo.find(id); if (!item) throw new HttpError(404, "Edificio no encontrado"); return item; };
export async function list(q: Query) { const r = await repo.list(q); return paginationResult(r.items, r.total, q); } export const get = required; export async function create(d: Create) { return repo.create(d); } export async function update(id: number,d: Update) { await required(id); return repo.update(id,d); } export async function state(id: number,d: State) { await required(id); return repo.state(id,d); }
