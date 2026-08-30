import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { runTool } from "../tool-helpers.js";

export function registerSystemTools({
  server,
  client,
  config,
}: ToolContext): void {
  addTool(
    server,
    "onyx_health",
    "Check whether the Onyx API is healthy.",
    {},
    () => runTool(() => client.request("/health")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_version",
    "Get the Onyx server version.",
    {},
    () => runTool(() => client.request("/version")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_whoami",
    "Get the authenticated Onyx user.",
    {},
    () => runTool(() => client.request("/me")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_permissions",
    "Get permissions granted to the authenticated Onyx user.",
    {},
    () => runTool(() => client.request("/me/permissions")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_capabilities",
    "Show this MCP server's enabled safety profiles and default assistant.",
    {},
    () =>
      runTool(() =>
        Promise.resolve({
          write: config.enableWrite,
          admin: config.enableAdmin,
          destructive: config.enableDestructive,
          rawApi: config.enableRawApi,
          webFetch: config.enableWebFetch ?? false,
          defaultPersonaId: config.defaultPersonaId,
        }),
      ),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_list_agents",
    "List Onyx agents available to the authenticated user.",
    {
      page_num: z.number().int().nonnegative().optional(),
      page_size: z.number().int().positive().max(100).optional(),
      include_deleted: z.boolean().optional(),
      get_editable: z.boolean().optional(),
      include_default: z.boolean().optional(),
    },
    (args) => runTool(() => client.request("/agents", { query: args })),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_get_agent",
    "Get one Onyx agent by ID.",
    { persona_id: z.number().int().nonnegative() },
    ({ persona_id }) => runTool(() => client.request(`/persona/${persona_id}`)),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_list_tools",
    "List tools configured in Onyx.",
    {},
    () => runTool(() => client.request("/tool")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_list_document_sets",
    "List document sets visible to the authenticated user.",
    { editable_only: z.boolean().optional() },
    ({ editable_only }) =>
      runTool(() =>
        client.request("/manage/document-set", {
          query: { get_editable: editable_only },
        }),
      ),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_list_indexed_sources",
    "List source types indexed by Onyx.",
    {},
    () => runTool(() => client.request("/manage/indexed-sources")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_connector_status",
    "Get status summaries for Onyx connectors.",
    {},
    () => runTool(() => client.request("/manage/connector-status")),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
}
