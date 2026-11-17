import { HttpError } from "../../shared/errors/http-error.js";
import { paginationResult } from "../../shared/pagination/query.js";
import * as repository from "./beneficiarios.repository.js";
import type { AccountAvailabilityQuery, ConditionInput, ConditionQuery, Create, OptionsQuery, Query, SearchQuery, State, Update } from "./beneficiarios.types.js";
import type { AuthContext } from "../auth/auth-context.js";
import { validateInstitutionalEmail } from "./institutional-email.js";

export async function list(query: Query) { const result = await repository.list(query); return paginationResult(result.items, result.total, query); }
export async function search(query: SearchQuery) { const result = await repository.search(query); return paginationResult(result.items, result.total, { ...query, sortDirection: "asc" }); }
export const accountAvailability = (query: AccountAvailabilityQuery) => repository.accountAvailability(query);
export async function get(id: bigint) { const item = await repository.find(id); if (!item) throw new HttpError(404, "Beneficiario no encontrado"); return item; }
function isProseneContext(auth: AuthContext) { return auth.perfiles.includes("PROSENE"); }
export async function options(query: OptionsQuery, auth: AuthContext) { return repository.options(query, isProseneContext(auth)); }
export async function create(data: Create, auth: AuthContext) { return repository.create(data, isProseneContext(auth)); }
export async function update(id: bigint, data: Update, auth: AuthContext) {
  const current = await get(id);
  const incomingEmail = data.beneficiary.correoInstitucional;
  const currentEmail = typeof current.correoInstitucional === "string" ? current.correoInstitucional : current.correoInstitucional ?? null;
  if (incomingEmail === undefined) data = { ...data, beneficiary: { ...data.beneficiary, correoInstitucional: currentEmail } };
  else if (incomingEmail !== currentEmail) data = { ...data, beneficiary: { ...data.beneficiary, correoInstitucional: validateInstitutionalEmail(incomingEmail) } };
  return repository.update(id, data, isProseneContext(auth));
}
export async function state(id: bigint, data: State) { await get(id); return repository.state(id, data); }
export const conditionOptions = repository.conditionOptions;
export async function conditions(id: bigint, query: ConditionQuery) { await get(id); const result = await repository.listConditions(id, query); return paginationResult(result.items, result.total, { ...query, sortDirection: "desc" }); }
export async function createCondition(id: bigint, data: ConditionInput, actor: import("../auth/auth-context.js").AuthContext) { await get(id); return repository.createCondition(id, data, actor); }
export async function updateCondition(id: bigint, conditionId: bigint, data: ConditionInput, actor: import("../auth/auth-context.js").AuthContext) { await get(id); return repository.updateCondition(id, conditionId, data, actor); }
export async function conditionState(id: bigint, conditionId: bigint, state: boolean, actor: import("../auth/auth-context.js").AuthContext) { await get(id); return repository.setConditionState(id, conditionId, state, actor); }
