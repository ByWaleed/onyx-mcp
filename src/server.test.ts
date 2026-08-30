import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Config } from "./config.js";
import { createServer } from "./server.js";

const baseConfig: Config = {
  apiUrl: "https://onyx.example/api",
  apiToken: "token",
  defaultPersonaId: 0,
  enableWrite: false,
  enableAdmin: false,
  enableDestructive: false,
  enableRawApi: false,
  timeoutMs: 1_000,
  maxResponseBytes: 10_000,
  maxConcurrency: 8,
};

const closeCallbacks: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closeCallbacks.splice(0).map((close) => close()));
});

async function connect(config: Config, fetchImpl: typeof fetch) {
  const server = createServer(config, fetchImpl);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  closeCallbacks.push(
    () => client.close(),
    () => server.close(),
  );
  return { client, server };
}

describe("MCP server", () => {
  it("defaults to read-only tools", async () => {
    const { client } = await connect(baseConfig, vi.fn<typeof fetch>());
    const tools = (await client.listTools()).tools;
    const names = tools.map((tool) => tool.name);

    expect(names).toContain("onyx_search");
    expect(names).not.toContain("onyx_chat");
    expect(names).not.toContain("onyx_api_request");
    expect(names).not.toContain("onyx_delete_chat");
    expect(
      tools.find((tool) => tool.name === "onyx_health")?.annotations,
    ).toMatchObject({
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(client.getServerVersion()).toMatchObject({
      name: "onyx-mcp",
      title: "Onyx MCP",
      version: "0.1.1",
    });
  });

  it("uses the current Onyx search request contract", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      );
    const { client } = await connect(baseConfig, fetchMock);

    await client.callTool({
      name: "onyx_search",
      arguments: {
        query: "latest meeting",
        filters: { document_sets: ["Meetings"], sources: ["file"] },
        persona_id: 1,
      },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({
      query: "latest meeting",
      document_sets: ["Meetings"],
      sources: ["file"],
      persona_id: 1,
    });
  });

  it("continues a chat without resetting its parent message", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ answer: "ok", top_documents: [] }), {
        status: 200,
      }),
    );
    const { client } = await connect(
      { ...baseConfig, enableWrite: true },
      fetchMock,
    );
    const chatSessionId = "575dc891-06f5-44e8-9bae-24a77fbc9c8f";

    await client.callTool({
      name: "onyx_chat",
      arguments: { message: "continue", chat_session_id: chatSessionId },
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.chat_session_id).toBe(chatSessionId);
    expect(body).not.toHaveProperty("parent_message_id");
    expect(body.stream).toBe(false);
  });

  it("cancels the downstream Onyx request when the MCP call is cancelled", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    const { server } = await connect(baseConfig, fetchMock);
    const controller = new AbortController();

    const handler = (
      server as unknown as {
        _registeredTools: Record<
          string,
          {
            handler: (
              args: unknown,
              extra: { signal: AbortSignal },
            ) => Promise<unknown>;
          }
        >;
      }
    )._registeredTools.onyx_search?.handler;
    expect(handler).toBeDefined();
    const request = handler!(
      { query: "cancel me" },
      { signal: controller.signal },
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    controller.abort();

    await expect(request).resolves.toMatchObject({
      isError: true,
      content: [{ type: "text", text: "Onyx request was cancelled" }],
    });
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it("rejects incomplete model overrides before calling Onyx", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { client } = await connect(baseConfig, fetchMock);

    const result = await client.callTool({
      name: "onyx_search",
      arguments: { query: "test", provider: "openai" },
    });

    expect(result.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("enforces raw API administration and deletion gates", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { client } = await connect(
      { ...baseConfig, enableWrite: true, enableRawApi: true },
      fetchMock,
    );

    const adminResult = await client.callTool({
      name: "onyx_api_request",
      arguments: { method: "GET", path: "/manage/admin/connector" },
    });
    expect(adminResult.isError).toBe(true);

    const deleteResult = await client.callTool({
      name: "onyx_api_request",
      arguments: { method: "DELETE", path: "/chat/delete-all-chat-sessions" },
    });
    expect(deleteResult.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["GET", "/manage/users", {}],
    ["POST", "/user/pats", {}],
    ["GET", "/%61dmin/api-key", {}],
  ])("requires admin access for raw %s %s", async (method, path, extra) => {
    const fetchMock = vi.fn<typeof fetch>();
    const { client } = await connect(
      { ...baseConfig, enableWrite: true, enableRawApi: true },
      fetchMock,
    );

    const result = await client.callTool({
      name: "onyx_api_request",
      arguments: { method, path, ...extra },
    });

    expect(result.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
