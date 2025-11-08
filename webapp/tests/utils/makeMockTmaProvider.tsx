import type { ReactNode } from 'react';
import { MockTmaProvider } from '@/providers/MockTmaProvider';

export function withMockTmaProvider(children: ReactNode) {
  return <MockTmaProvider>{children}</MockTmaProvider>;
}
