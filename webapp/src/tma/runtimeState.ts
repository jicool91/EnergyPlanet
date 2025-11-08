import type { TmaRuntimeContextValue } from '@/providers/TmaSdkProvider';

let runtime: TmaRuntimeContextValue | null = null;

export function setTmaRuntime(value: TmaRuntimeContextValue | null): void {
  runtime = value;
}

export function getTmaRuntimeSnapshot(): TmaRuntimeContextValue | null {
  return runtime;
}
