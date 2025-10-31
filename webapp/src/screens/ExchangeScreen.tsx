export function ExchangeScreen() {
  return (
    <section className="flex flex-col gap-4 py-6">
      <header>
        <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Exchange</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Здесь появится каталог строений и пакетов. На текущем этапе доступна заглушка.
        </p>
      </header>
      <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(39,42,47,0.6)] p-4 text-[var(--color-text-secondary)]">
        🏗️ Контент будет перенесён из ShopPanel и BuildingsPanel в фазе 5.
      </div>
    </section>
  );
}
