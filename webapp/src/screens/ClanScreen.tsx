import { TabPageSurface, ClanComingSoon, Surface, Text } from '@/components';

export function ClanScreen() {
  return (
    <TabPageSurface className="gap-4">
      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col items-center gap-4 text-center"
      >
        <Text variant="heading" weight="semibold" tone="primary">
          Кланы появятся в следующем обновлении
        </Text>
        <Text variant="body" tone="secondary">
          Мы уже работаем над системой кланов, чтобы вы могли объединяться и получать общие бонусы.
          Следите за новостями — уведомим, как только вкладка станет активной.
        </Text>
      </Surface>
      <ClanComingSoon />
    </TabPageSurface>
  );
}
