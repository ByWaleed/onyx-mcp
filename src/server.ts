import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";
import { OnyxClient } from "./client.js";
import { registerAdminTools } from "./tools/admin.js";
import { registerChatTools } from "./tools/chat.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerRawApiTool } from "./tools/raw.js";
import { registerSearchTools } from "./tools/search.js";
import { registerSystemTools } from "./tools/system.js";

export { OnyxClient } from "./client.js";
export { loadConfig, type Config } from "./config.js";

export function createServer(config: Config, fetchImpl: typeof fetch = fetch): McpServer {
  const server = new McpServer({ name: "onyx-mcp", version: "0.1.0" });
  const client = new OnyxClient(config, fetchImpl);
  const context = { server, client, config };

  registerSystemTools(context);
  registerSearchTools(context);
  registerChatTools(context);
  registerProjectTools(context);
  registerAdminTools(context);
  registerRawApiTool(context);

  return server;
}
