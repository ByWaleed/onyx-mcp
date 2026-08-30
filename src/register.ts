import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z, type ZodRawShape } from "zod";
import type { Config } from "./config.js";
import type { OnyxClient } from "./client.js";

export interface ToolContext {
  server: McpServer;
  client: OnyxClient;
  config: Config;
}

export function addTool<T extends ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  schema: T,
  handler: (args: z.infer<z.ZodObject<T>>) => Promise<CallToolResult>,
  annotations: ToolAnnotations = {},
): void {
  server.registerTool(
    name,
    { description, inputSchema: schema, annotations },
    handler as never,
  );
}
