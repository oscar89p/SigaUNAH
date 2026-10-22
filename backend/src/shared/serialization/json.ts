/** Serializes audit/API payloads without losing precision for SQL BIGINT values. */
export function stringifyJsonSafe(value: unknown): string | null {
  if (value == null) return null;
  return JSON.stringify(value, (_key, nestedValue: unknown) => typeof nestedValue === "bigint" ? nestedValue.toString(10) : nestedValue) ?? null;
}
