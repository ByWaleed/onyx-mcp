import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { filtersSchema, httpUrlSchema } from "../schemas.js";
import { runTool } from "../tool-helpers.js";

function isAllowedWebUrl(value: string, allowlist: string[]): boolean {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) return false;
  const hostname = url.hostname.toLowerCase();
  return allowlist.some(
    (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );
}

export function registerSearchTools({
  server,
  client,
  config,
}: ToolContext): void {
  addTool(
    server,
    "onyx_search",
    "Search indexed Onyx knowledge with access controls enforced by Onyx.",
    {
      query: z
        .string()
        .min(1)
        .max(2048)
        .describe("Search query, up to 2,048 characters."),
      filters: filtersSchema.optional(),
      persona_id: z.number().int().nonnegative().optional(),
      provider: z
        .string()
        .optional()
        .describe("Model provider; model is also required."),
      model: z
        .string()
        .optional()
        .describe("Model name; provider is also required."),
      skip_query_expansion: z.boolean().optional(),
    },
    (args) =>
      runTool(() =>
        (() => {
          if ((args.provider === undefined) !== (args.model === undefined)) {
            throw new Error("provider and model must be supplied together");
          }
          const { query, filters, ...options } = args;
          return client.request("/search", {
            method: "POST",
            body: { query, ...filters, ...options },
          });
        })(),
      ),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );

  if (!config.enableWebFetch) return;

  addTool(
    server,
    "onyx_search_tags",
    "Find valid indexed tags for search filtering.",
    {
      match_pattern: z.string().optional(),
      sources: z.array(z.string()).optional(),
      limit: z.number().int().positive().max(1000).optional(),
    },
    (args) =>
      runTool(() => client.request("/query/valid-tags", { query: args })),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_web_search",
    "Search the web through the provider configured in Onyx. This may incur provider costs.",
    {
      queries: z.array(z.string().min(1)).min(1).max(20),
      max_results: z.number().int().positive().max(100).optional(),
    },
    (body) =>
      runTool(() =>
        client.request("/web-search/search-lite", {
          method: "POST",
          body,
        }),
      ),
    { readOnlyHint: true, openWorldHint: true },
  );
  addTool(
    server,
    "onyx_open_urls",
    "Fetch and extract web pages through Onyx.",
    {
      urls: z
        .array(httpUrlSchema)
        .min(1)
        .max(20)
        .refine(
          (urls) =>
            urls.every((url) =>
              isAllowedWebUrl(url, config.webFetchAllowlist ?? []),
            ),
          "Every URL must use HTTPS and match ONYX_MCP_WEB_FETCH_ALLOWLIST",
        ),
    },
    ({ urls }) =>
      runTool(() =>
        client.request("/web-search/open-urls", {
          method: "POST",
          body: { urls },
        }),
      ),
    { readOnlyHint: true, openWorldHint: true },
  );
}
