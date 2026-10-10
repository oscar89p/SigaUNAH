import { z } from "zod";

export const loginSchema = z.object({
  usuario: z.string().trim().min(1).max(90),
  password: z.string().min(1).max(200)
});

export type LoginRequest = z.infer<typeof loginSchema>;
