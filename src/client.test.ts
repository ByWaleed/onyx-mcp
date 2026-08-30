import { describe, expect, it, vi } from "vitest";
import { OnyxClient } from "./client.js";
import type { Config } from "./config.js";

const config: Config = {
  apiUrl: "https://onyx.example/api",
  apiToken: "secret-token",
  defaultPersonaId: 0,
  enableWrite: false,
  enableAdmin: false,
  enableDestructive: false,
  enableRawApi: false,
  timeoutMs: 1_000,
  maxResponseBytes: 10_000,
  maxConcurrency: 8,
};

describe("OnyxClient", () => {
  it("sends bearer authentication and JSON requests", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = new OnyxClient(config, fetchMock);

    await expect(
      client.request("/search", { method: "POST", body: { query: "test" } }),
    ).resolves.toEqual({ ok: true });

    const [url, request] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://onyx.example/api/search");
    expect(new Headers(request?.headers).get("Authorization")).toBe(
      "Bearer secret-token",
    );
    expect(request?.body).toBe(JSON.stringify({ query: "test" }));
  });

  it("does not expose authorization headers in API errors", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ detail: "Forbidden" }), { status: 403 }),
      );
    const client = new OnyxClient(config, fetchMock);

    await expect(client.request("/me")).rejects.toThrow(
      "Onyx request failed: Forbidden",
    );
    await expect(client.request("/me")).rejects.not.toThrow("secret-token");
  });

  it.each([
    "/https://evil.example/steal",
    "/\\evil.example/steal",
    "/../admin",
    "/%2e%2e/admin",
  ])("rejects paths outside the configured API base: %s", async (path) => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = new OnyxClient(config, fetchMock);

    await expect(client.request(path)).rejects.toThrow(
      "must stay within the configured API base URL",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops reading a streamed response at the byte limit", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(8_000));
        controller.enqueue(new Uint8Array(8_000));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(stream, { status: 200 }));
    const client = new OnyxClient(config, fetchMock);

    await expect(client.request("/search")).rejects.toThrow(
      "exceeded 10000 bytes",
    );
    expect(cancelled).toBe(true);
  });

  it("limits concurrent requests", async () => {
    let releaseFirst!: () => void;
    const firstResponse = new Promise<Response>((resolve) => {
      releaseFirst = () => resolve(Response.json({ first: true }));
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => firstResponse)
      .mockResolvedValueOnce(Response.json({ second: true }));
    const client = new OnyxClient({ ...config, maxConcurrency: 1 }, fetchMock);

    const first = client.request("/first");
    const second = client.request("/second");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    releaseFirst();
    await expect(first).resolves.toEqual({ first: true });
    await expect(second).resolves.toEqual({ second: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects an already-cancelled request before network access", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = new OnyxClient(config, fetchMock);
    const controller = new AbortController();
    controller.abort();

    const { runWithRequestSignal } = await import("./request-context.js");
    await expect(
      runWithRequestSignal(controller.signal, () => client.request("/search")),
    ).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("removes an already-cancelled request from the concurrency queue", async () => {
    let releaseFirst!: () => void;
    const firstResponse = new Promise<Response>((resolve) => {
      releaseFirst = () => resolve(Response.json({ first: true }));
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => firstResponse);
    const client = new OnyxClient({ ...config, maxConcurrency: 1 }, fetchMock);
    const first = client.request("/first");
    const controller = new AbortController();
    const { runWithRequestSignal } = await import("./request-context.js");
    const queued = runWithRequestSignal(controller.signal, () =>
      client.request("/queued"),
    );
    controller.abort();

    await expect(queued).rejects.toThrow();
    releaseFirst();
    await expect(first).resolves.toEqual({ first: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
