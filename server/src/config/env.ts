import "dotenv/config";
import { z } from "zod";

const refreshExpirySchema = z
  .string()
  .regex(
    /^\d+[smhd]$/,
    "JWT_REFRESH_EXPIRES_IN must use a whole-number s, m, h, or d duration (for example: 7d)"
  );

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive(),
  CLIENT_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().min(1),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters long"),
  JWT_REFRESH_EXPIRES_IN: refreshExpirySchema,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(result.error.issues);
  process.exit(1);
}

export const env = result.data;

const refreshExpiryMatch = /^(\d+)([smhd])$/.exec(
  env.JWT_REFRESH_EXPIRES_IN
)!;

const refreshExpiryUnits: Record<(typeof refreshExpiryMatch)[2], number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export const refreshTokenLifetimeMs =
  Number(refreshExpiryMatch[1]) * refreshExpiryUnits[refreshExpiryMatch[2]];
