import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { runTool } from "../tool-helpers.js";

export function registerAdminTools({ server, client, config }: ToolContext): void {
  if (!config.enableAdmin) return;

  addTool(server, "onyx_admin_list_connectors", "List configured Onyx connectors.", {}, () =>
    runTool(() => client.request("/manage/admin/connector")),
  );
  addTool(
    server,
    "onyx_admin_connector_status",
    "Get detailed indexing status for Onyx connectors.",
    {},
    () => runTool(() => client.request("/manage/admin/connector/status")),
  );
  addTool(server, "onyx_admin_list_credentials", "List credential metadata. Secret values are controlled and masked by Onyx.", {}, () =>
    runTool(() => client.request("/manage/admin/credential")),
  );
  addTool(server, "onyx_admin_list_users", "List users managed by this Onyx deployment.", {}, () =>
    runTool(() => client.request("/manage/users")),
  );
  addTool(server, "onyx_admin_list_agents", "List agents with administrative metadata.", {}, () =>
    runTool(() => client.request("/admin/agents")),
  );
  addTool(server, "onyx_admin_list_ingested_documents", "List documents added through the direct ingestion API.", {}, () =>
    runTool(() => client.request("/onyx-api/ingestion")),
  );

  if (!config.enableWrite) return;
  addTool(
    server,
    "onyx_admin_ingest_document",
    "Create or update a document through Onyx's direct ingestion API. This changes the search index.",
    {
      document: z.object({
        id: z.string().optional(),
        semantic_identifier: z.string().min(1),
        sections: z
          .array(
            z.object({
              type: z.literal("text"),
              text: z.string(),
              link: z.string().url().nullable().optional(),
              heading: z.string().nullable().optional(),
            }),
          )
          .min(1),
        source: z.string().optional(),
        metadata: z.record(z.union([z.string(), z.array(z.string())])),
        title: z.string().nullable().optional(),
        doc_updated_at: z.string().datetime().optional(),
        doc_created_at: z.string().datetime().optional(),
      }),
      cc_pair_id: z.number().int().positive().optional(),
    },
    ({ document, cc_pair_id }) =>
      runTool(() =>
        client.request("/onyx-api/ingestion", {
          method: "POST",
          body: { document, cc_pair_id },
        }),
      ),
  );
  addTool(
    server,
    "onyx_admin_run_connector",
    "Start one connector indexing run. This can consume significant resources.",
    {
      connector_id: z.number().int().positive(),
      credential_ids: z.array(z.number().int().positive()).optional(),
      from_beginning: z.boolean().optional(),
    },
    (body) =>
      runTool(() =>
        client.request("/manage/admin/connector/run-once", {
          method: "POST",
          body,
        }),
      ),
  );

  if (!config.enableDestructive) return;
  addTool(
    server,
    "onyx_admin_delete_ingested_document",
    "Delete a document created through the direct ingestion API. This action is destructive.",
    { document_id: z.string().min(1), confirm: z.literal(true) },
    ({ document_id }) =>
      runTool(() =>
        client.request(`/onyx-api/ingestion/${encodeURIComponent(document_id)}`, {
          method: "DELETE",
        }),
      ),
  );
}
