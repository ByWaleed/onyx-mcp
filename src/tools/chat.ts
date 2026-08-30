import { z } from "zod";
import type { ToolContext } from "../register.js";
import { addTool } from "../register.js";
import { filtersSchema } from "../schemas.js";
import { runTool } from "../tool-helpers.js";

export function registerChatTools({
  server,
  client,
  config,
}: ToolContext): void {
  addTool(
    server,
    "onyx_list_chats",
    "List chat sessions owned by the authenticated user.",
    {
      page_size: z.number().int().positive().max(100).optional(),
      project_id: z.number().int().positive().optional(),
      only_non_project_chats: z.boolean().optional(),
      include_failed_chats: z.boolean().optional(),
      before: z.string().datetime().optional(),
    },
    (args) =>
      runTool(() =>
        client.request("/chat/get-user-chat-sessions", { query: args }),
      ),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_get_chat",
    "Get a chat session and its message history.",
    { chat_session_id: z.string().uuid() },
    ({ chat_session_id }) =>
      runTool(() =>
        client.request(`/chat/get-chat-session/${chat_session_id}`),
      ),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_search_chats",
    "Search the authenticated user's chat history.",
    {
      query: z.string().min(1),
      page: z.number().int().positive().optional(),
      page_size: z.number().int().positive().max(100).optional(),
    },
    (args) => runTool(() => client.request("/chat/search", { query: args })),
    { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  );

  if (!config.enableWrite) return;

  addTool(
    server,
    "onyx_create_chat",
    "Create a persistent Onyx chat session.",
    {
      persona_id: z.number().int().nonnegative().optional(),
      description: z.string().max(500).optional(),
      project_id: z.number().int().positive().optional(),
      incognito: z.boolean().optional(),
    },
    (args) =>
      runTool(() =>
        client.request("/chat/create-chat-session", {
          method: "POST",
          body: {
            ...args,
            persona_id: args.persona_id ?? config.defaultPersonaId,
          },
        }),
      ),
    { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  );
  addTool(
    server,
    "onyx_chat",
    "Ask an Onyx agent a question. Creates a persistent session when chat_session_id is omitted. May invoke search, tools, and an LLM.",
    {
      message: z.string().min(1),
      chat_session_id: z.string().uuid().optional(),
      persona_id: z.number().int().nonnegative().optional(),
      filters: filtersSchema.optional(),
      deep_research: z.boolean().optional(),
      allowed_tool_ids: z.array(z.number().int().positive()).optional(),
      forced_tool_id: z.number().int().positive().optional(),
      include_citations: z.boolean().optional(),
    },
    ({ message, chat_session_id, persona_id, filters, ...options }) =>
      runTool(() =>
        client.request("/chat/send-chat-message", {
          method: "POST",
          body: {
            message,
            ...(chat_session_id
              ? { chat_session_id }
              : {
                  chat_session_info: {
                    persona_id: persona_id ?? config.defaultPersonaId,
                  },
                }),
            internal_search_filters: filters,
            stream: false,
            ...options,
          },
        }),
      ),
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  );
  addTool(
    server,
    "onyx_stop_chat",
    "Stop active generation for a chat session.",
    { chat_session_id: z.string().uuid() },
    ({ chat_session_id }) =>
      runTool(() =>
        client.request(`/chat/stop-chat-session/${chat_session_id}`, {
          method: "POST",
        }),
      ),
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  );
  addTool(
    server,
    "onyx_submit_feedback",
    "Add or update feedback for an Onyx chat message.",
    {
      chat_message_id: z.number().int().positive(),
      is_positive: z.boolean().nullable().optional(),
      feedback_text: z.string().max(5000).optional(),
      predefined_feedback: z.string().max(500).optional(),
    },
    (body) =>
      runTool(() => {
        if (body.is_positive === undefined && !body.feedback_text) {
          throw new Error("is_positive or feedback_text is required");
        }
        return client.request("/chat/create-chat-message-feedback", {
          method: "POST",
          body,
        });
      }),
    {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  );

  if (!config.enableDestructive) return;
  addTool(
    server,
    "onyx_delete_chat",
    "Delete one Onyx chat session according to the deployment's retention policy.",
    {
      chat_session_id: z.string().uuid(),
      confirm: z.literal(true).describe("Must be true to confirm deletion."),
    },
    ({ chat_session_id }) =>
      runTool(() =>
        client.request(`/chat/delete-chat-session/${chat_session_id}`, {
          method: "DELETE",
        }),
      ),
    {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  );
}
