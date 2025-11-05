import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { Badge } from '../Badge';
import { useReferralStore } from '@/store/referralStore';
import { useNotification } from '@/hooks/useNotification';
import { formatNumberWithSpaces } from '@/utils/number';
import { logClientEvent } from '@/services/telemetry';

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2 w-full rounded-full bg-token-track overflow-hidden">
    <div
      className="h-full rounded-full bg-gradient-to-r from-lime to-cyan transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export const ReferralInviteCard: React.FC = () => {
  const { success, error: notifyError } = useNotification();
  const [codeInput, setCodeInput] = useState('');
  const [sharing, setSharing] = useState(false);

  const { referral, isLoading, isUpdating, error, loadSummary, activateCode, claimMilestone } =
    useReferralStore(
      useShallow(state => ({
        referral: state.referral,
        isLoading: state.isLoading,
        isUpdating: state.isUpdating,
        error: state.error,
        loadSummary: state.loadSummary,
        activateCode: state.activateCode,
        claimMilestone: state.claimMilestone,
      }))
    );

  useEffect(() => {
    if (!referral && !isLoading) {
      void loadSummary();
    }
  }, [referral, isLoading, loadSummary]);

  const nextMilestone = useMemo(() => {
    if (!referral) {
      return null;
    }
    return referral.milestones.find(milestone => !milestone.claimed) ?? null;
  }, [referral]);

  if (isLoading && !referral) {
    return (
      <Card className="flex flex-col gap-sm border-token-subtle bg-token-surface-secondary/60 animate-pulse">
        <div className="h-5 w-32 rounded bg-token-track" />
        <div className="h-10 w-full rounded bg-token-track" />
        <div className="h-10 w-2/3 rounded bg-token-track" />
      </Card>
    );
  }

  const activeEvents = referral?.activeEvents ?? [];

  const copyCode = async () => {
    if (!referral?.code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(referral.code);
      success('Код скопирован');
      void logClientEvent('referral_code_copied', {});
    } catch {
      notifyError('Не удалось скопировать код');
    }
  };

  const shareLink = async () => {
    if (!referral) {
      return;
    }
    const link = referral.shareUrl;
    const text = `Присоединяйся ко мне в Energy Planet! Мой код: ${referral.code}`;
    type ShareCapableNavigator = Navigator & { share?: (data: ShareData) => Promise<void> };
    const shareCapableNavigator: ShareCapableNavigator = navigator as ShareCapableNavigator;
    const canNativeShare = typeof shareCapableNavigator.share === 'function';
    try {
      setSharing(true);
      if (canNativeShare && link) {
        await shareCapableNavigator.share({
          title: 'Energy Planet',
          text,
          url: link,
        });
      } else if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        await navigator.clipboard.writeText(text);
        success('Сообщение скопировано, отправьте другу!');
      }
      const method = canNativeShare && link ? 'navigator.share' : link ? 'open_tab' : 'copy_text';
      void logClientEvent('referral_share_click', { method });
    } catch {
      notifyError('Не удалось поделиться ссылкой');
    } finally {
      setSharing(false);
    }
  };

  const handleActivate = async () => {
    try {
      await activateCode(codeInput);
      success('Реферальный код активирован!');
      setCodeInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось активировать код';
      notifyError(message);
    }
  };

  const handleClaim = async (milestoneId: string) => {
    const milestone = referral?.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      return;
    }
    try {
      await claimMilestone(milestone);
      success('Награда получена!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось получить награду';
      notifyError(message);
    }
  };

  return (
    <div className="flex flex-col gap-md">
      <Card className="flex flex-col gap-sm bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border-indigo-400/30">
        <header className="flex items-center justify-between gap-sm">
          <div className="flex flex-col gap-1">
            <span className="text-caption uppercase tracking-wide text-token-secondary">
              Ваш реферальный код
            </span>
            <div className="flex items-center gap-sm">
              <span className="font-mono text-title font-semibold text-token-primary">
                {referral?.code ?? '------'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyCode}
                disabled={!referral || isLoading}
              >
                📋 Копировать
              </Button>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={shareLink}
            disabled={!referral || sharing || isLoading}
          >
            🚀 Поделиться
          </Button>
        </header>

        <section className="flex flex-wrap items-end gap-sm">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="referral-input" className="text-caption uppercase text-token-secondary">
              Активируй код друга
            </label>
            <Input
              id="referral-input"
              value={codeInput}
              placeholder="Введите код друга"
              onChange={event => setCodeInput(event.target.value.toUpperCase())}
              maxLength={16}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleActivate}
            disabled={isUpdating || !codeInput}
          >
            ✅ Применить
          </Button>
        </section>

        {error && (
          <p className="m-0 text-caption text-feedback-error" role="alert">
            {error}
          </p>
        )}

        {referral && (
          <div className="grid gap-sm text-caption text-token-secondary sm:grid-cols-3">
            <div className="rounded-xl border border-border-layer-strong bg-layer-overlay-ghost-soft px-3 py-2">
              Всего заработано:{' '}
              <strong className="text-token-primary">
                +{formatNumberWithSpaces(referral.revenue.totalEarned)}★
              </strong>
            </div>
            <div className="rounded-xl border border-border-layer-strong bg-layer-overlay-ghost-soft px-3 py-2">
              Месяц:{' '}
              <strong className="text-token-primary">
                +{formatNumberWithSpaces(referral.revenue.monthEarned)}★
              </strong>
            </div>
            <div className="rounded-xl border border-border-layer-strong bg-layer-overlay-ghost-soft px-3 py-2">
              Сегодня:{' '}
              <strong className="text-token-primary">
                +{formatNumberWithSpaces(referral.revenue.todayEarned)}★
              </strong>
            </div>
          </div>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-sm text-caption text-token-secondary">
          <span>
            Друзей:{' '}
            <strong className="text-token-primary">{referral?.totalActivations ?? 0}</strong>
          </span>
          {referral?.dailyActivations.limit ? (
            <span>
              Лимит сегодня:{' '}
              <strong className="text-token-primary">
                {referral.dailyActivations.used}/{referral.dailyActivations.limit}
              </strong>
            </span>
          ) : (
            <span>Без дневного лимита</span>
          )}
          {referral?.referredBy && (
            <span>
              Вас пригласил{' '}
              <strong className="text-token-primary">
                {referral.referredBy.username || referral.referredBy.firstName || 'друг'}
              </strong>
            </span>
          )}
        </footer>
      </Card>

      {activeEvents.length > 0 && (
        <Card className="flex flex-col gap-sm border-amber-400/40 bg-amber-400/10 text-body">
          <span className="text-caption uppercase tracking-wide text-amber-600 font-semibold">
            Активные бонусы
          </span>
          <div className="flex flex-col gap-xs">
            {activeEvents.map(event => (
              <div
                key={event.id}
                className="flex flex-col gap-xs rounded-2xl border border-accent-gold/60 bg-accent-gold/20 p-sm"
              >
                <div className="flex items-center justify-between gap-sm">
                  <span className="font-medium text-token-primary">{event.label}</span>
                  <Badge variant="warning" size="sm">
                    до {new Date(event.end).toLocaleDateString('ru-RU')}
                  </Badge>
                </div>
                {event.description && (
                  <span className="text-caption text-token-secondary">{event.description}</span>
                )}
                <div className="flex flex-wrap gap-sm text-caption text-amber-700">
                  {event.inviteeRewardMultiplier && event.inviteeRewardMultiplier !== 1 && (
                    <span>Новичкам ×{event.inviteeRewardMultiplier}</span>
                  )}
                  {event.referrerRewardMultiplier && event.referrerRewardMultiplier !== 1 && (
                    <span>Приглашающим ×{event.referrerRewardMultiplier}</span>
                  )}
                  {event.milestoneRewardMultiplier && event.milestoneRewardMultiplier !== 1 && (
                    <span>Награды за этапы ×{event.milestoneRewardMultiplier}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <section className="flex flex-col gap-sm">
        <header className="flex items-center justify-between gap-sm">
          <h4 className="m-0 text-body font-semibold text-token-primary">Этапы и награды</h4>
          {nextMilestone && (
            <span className="text-caption text-token-secondary">
              Следующий этап через{' '}
              {Math.max(0, nextMilestone.threshold - (referral?.totalActivations ?? 0))} приглашений
            </span>
          )}
        </header>

        <div className="flex flex-col gap-sm">
          {(referral?.milestones ?? []).map(milestone => (
            <Card key={milestone.id} className="flex flex-col gap-sm border-token-subtle">
              <div className="flex items-center justify-between gap-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-body font-semibold text-token-primary">
                    {milestone.title}
                  </span>
                  <span className="text-caption text-token-secondary">
                    Цель: {milestone.threshold} приглашений
                  </span>
                </div>
                {milestone.claimed ? (
                  <Badge variant="success" size="sm">
                    Получено
                  </Badge>
                ) : milestone.claimable ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleClaim(milestone.id)}
                    disabled={isUpdating}
                  >
                    🎁 Забрать
                  </Button>
                ) : null}
              </div>

              {milestone.description && (
                <p className="m-0 text-caption text-token-secondary">{milestone.description}</p>
              )}

              <ProgressBar value={milestone.progress.percentage} />
              <div className="flex items-center justify-between text-caption text-token-secondary">
                <span>
                  Прогресс: {milestone.progress.current}/{milestone.threshold}
                </span>
                <span>
                  Награда: +{formatNumberWithSpaces(milestone.reward.effectiveStars)}⭐
                  {milestone.reward.multiplier !== 1 && (
                    <span className="ml-1 text-token-primary">
                      (×{milestone.reward.multiplier.toFixed(2)})
                    </span>
                  )}
                </span>
              </div>

              {milestone.reward.cosmeticId && (
                <span className="text-caption text-token-secondary">
                  Косметика: {milestone.reward.cosmeticId}
                </span>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
