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
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-md rounded-2xl border border-[rgba(255,51,51,0.45)] bg-gradient-to-br from-[rgba(48,14,24,0.9)] via-[rgba(24,8,18,0.92)] to-[rgba(12,10,36,0.88)] p-xl text-center shadow-elevation-3"
          role="alert"
        >
          <div className="text-3xl" role="img" aria-label="Warning">
            ⚠️
          </div>
          <div className="flex flex-col gap-sm">
            <h3 className="flex items-center justify-center gap-sm text-subheading font-bold text-token-primary">
              <span aria-hidden="true">❌</span> Ошибка
            </h3>
            <p className="text-caption text-[var(--color-text-secondary)]">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={this.handleRetry}
            className="rounded-2xl bg-gradient-to-r from-[rgba(0,255,136,0.9)] via-[rgba(0,217,255,0.9)] to-[rgba(120,63,255,0.85)] px-md py-xs-plus text-caption font-semibold uppercase tracking-[0.1em] text-[var(--color-surface-primary)] transition-all duration-200 shadow-glow-lime focus-ring hover:brightness-105"
          >
            Попробовать снова
          </motion.button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
