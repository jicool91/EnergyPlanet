import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-text-destructive)]/40 text-center"
          role="alert"
        >
          <div className="text-3xl" role="img" aria-label="Warning">
            ⚠️
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-token-primary flex items-center justify-center gap-2">
              <span aria-hidden="true">❌</span> Ошибка
            </h3>
            <p className="text-sm text-[var(--color-text-destructive)]/80">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-[var(--color-success)] hover:brightness-105 text-[var(--color-surface-primary)] text-sm font-medium transition-colors focus-ring"
          >
            Попробовать снова
          </motion.button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
