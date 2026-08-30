import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { runTool } from "../tool-helpers.js";

export function registerProjectTools({ server, client, config }: ToolContext): void {
  addTool(server, "onyx_list_projects", "List Onyx projects.", {}, () =>
    runTool(() => client.request("/user/projects")),
  );
  addTool(
    server,
    "onyx_get_project",
    "Get an Onyx project and its details.",
    { project_id: z.number().int().positive() },
    ({ project_id }) =>
      runTool(() => client.request(`/user/projects/${project_id}/details`)),
  );
  addTool(
    server,
    "onyx_list_project_files",
    "List files linked to an Onyx project.",
    { project_id: z.number().int().positive() },
    ({ project_id }) =>
      runTool(() => client.request(`/user/projects/files/${project_id}`)),
  );
  addTool(
    server,
    "onyx_get_file",
    "Get metadata and processing status for an Onyx user file.",
    { file_id: z.string().uuid() },
    ({ file_id }) =>
      runTool(() => client.request(`/user/projects/file/${encodeURIComponent(file_id)}`)),
  );

  if (!config.enableWrite) return;
  addTool(
    server,
    "onyx_create_project",
    "Create an Onyx project.",
    { name: z.string().min(1).max(255) },
    ({ name }) =>
      runTool(() =>
        client.request("/user/projects/create", {
          method: "POST",
          query: { name },
        }),
      ),
  );
  addTool(
    server,
    "onyx_update_project",
    "Update an Onyx project's name or description.",
    {
      project_id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(255).optional(),
    },
    ({ project_id, ...body }) =>
      runTool(() =>
        client.request(`/user/projects/${project_id}`, { method: "PATCH", body }),
      ),
  );
  addTool(
    server,
    "onyx_set_project_instructions",
    "Set the instructions used by an Onyx project.",
    {
      project_id: z.number().int().positive(),
      instructions: z.string().max(20_000),
    },
    ({ project_id, instructions }) =>
      runTool(() =>
        client.request(`/user/projects/${project_id}/instructions`, {
          method: "POST",
          body: { instructions },
        }),
      ),
  );

  if (!config.enableDestructive) return;
  addTool(
    server,
    "onyx_delete_project",
    "Permanently delete an Onyx project. This action is destructive.",
    {
      project_id: z.number().int().positive(),
      confirm: z.literal(true),
    },
    ({ project_id }) =>
      runTool(() =>
        client.request(`/user/projects/${project_id}`, { method: "DELETE" }),
      ),
  );
}
