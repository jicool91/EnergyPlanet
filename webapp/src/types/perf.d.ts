declare global {
  interface Window {
    __renderMetrics?: {
      app: number;
    };
  }
}

export {};
