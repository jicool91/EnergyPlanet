# Фаза 5: Monetization UX & Final Polish

**Эстимейт:** 2-3 дня | **Микротаски:** 10

**Требует:** Фазы 1, 2, 3, 4 ✅

---

## 📋 Микротаски

### 5.1 Добавить Stars индикатор в Header
**Цель:** Всегда видимый баланс Stars
- [ ] Добавить ⭐ иконка + число в header
- [ ] Разместить справа от Energy (или рядом)
- [ ] Цвет: gold/yellow (#FFC957)
- [ ] Размер: компактный (text-caption)
- [ ] Обновляется в реальном времени из useGameStore

### 5.2 Создать Quick Top-Up button в Header
**Цель:** Быстрый доступ к магазину
- [ ] Кнопка "+" рядом со Stars числом
- [ ] При клике → переводит в Shop вкладку
- [ ] Highlight кнопка (primary color)
- [ ] Или как отдельная иконка 🛍️
- [ ] Hover эффект

### 5.3 Улучшить Shop Header и CTA
**Цель:** Выделить что это место для покупок
- [ ] Заголовок: "Energy Shop" или "Power Up Your Planet"
- [ ] Subheader: "Get Stars & Cosmetics"
- [ ] Featured section вверху с лучшим офером
- [ ] Progress bar: "You're X% away from next tier"
- [ ] Refresh button более заметный

### 5.4 Добавить Recommended/Best Value badges
**Цель:** Гайдить пользователя к выгодным покупкам
- [ ] Star packs: добавить "Best Value" для оптимального соотношения цена/количество
- [ ] Cosmetics: "Most Popular" для часто покупаемых
- [ ] Limited time offer: "Ends in X hours"
- [ ] Используйте яркие цвета для выделения

### 5.5 Создать Bundle визуализацию для Star Packs
**Цель:** Показать bonus stars понятнее
- [ ] Icon для основных stars (⭐)
- [ ] Icon для bonus (✨)
- [ ] Большие числа для обоих
- [ ] Percentage boost (e.g. "+50% bonus")
- [ ] Анимация при load

### 5.6 Добавить Price Comparison для Star Packs
**Цель:** Показать value за деньги
- [ ] Price per star: "0.5 ₽/⭐" или "$0.01/⭐"
- [ ] Compare с другими паками (e.g. "Best rate: -30%")
- [ ] Tooltip или small text рядом
- [ ] Помогает выбрать выгодный пакет

### 5.7 Улучшить Cosmetics Filter/Sort
**Цель:** Легче найти нужную косметику
- [ ] Filter по: owned, available, locked
- [ ] Sort по: rarity, name, price
- [ ] Search по названию (future)
- [ ] Показать статистику: "5 owned, 12 available, 8 locked"

### 5.8 Добавить Cosmetics Preview Mode
**Цель:** Увидеть как выглядит на планете
- [ ] Preview button для каждой косметики
- [ ] Показать как выглядит в контексте (если есть большой preview)
- [ ] "Preview" + "Equip" кнопки
- [ ] Можно отмотать назад к списку

### 5.9 Добавить Limited-Time Offer для Cosmetics
**Цель:** Создать FOMO и urgency
- [ ] Пакеты косметики: "Available only for 3 days!"
- [ ] Event cosmetics: "Seasonal - Available until X date"
- [ ] Taimer на каждый оффер
- [ ] Красный border для limited items

### 5.10 Финальный QA & Testing
**Цель:** Проверить что все работает красиво
- [ ] Полный скрин-тест на iPhone 12/14 (Safari)
- [ ] Полный скрин-тест на Android (Chrome)
- [ ] Проверить monetization flow: Stars → Shop → Purchase
- [ ] Проверить что animates smooth
- [ ] Проверить что нет console errors
- [ ] Performance audit (DevTools)
- [ ] Accessibility check (contrast, font sizes)

---

## 🎯 Success Criteria

После этой фазы (ФИНАЛ):
- [ ] Stars видны в header всегда
- [ ] Quick Top-Up работает
- [ ] Shop явно выделена и привлекательна
- [ ] Star packs показывают value
- [ ] Cosmetics легко фильтруются
- [ ] FOMO элементы работают
- [ ] Нет console errors
- [ ] Performance good (LCP < 2s)
- [ ] Все тесты pass
- [ ] Code review approved
- [ ] Готов к deployment!

---

## 🚀 Post-Launch

После успешного деплоя:
1. Monitor user behavior (analytics)
2. A/B test различные featured items
3. Collect user feedback
4. Iterate based на conversions

---

**🎉 ФАЗА 5 - ПОСЛЕДНЯЯ ФАЗА**
**Зависит от:** Фазы 1, 2, 3, 4 ✅
