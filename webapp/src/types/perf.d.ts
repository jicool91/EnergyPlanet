declare global {
  interface Window {
    __renderMetrics?: {
      app: number;
      safeAreaTop?: number;
      contentSafeAreaTop?: number;
      isFullscreen?: boolean;
    };
    __runDebugCommand?: (command: string) => boolean | void;
    debug_safe_area?: () => void;
    __safeAreaOverride?: {
      safe?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
      content?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>;
    } | null;
    __viewportMetricsOverride?: Partial<{
      height: number;
      stableHeight: number;
      width: number;
      isExpanded: boolean;
      isStateStable: boolean;
      isFullscreen: boolean;
    }> | null;
    __safeAreaStats?: {
      samples: number;
      lastSafeTop?: number;
      lastContentTop?: number;
    };
    __themeStats?: {
      samples: number;
      lastScheme?: 'light' | 'dark';
      lastHeaderColor?: string;
    };
  }
}

export {};
