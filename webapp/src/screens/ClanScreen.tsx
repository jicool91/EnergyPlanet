import { useCallback, useEffect, useState } from 'react';
import { TabPageSurface, ClanComingSoon, Surface, Text, Button } from '@/components';
import { useNotification } from '@/hooks/useNotification';
import { apiClient } from '@/services/apiClient';
import { logClientEvent } from '@/services/telemetry';

const INTEREST_OPTIONS = [
  { id: 'raids', label: 'Приватные рейды' },
  { id: 'trading', label: 'Общий банк Stars' },
  { id: 'wars', label: 'Сезонные войны' },
];

export function ClanScreen() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [handle, setHandle] = useState('');
  const [interest, setInterest] = useState<string>(INTEREST_OPTIONS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    logClientEvent('clan_screen_view');
  }, []);

  const handleOpenUpdates = useCallback(() => {
    logClientEvent('clan_updates_click');
    window.open('https://t.me/energy_planet', '_blank');
  }, []);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!handle.trim()) {
        notifyError('Укажите Telegram @username, чтобы мы могли связаться.');
        return;
      }
      setSubmitting(true);
      apiClient
        .post('/api/v1/clan/waitlist', { handle: handle.trim(), interest })
        .then(() => {
          setSubmitted(true);
          notifySuccess('Вы в списке ожидания — спасибо!');
          logClientEvent('clan_waitlist_signup', { interest });
        })
        .catch(err => {
          console.error('Failed to submit clan waitlist', err);
          notifyError('Не удалось сохранить заявку. Попробуйте позже.');
        })
        .finally(() => setSubmitting(false));
    },
    [handle, interest, notifyError, notifySuccess]
  );

  return (
    <TabPageSurface className="gap-4">
      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="grid gap-6 md:grid-cols-2 md:items-center"
      >
        <div className="flex flex-col gap-3">
          <Text variant="title" weight="semibold">
            Кланы почти готовы
          </Text>
          <Text variant="body" tone="secondary">
            Собирайте до 50 друзей, делитесь бустами и участвуйте в сезонах против других кланов.
            Подпишитесь на вейтлист — мы пригласим вас в числе первых.
          </Text>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(option => (
              <span
                key={option.id}
                className="rounded-full border border-border-layer px-3 py-1 text-caption text-text-secondary"
              >
                {option.label}
              </span>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={handleOpenUpdates}>
            Узнать о запуске
          </Button>
        </div>
        <Surface
          tone="overlay"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="2xl"
          className="flex flex-col gap-4"
        >
          <Text variant="body" weight="semibold">
            Станьте бета-лидером
          </Text>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-bodySm text-text-secondary">
              Telegram @username
              <input
                type="text"
                value={handle}
                onChange={event => setHandle(event.target.value)}
                placeholder="@energy_player"
                className="rounded-2xl border border-border-layer bg-transparent px-4 py-3 text-body text-text-primary focus:border-accent-gold focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 text-bodySm text-text-secondary">
              Что интересует больше всего?
              <select
                value={interest}
                onChange={event => setInterest(event.target.value)}
                className="rounded-2xl border border-border-layer bg-transparent px-4 py-3 text-body text-text-primary focus:border-accent-gold focus:outline-none"
              >
                {INTEREST_OPTIONS.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="primary" size="md" disabled={submitting || submitted}>
              {submitted ? 'Заявка отправлена' : 'Встать в очередь'}
            </Button>
          </form>
        </Surface>
      </Surface>
      <ClanComingSoon />
    </TabPageSurface>
  );
}
