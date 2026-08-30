import { z } from "zod";

const booleanValue = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((value) => value === "true" || value === "1");

const envSchema = z.object({
  ONYX_API_URL: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" ||
        (url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "::1"].includes(url.hostname))
      );
    }, "ONYX_API_URL must use HTTPS unless it points to a loopback host"),
  ONYX_API_TOKEN: z.string().min(1),
  ONYX_DEFAULT_PERSONA_ID: z.coerce.number().int().nonnegative().default(0),
  ONYX_MCP_ENABLE_WRITE: booleanValue,
  ONYX_MCP_ENABLE_ADMIN: booleanValue,
  ONYX_MCP_ENABLE_DESTRUCTIVE: booleanValue,
  ONYX_MCP_ENABLE_RAW_API: booleanValue,
  ONYX_MCP_ENABLE_WEB_FETCH: booleanValue,
  ONYX_MCP_WEB_FETCH_ALLOWLIST: z.string().optional().default(""),
  ONYX_MCP_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  ONYX_MCP_MAX_RESPONSE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1_000_000),
  ONYX_MCP_MAX_CONCURRENCY: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(8),
  ONYX_MCP_MAX_QUEUE: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(10_000)
    .default(100),
});

export interface Config {
  apiUrl: string;
  apiToken: string;
  defaultPersonaId: number;
  enableWrite: boolean;
  enableAdmin: boolean;
  enableDestructive: boolean;
  enableRawApi: boolean;
  enableWebFetch?: boolean;
  webFetchAllowlist?: string[];
  timeoutMs: number;
  maxResponseBytes: number;
  maxConcurrency?: number;
  maxQueue?: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.parse(env);

  return {
    apiUrl: parsed.ONYX_API_URL.replace(/\/$/, ""),
    apiToken: parsed.ONYX_API_TOKEN,
    defaultPersonaId: parsed.ONYX_DEFAULT_PERSONA_ID,
    enableWrite: parsed.ONYX_MCP_ENABLE_WRITE,
    enableAdmin: parsed.ONYX_MCP_ENABLE_ADMIN,
    enableDestructive: parsed.ONYX_MCP_ENABLE_DESTRUCTIVE,
    enableRawApi: parsed.ONYX_MCP_ENABLE_RAW_API,
    enableWebFetch: parsed.ONYX_MCP_ENABLE_WEB_FETCH,
    webFetchAllowlist: parsed.ONYX_MCP_WEB_FETCH_ALLOWLIST.split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
    timeoutMs: parsed.ONYX_MCP_TIMEOUT_MS,
    maxResponseBytes: parsed.ONYX_MCP_MAX_RESPONSE_BYTES,
    maxConcurrency: parsed.ONYX_MCP_MAX_CONCURRENCY,
    maxQueue: parsed.ONYX_MCP_MAX_QUEUE,
  };
}
