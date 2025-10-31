export function TapScreen() {
  return (
    <section className="flex flex-col gap-4 py-6">
      <header>
        <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Tap</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Основной экран добычи. Содержимое будет перенесено из legacy MainScreen на следующих
          фазах.
        </p>
      </header>
      <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(39,42,47,0.6)] p-4 text-[var(--color-text-secondary)]">
        ⚙️ Заглушка: новый Tap UI в разработке.
      </div>
    </section>
  );
}
