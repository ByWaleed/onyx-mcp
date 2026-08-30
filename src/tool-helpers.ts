import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { safeErrorMessage } from "./errors.js";

export function success(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: { result: data },
  };
}

export function failure(error: unknown): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: safeErrorMessage(error) }],
  };
}

export async function runTool(
  action: () => Promise<unknown>,
): Promise<CallToolResult> {
  try {
    return success(await action());
  } catch (error) {
    return failure(error);
  }
}
