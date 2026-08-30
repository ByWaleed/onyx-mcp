import { AsyncLocalStorage } from "node:async_hooks";

const signalContext = new AsyncLocalStorage<AbortSignal>();

export function runWithRequestSignal<T>(
  signal: AbortSignal,
  action: () => Promise<T>,
): Promise<T> {
  return signalContext.run(signal, action);
}

export function getRequestSignal(): AbortSignal | undefined {
  return signalContext.getStore();
}
