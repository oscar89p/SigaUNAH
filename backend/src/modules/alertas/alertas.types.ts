import { z } from "zod";

export const alertQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).default(""),
  sortDirection: z.enum(["asc", "desc"]).default("desc")
});

export type AlertQuery = z.infer<typeof alertQuerySchema>;

export type PendingPriority = "INFORMATIVA" | "MEDIA" | "ALTA";

export function classifyPendingPriority(days: number, mediumDays: number, highDays: number): PendingPriority {
  if (days > highDays) return "ALTA";
  if (days >= mediumDays) return "MEDIA";
  return "INFORMATIVA";
}
