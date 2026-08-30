export class OnyxApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "OnyxApiError";
  }
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof OnyxApiError) {
    return `${error.message} (HTTP ${error.status})`;
  }

  return error instanceof Error ? error.message : "Unknown error";
}
