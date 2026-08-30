import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { z, ZodRawShape } from "zod";
import type { Config } from "./config.js";
import type { OnyxClient } from "./client.js";
import { runWithRequestSignal } from "./request-context.js";

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
  annotations: ToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
): void {
  const completeAnnotations: ToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    ...annotations,
  };
  server.registerTool(
    name,
    {
      description,
      inputSchema: schema,
      annotations: completeAnnotations,
    },
    ((
      args: z.infer<z.ZodObject<T>>,
      extra: RequestHandlerExtra<never, never>,
    ) => runWithRequestSignal(extra.signal, () => handler(args))) as never,
  );
}
