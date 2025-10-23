# Phase 3: Layout Optimization

**Status:** 🟡 IN PROGRESS (планирование)

**Цель:** Переделать главный экран на **tap-first layout** - кнопка тапа в центре, а не после скролла

---

## 🎯 Проблемы текущего лейаута

### На MainScreen (домашний экран):

```
ТЕКУЩИЙ LAYOUT (BAD):
┌─────────────────────┐
│ StatCard Grid       │  ← 4 карточки, занимают 60% экрана
│ (Energy/Progress)   │  ← На мобильной нужно скролить!
├─────────────────────┤
│ Streak Info         │  ← Опционально
├─────────────────────┤
│ Level Progress Bar  │  ← Важная информация
├─────────────────────┤
│ Tab Content!        │  ← Вкладка (Shop/Boosts/etc)
└─────────────────────┘
```

**Impact на UX:**
- 📱 На мобильной (375px) нужно скролить минимум 5 карточек
- ❌ Кнопка для взаимодействия (tap, buy, etc) в конце скролла
- ❌ Низкая конверсия - игроки теряют мотивацию тапить
- 📊 Слишком много инфы сверху "выше линии сгиба"

### На Footer:

```
ТЕКУЩИЙ LAYOUT (BAD):
7 кнопок в нижнем меню:
🏠 Home | 🛍️ Shop | 🚀 Boosts | 🏗️ Builds | 🏆 Leaderboard | 👤 Profile | ⚙️ Settings
```

**Проблемы:**
- ❌ Home кнопка не имеет смысла (мы уже на главном экране)
- ❌ 7 кнопок = очень узкие кнопки на мобильной
- ❌ На мобильной кнопки едва видны, иконки слишком маленькие

---

## ✅ Решение Phase 3

### Новый LAYOUT (GOOD):

```
┌─────────────────────────────┐
│  📊 Stats Sidebar/Collapse   │  ← Свернуть на мобильной
├─────────────────────────────┤
│                             │
│     🌍 TAP BUTTON           │  ← ЦЕНТР ЭКРАНА (tap here!)
│     (Big, interactive)       │
│                             │
├─────────────────────────────┤
│  Current Tab Content        │  ← Shop/Boosts/etc
│  (scrollable below)         │
└─────────────────────────────┘
│ 🛍️ Shop | 🚀 Boosts | 🏗️ Builds │  ← 6 кнопок (убрали Home)
│ 🏆 Leaderboard | 👤 Profile    │
└─────────────────────────────┘
```

### Задачи Phase 3:

#### Task 3.1: Анализ MainScreen (DONE ✅)
- [x] Понять текущую структуру
- [x] Определить проблемы
- [x] Спланировать решение

#### Task 3.2: Создать HomePanel компонент
- [ ] Новый компонент `HomePanel.tsx`
- [ ] Big tap button в центре
- [ ] Collapsed stats panel (expand/collapse)
- [ ] XP progress bar
- [ ] Next goal card
- [ ] Lazy load от main tab content

#### Task 3.3: Переделать MainScreen layout
- [ ] Заменить tab structure на grid layout
- [ ] Home = HomePanel (center tap)
- [ ] Убрать Home из footer nav
- [ ] Оптимизировать footer на 6 кнопок

#### Task 3.4: Lazy-load tab content
- [ ] Не рендерить Shop/Boosts/etc если не активны
- [ ] Загружать только активную вкладку в DOM
- [ ] Экономия памяти и производительности

#### Task 3.5: Мобильная оптимизация
- [ ] Протестировать на мобильной (375px)
- [ ] Убедиться что tap button доступен сразу
- [ ] Оптимизировать spacing и font sizes
- [ ] Проверить portrait/landscape

---

## 📋 Детали реализации

### Task 3.2: HomePanel компонент

**Props:**
```typescript
interface HomePanelProps {
  energy: number;
  level: number;
  xpProgress: number;
  streakCount: number;
  onTap: () => void;
  purchaseInsight?: PurchaseInsight;
}
```

**Структура:**
```tsx
<div className="flex flex-col items-center justify-center h-full">
  {/* Top: Collapsed stats */}
  <StatsPanel collapsed={true} />

  {/* Center: BIG TAP BUTTON */}
  <TapButton size="xl" onClick={onTap} />

  {/* Bottom: XP progress + next goal */}
  <XPProgress />
  <NextGoal insight={purchaseInsight} />
</div>
```

### Task 3.3: MainScreen refactor

**Текущий код:**
```tsx
const renderActiveTab = () => {
  if (activeTab === 'home') return renderHome();
  if (activeTab === 'shop') return <ShopPanel />;
  // ... остальные
}

return (
  <div className="flex flex-col">
    <div className="overflow-y-auto">
      <StatCard... />
      <renderActiveTab() />
    </div>
    <footer>
      <TabNav /> {/* 7 кнопок */}
    </footer>
  </div>
);
```

**Новый код (план):**
```tsx
return (
  <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] h-full">
    {/* Main content */}
    <div className="overflow-y-auto">
      {activeTab === 'home' ? (
        <HomePanel {...props} />  {/* Центр тапа! */}
      ) : (
        renderActiveTab()
      )}
    </div>

    {/* Stats sidebar (desktop only) */}
    <aside className="hidden md:flex flex-col overflow-y-auto">
      <StatsPanel />
    </aside>

    {/* Footer: только 6 кнопок (no home) */}
    <footer className="flex justify-around">
      {/* Shop, Boosts, Builds, Leaderboard, Profile, Settings */}
    </footer>
  </div>
);
```

### Task 3.4: Lazy-load реализация

**Текущее:**
```tsx
const renderActiveTab = () => {
  if (activeTab === 'shop') return <ShopPanel />; // Всегда рендерится!
  if (activeTab === 'boosts') return <BoostHub />;
  // ... все рендерятся, даже если не видны
}
```

**Новое:**
```tsx
const renderActiveTab = () => {
  switch (activeTab) {
    case 'shop':
      return <ShopPanel />; // Только если activeTab === 'shop'
    case 'boosts':
      return <BoostHub />;
    // ... остальные, рендерятся только когда нужны
    default:
      return null;
  }
}
```

---

## 🎯 Success Criteria Phase 3

- [ ] Tap button видна сразу (без скролла)
- [ ] На мобильной 375px tap занимает центр
- [ ] Footer имеет только 6 кнопок (Home убран)
- [ ] Stats panel может collapse/expand на мобильной
- [ ] Lazy-load для всех tab content
- [ ] Build: PASS
- [ ] TypeScript: PASS
- [ ] Мобильная оптимизация: PASS (375px, 390px)
- [ ] 3+ коммита с описанием

---

## 📊 Эстимейт

- Task 3.2 (HomePanel): 1 час
- Task 3.3 (MainScreen refactor): 1.5 часа
- Task 3.4 (Lazy-load): 0.5 часа
- Task 3.5 (Mobile testing): 0.5 часа
- **ИТОГО: ~3.5 часа**

---

## 🔗 Связанные документы

- [Phase 2 Summary](./002_COMPONENT_REFACTOR.md)
- [Phase 4 Plan](./004_PERFORMANCE_POLISH.md)
- [Design System](./001_DESIGN_SYSTEM.md)

**Status:** 🟡 NEXT PHASE (после Phase 2 ✅)
