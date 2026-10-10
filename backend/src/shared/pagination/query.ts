import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function paginationResult<T>(items: T[], total: number, query: PaginationQuery) {
  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize)
    }
  };
}
