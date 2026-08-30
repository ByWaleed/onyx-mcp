import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { filtersSchema } from "../schemas.js";
import { runTool } from "../tool-helpers.js";

export function registerSearchTools({ server, client }: ToolContext): void {
  addTool(
    server,
    "onyx_search",
    "Search indexed Onyx knowledge with access controls enforced by Onyx.",
    {
      query: z.string().min(1),
      filters: filtersSchema.optional(),
      persona_id: z.number().int().nonnegative().optional(),
      provider: z.string().optional(),
      model: z.string().optional(),
      skip_query_expansion: z.boolean().optional(),
    },
    ({ query, filters, ...options }) =>
      runTool(() =>
        client.request("/search", {
          method: "POST",
          body: {
            query,
            ...filters,
            ...options,
          },
        }),
      ),
  );
  addTool(
    server,
    "onyx_search_tags",
    "Find valid indexed tags for search filtering.",
    {
      match_pattern: z.string().optional(),
      sources: z.array(z.string()).optional(),
      limit: z.number().int().positive().max(1000).optional(),
    },
    (args) => runTool(() => client.request("/query/valid-tags", { query: args })),
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
    { urls: z.array(z.string().url()).min(1).max(20) },
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
