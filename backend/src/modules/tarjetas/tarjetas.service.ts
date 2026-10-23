import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./tarjetas.repository.js";
import type { AssignmentInput, AssignmentQuery, Create, HistoryQuery, Query, RenewAssignment, ReplaceAssignment, ReturnAssignment, State, Update } from "./tarjetas.types.js";
import type { AuthContext } from "../auth/auth-context.js";
export async function list(query: Query){const result=await repository.list(query);return paginationResult(result.items,result.total,query);}
export async function get(id: bigint){const item=await repository.find(id);if(!item)throw new HttpError(404,"Tarjeta no encontrada");return item;}
export const options=repository.options;
export async function create(data:Create, actor:AuthContext){return repository.create(data,actor);}
export async function update(id:bigint,data:Update){await get(id);return repository.update(id,data);}
export async function state(id:bigint,data:State){await get(id);return repository.state(id,data);}
export const assignments = (query: AssignmentQuery) => repository.listAssignments(query);
export const available = repository.availableCards;
export const availabilityDiagnostics = repository.availabilityDiagnostics;
export const accessOptions = repository.accessOptions;
export const assignmentOptions = repository.assignmentOptions;
export const validRequests = repository.validRequests;
export async function history(id: bigint, query: HistoryQuery) { await get(id); const result = await repository.history(id, query); return paginationResult(result.items, result.total, { ...query, search: undefined, sortDirection: "desc" }); }
export const assign = (data: AssignmentInput, actor: AuthContext) => repository.assign(data, actor);
export const returnAssignment = (id: bigint, data: ReturnAssignment, actor: AuthContext) => repository.returnAssignment(id, data, actor);
export const renewAssignment = (id: bigint, data: RenewAssignment, actor: AuthContext) => repository.renewAssignment(id, data, actor);
export const replaceAssignment = (id: bigint, data: ReplaceAssignment, actor: AuthContext) => repository.replaceAssignment(id, data, actor);
