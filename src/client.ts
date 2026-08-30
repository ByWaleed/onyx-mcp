import type { Config } from "./config.js";
import { OnyxApiError } from "./errors.js";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

function addQuery(url: URL, query: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
}

export class OnyxClient {
  constructor(
    private readonly config: Config,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async request<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const baseUrl = new URL(`${this.config.apiUrl}/`);
    const url = new URL(
      path.startsWith("/") ? path.slice(1) : path,
      baseUrl,
    );
    const apiPrefix = baseUrl.pathname.endsWith("/")
      ? baseUrl.pathname
      : `${baseUrl.pathname}/`;
    if (url.origin !== baseUrl.origin || !`${url.pathname}/`.startsWith(apiPrefix)) {
      throw new Error("Onyx API path must stay within the configured API base URL");
    }
    if (options.query) addQuery(url, options.query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: `Bearer ${this.config.apiToken}`,
      ...options.headers,
    };
    let body: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    try {
      const requestInit: RequestInit = {
        method: options.method ?? "GET",
        headers,
        signal: controller.signal,
        ...(body === undefined ? {} : { body }),
      };
      const response = await this.fetchImpl(url, requestInit);
      const declaredLength = Number(response.headers.get("content-length"));
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > this.config.maxResponseBytes
      ) {
        controller.abort();
        throw new OnyxApiError(
          `Onyx response exceeded ${this.config.maxResponseBytes} bytes`,
          response.status,
        );
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.byteLength;
          if (receivedBytes > this.config.maxResponseBytes) {
            await reader.cancel();
            controller.abort();
            throw new OnyxApiError(
              `Onyx response exceeded ${this.config.maxResponseBytes} bytes`,
              response.status,
            );
          }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(receivedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const text = new TextDecoder().decode(bytes);

      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const detail =
          typeof data === "object" && data !== null && "detail" in data
            ? String(data.detail)
            : response.statusText;
        throw new OnyxApiError(
          `Onyx request failed: ${detail}`,
          response.status,
          data,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof OnyxApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Onyx request timed out after ${this.config.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
