import { isAxiosError } from 'axios';

export interface DescribedError {
  status: number | null;
  message: string;
}

export function describeError(
  error: unknown,
  fallbackMessage = 'Произошла ошибка'
): DescribedError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const upstreamMessage =
      (error.response?.data as { message?: string })?.message || error.message;
    return {
      status,
      message: upstreamMessage ?? fallbackMessage,
    };
  }

  if (error instanceof Error) {
    return { status: null, message: error.message || fallbackMessage };
  }

  return { status: null, message: fallbackMessage };
}
