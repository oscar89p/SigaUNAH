import "dotenv/config";
import { z } from "zod";

const booleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  DB_SERVER: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(1433),
  DB_DATABASE: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_ENCRYPT: booleanFromString.default(true),
  DB_TRUST_SERVER_CERTIFICATE: booleanFromString.default(false),
  AUTH_SESSION_COOKIE: z.string().min(1).default("siga_unah_session"),
  AUTH_SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(30),
  AUTH_SESSION_MAX_HOURS: z.coerce.number().int().positive().default(8),
  AUTH_COOKIE_SECURE: booleanFromString.default(true),
  AUTH_ALLOWED_ORIGINS: z.string().default("http://localhost:5173")
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
