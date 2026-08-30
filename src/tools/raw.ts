import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { rawPathSchema } from "../schemas.js";
import { runTool } from "../tool-helpers.js";

export function registerRawApiTool({
  server,
  client,
  config,
}: ToolContext): void {
  if (!config.enableRawApi) return;

  addTool(
    server,
    "onyx_api_request",
    "Call a deployment-specific Onyx API endpoint. Read requests need raw API access. Mutating requests also need the matching write, admin, and destructive profiles. Prefer a first-class tool when available.",
    {
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
      path: rawPathSchema,
      query: z.record(z.unknown()).optional(),
      body: z.unknown().optional(),
      confirm: z.boolean().optional(),
    },
    ({ method, path, query, body, confirm }) =>
      runTool(async () => {
        const mutating = method !== "GET";
        const destructive = method !== "GET";
        if (!config.enableAdmin) {
          throw new Error(
            "Raw API requests require ONYX_MCP_ENABLE_ADMIN=true",
          );
        }
        if (mutating && !config.enableWrite) {
          throw new Error(
            "Mutating raw API requests require ONYX_MCP_ENABLE_WRITE=true",
          );
        }
        if (destructive && !config.enableDestructive) {
          throw new Error(
            "Destructive raw API requests require ONYX_MCP_ENABLE_DESTRUCTIVE=true",
          );
        }
        if (destructive && confirm !== true) {
          throw new Error("Destructive raw API requests require confirm=true");
        }
        return client.request(path, {
          method,
          ...(query === undefined ? {} : { query }),
          ...(body === undefined ? {} : { body }),
        });
      }),
    { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
  );
}
