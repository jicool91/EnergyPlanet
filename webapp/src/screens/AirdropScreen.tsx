import { useCallback, useEffect, useState } from 'react';
import {
  TabPageSurface,
  ClanComingSoon,
  AirdropTimeline,
  Surface,
  Text,
  Button,
} from '@/components';
import type { AirdropEvent } from '@/components/airdrop/AirdropTimeline';
import { useNotification } from '@/hooks/useNotification';
import { fetchAirdropEventsPayload, subscribeAirdropReminder } from '@/services/events';

export function AirdropScreen() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [events, setEvents] = useState<AirdropEvent[]>([]);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAirdrops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchAirdropEventsPayload();
      setEvents(payload.events);
      setTimezone(payload.timezone ?? 'UTC');
    } catch (err) {
      console.error('Failed to load airdrop events', err);
      setError('Не удалось загрузить airdrop-события.');
      setEvents([]);
      setTimezone('UTC');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAirdrops().catch(() => undefined);
  }, [loadAirdrops]);

  const handleReminder = useCallback(
    (eventId: string) => {
      subscribeAirdropReminder(eventId)
        .then(() => notifySuccess('Напоминание сохранено'))
        .catch(err => {
          console.error('Failed to save airdrop reminder', err);
          notifyError('Не удалось сохранить напоминание');
        });
    },
    [notifyError, notifySuccess]
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-text-primary">Airdrop</h1>
        <p className="text-body text-text-secondary">
          Сезонные события и будущие коллаборации появятся здесь. Следите за обновлениями!
        </p>
        <p className="text-caption text-text-tertiary">Часовой пояс расписания: {timezone}</p>
      </header>

      {error && (
        <Surface
          tone="secondary"
          border="strong"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-3"
        >
          <Text variant="body" tone="danger">
            {error}
          </Text>
          <Button variant="secondary" size="sm" onClick={loadAirdrops} disabled={loading}>
            Повторить
          </Button>
        </Surface>
      )}

      {loading ? (
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="text-body text-text-secondary"
        >
          Загружаем события…
        </Surface>
      ) : (
        <AirdropTimeline events={events} onSetReminder={handleReminder} />
      )}

      <TabPageSurface className="mt-2">
        <ClanComingSoon />
      </TabPageSurface>
    </div>
  );
}
