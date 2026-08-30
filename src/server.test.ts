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
};

const closeCallbacks: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closeCallbacks.splice(0).map((close) => close()));
});

async function connect(config: Config, fetchImpl: typeof fetch) {
  const server = createServer(config, fetchImpl);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  closeCallbacks.push(() => client.close(), () => server.close());
  return client;
}

describe("MCP server", () => {
  it("defaults to read-only tools", async () => {
    const client = await connect(baseConfig, vi.fn<typeof fetch>());
    const names = (await client.listTools()).tools.map((tool) => tool.name);

    expect(names).toContain("onyx_search");
    expect(names).not.toContain("onyx_chat");
    expect(names).not.toContain("onyx_api_request");
    expect(names).not.toContain("onyx_delete_chat");
  });

  it("uses the current Onyx search request contract", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    const client = await connect(baseConfig, fetchMock);

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
    const client = await connect({ ...baseConfig, enableWrite: true }, fetchMock);
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

  it("enforces raw API administration and deletion gates", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = await connect(
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
    const client = await connect(
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
