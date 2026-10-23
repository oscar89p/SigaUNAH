import argon2 from "argon2";

import { HttpError } from "../../shared/errors/http-error.js";
import * as repository from "./usuarios.repository.js";
import { paginationResult } from "../../shared/pagination/query.js";
import type { AuditContext } from "./usuarios.repository.js";
import type { Create, Query, State, Update } from "./usuarios.types.js";

export async function list(query: Query) {
  const result = await repository.list(query);
  return paginationResult(result.items, result.total, query);
}
export const profiles = repository.profiles;
export async function get(id: bigint) { const user = await repository.find(id); if (!user) throw new HttpError(404, "Usuario no encontrado"); return user; }
export async function getPersonalInformation(idUsuario: number) { const user = await repository.findPersonalInformation(idUsuario); if (!user) throw new HttpError(404, "Información de usuario no encontrada"); return user; }
export async function create(data: Create, context: AuditContext) { return repository.create(data, context, await argon2.hash(data.password, { type: argon2.argon2id })); }
export async function update(id: bigint, data: Update, context: AuditContext) {
  const user = await get(id);
  if (data.password && user.tipoAutenticacion !== "LOCAL") throw new HttpError(400, "Solo se pueden cambiar contraseñas de usuarios locales");
  return repository.update(id, data, context, data.password ? await argon2.hash(data.password, { type: argon2.argon2id }) : undefined);
}
export async function state(id: bigint, data: State, context: AuditContext) { await get(id); return repository.state(id, data, context); }
