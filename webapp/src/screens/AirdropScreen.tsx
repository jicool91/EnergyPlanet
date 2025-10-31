import { TabPageSurface, ClanComingSoon } from '@/components';

export function AirdropScreen() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Airdrop</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Сезонные события и будущие коллаборации появятся здесь. Следите за обновлениями!
        </p>
      </header>

      <TabPageSurface>
        <ClanComingSoon />
      </TabPageSurface>
    </div>
  );
}
