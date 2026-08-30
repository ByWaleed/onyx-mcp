import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("defaults to a read-only profile and persona zero", () => {
    const config = loadConfig({
      ONYX_API_URL: "https://onyx.example/api/",
      ONYX_API_TOKEN: "token",
    });

    expect(config.apiUrl).toBe("https://onyx.example/api");
    expect(config.defaultPersonaId).toBe(0);
    expect(config.enableWrite).toBe(false);
    expect(config.enableAdmin).toBe(false);
    expect(config.enableDestructive).toBe(false);
  });

  it("parses explicit capability opt-ins", () => {
    const config = loadConfig({
      ONYX_API_URL: "https://onyx.example/api",
      ONYX_API_TOKEN: "token",
      ONYX_MCP_ENABLE_WRITE: "true",
      ONYX_MCP_ENABLE_ADMIN: "1",
      ONYX_MCP_ENABLE_DESTRUCTIVE: "false",
    });

    expect(config.enableWrite).toBe(true);
    expect(config.enableAdmin).toBe(true);
    expect(config.enableDestructive).toBe(false);
  });

  it("rejects plaintext remote API URLs", () => {
    expect(() =>
      loadConfig({
        ONYX_API_URL: "http://onyx.example/api",
        ONYX_API_TOKEN: "token",
      }),
    ).toThrow("must use HTTPS");

    expect(() =>
      loadConfig({
        ONYX_API_URL: "http://localhost:3000/api",
        ONYX_API_TOKEN: "token",
      }),
    ).not.toThrow();
  });
});
