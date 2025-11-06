import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ChatScreen } from '@/screens/ChatScreen';

export function renderChatPreview(container: HTMLElement, _params: URLSearchParams) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatScreen />
      </MemoryRouter>
    </StrictMode>
  );
}
