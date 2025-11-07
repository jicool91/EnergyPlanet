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
          className="flex flex-col items-center justify-center gap-md rounded-2xl border border-state-danger-pill bg-gradient-to-br from-feedback-error/80 via-surface-secondary to-layer-overlay-strong p-xl text-center shadow-elevation-3"
          role="alert"
        >
          <div className="text-hero" role="img" aria-label="Warning">
            ⚠️
          </div>
          <div className="flex flex-col gap-sm">
            <h3 className="flex items-center justify-center gap-sm text-subheading font-bold text-text-primary">
              <span aria-hidden="true">❌</span> Ошибка
            </h3>
            <p className="text-caption text-text-secondary">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={this.handleRetry}
            className="rounded-2xl bg-gradient-to-r from-feedback-success via-accent-cyan to-accent-magenta px-md py-xs-plus text-caption font-semibold uppercase tracking-widest text-surface-primary transition-all duration-200 shadow-glow-lime focus-ring hover:brightness-105"
          >
            Попробовать снова
          </motion.button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
