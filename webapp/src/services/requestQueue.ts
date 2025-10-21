type Task<T> = () => Promise<T>;

interface QueueOptions {
  retries?: number;
  baseDelayMs?: number;
}

export class RequestQueue {
  private tail: Promise<void> = Promise.resolve();

  enqueue<T>(task: Task<T>, options: QueueOptions = {}): Promise<T> {
    const retries = options.retries ?? 3;
    const baseDelay = options.baseDelayMs ?? 250;

    const execute = async () => {
      let attempt = 0;
      let lastError: unknown = null;

      while (attempt < retries) {
        try {
          return await task();
        } catch (error) {
          lastError = error;
          attempt += 1;
          if (attempt >= retries) {
            break;
          }
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }

      throw lastError;
    };

    const runPromise = this.tail.then(() => execute());

    this.tail = runPromise
      .then(() => undefined)
      .catch(() => undefined);

    return runPromise;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const postQueue = new RequestQueue();
