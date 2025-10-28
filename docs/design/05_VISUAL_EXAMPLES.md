# 🎨 Visual Design Examples - 2025 Style

**Before/After examples and 2025 design patterns**

---

## 🏗️ BuildingCard - Restructured

### BEFORE (Overloaded - Current)
```
┌────────────────────────────────────────┐
│ Solar Panel                      ×100 │
│ Level: 5 | Income: 1.2K | ROI #2     │
│ Unlock: Уровень 8                    │
│ Package: ×10 | Cost: 50K | +150K/s   │
│ ⚠️ Energy only on ×5                 │
│ [КУПИТЬ ×10]         [АПГРЕЙД]       │
└────────────────────────────────────────┘

Problems:
✗ 9 pieces of info, equal weight
✗ No clear hierarchy
✗ Hard to scan quickly
```

### AFTER (Layered - 2025 Style)
```
┌────────────────────────────────────────┐
│                                        │
│ 🔆 SOLAR PANEL              LEVEL 5   │  ← Layer 1: HERO (biggest)
│                                        │
│ Daily Income: +1.2K E/sec             │  ← Layer 2: PRIMARY (key info)
│                                        │
│ Count: ×100 units • ROI Rank #2      │  ← Layer 3: SECONDARY (details)
│                                        │
├────────────────────────────────────────┤
│                                        │
│ NEXT PURCHASE:                        │  ← Layer 4: ACTION INFO
│ ×10 units for 50,000 E                │
│ → Will gain +150,000 E/sec            │
│                                        │
│ ⚠️  Only 30K E left (need 50K)       │  ← Layer 5: ALERT (if needed)
│                                        │
├────────────────────────────────────────┤
│ [BUY ×10 FOR 50K E]    [UPGRADE LV6] │  ← Layer 6: ACTIONS (strong CTA)
│                                        │
└────────────────────────────────────────┘

Improvements:
✓ 5 clear layers
✓ Easy to scan
✓ Clear visual hierarchy
✓ Works on 360px
✓ 2025 design: soft rounded corners, generous spacing
```

---

## 📊 StatCard - Multiple States (2025)

```
DEFAULT (Neutral):
┌──────────────────────────┐
│ ⚡ ENERGY                │
│ 50,000 E                 │
│ Available                │
└──────────────────────────┘

POSITIVE (Success - lime-neon):
┌──────────────────────────┐
│ ✅ PRESTIGE AVAILABLE   │
│ +0.5x Multiplier         │
│ Ready to claim!          │
└──────────────────────────┘
(bg: lime-neon/10, border: lime-neon/60)

WARNING (Caution - orange):
┌──────────────────────────┐
│ ⏰ NEXT TIER UNLOCK     │
│ 800,000 E                │
│ Required                 │
└──────────────────────────┘
(bg: orange/10, border: orange/40)

COMPACT (Inline - 2025 dense):
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ ⚡ 1.2M E  │ │ ⭐ 500 S   │ │ 🏆 Lvl 15 │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 🛍️ Shop Card - Premium Item (2025 Metallic)

```
┌──────────────────────────────────────┐
│                                      │
│  ✨ FEATURED OFFER ✨                │  ← Badge at top
│                                      │
│  💎 ULTIMATE BUNDLE                 │  ← Gold/metallic styling
│                                      │
│  ⭐ 25,000 Stars                    │
│  🌟 All Cosmetics                   │
│  🎁 7-Day Premium Boost             │
│                                      │
│  Regular: 4,999 ₽ → NOW: 999 ₽    │  ← Big discount highlight
│  SAVE 80%! 🔥                       │
│                                      │
│  Only 3 remaining!                  │
│                                      │
│    [GET ULTIMATE BUNDLE]            │
│                                      │
└──────────────────────────────────────┘

2025 Design Elements:
✓ Metallic gold border (#ffd700)
✓ Gold glow shadow
✓ Bold red "SAVE" text
✓ Soft rounded corners (16px)
✓ Generous padding
```

---

## 🎯 Main Header - Improved (2025)

### BEFORE (Cramped)
```
┌──────────────────────────────────────────┐
│ LV        ⚡           ⭐              │
│ 15      Energy   Stars        ⚙️       │
│          50,000   500          Settings │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░ 65% XP         │
└──────────────────────────────────────────┘

Issues:
✗ Small touch targets (icon = 24px)
✗ Dense, cramped layout
✗ Hard to parse information
```

### AFTER (2025 Spacious)
```
┌──────────────────────────────────────────┐
│                                          │
│  LV 15    ⚡ 50K E    ⭐ 500           │  ← Clear, spaced
│                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░ 65% XP  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                          │
│                          [🛍️] [⚙️]   │  ← 44×44px buttons
│                                          │
└──────────────────────────────────────────┘

Improvements:
✓ 44×44px touch targets
✓ Better breathing room
✓ Clear visual hierarchy
✓ Modern 2025 spacing
```

---

## ⚠️ Alert Patterns (2025 Style)

### Error Alert
```
┌──────────────────────────────────────┐
│ ❌ CANNOT PURCHASE                  │  ← Bold title
│                                      │
│ You need: 50,000 E                  │  ← Primary info
│ You have: 30,000 E                  │
│ Missing: 20,000 E                   │
│                                      │
│ How to earn more:                   │  ← Help text
│ • Tap the planet                    │
│ • Passive income generators         │
│                                      │
└──────────────────────────────────────┘
(bg: #ff3333/10, border: #ff3333/40, soft 12px corners)
```

### Success Alert
```
┌──────────────────────────────────┐
│ ✅ PURCHASED!                  │
│                                 │
│ Solar Panel ×5                 │
│ Gained +75K E/sec             │
│                                 │
│ New Passive Income: 1.5M E/sec │
│                                 │
└──────────────────────────────────┘
(Toast, 3 sec timeout, lime-neon color)
```

---

## 🎮 Leaderboard - Your Entry (2025)

```
┌──────────────────────────────────────────┐
│                                          │
│  ⭐ YOU ARE HERE ⭐                     │  ← Highlighted
│                                          │
│  #12  👤 You                            │
│                                          │
│  Score: 1,900,000 E                    │  ← Large, bold
│  Level: 25 • Prestige: ×2.8x           │
│                                          │
│  ↑ 3 Spots ✨ You're catching up!     │  ← Motivational
│                                          │
└──────────────────────────────────────────┘

2025 Elements:
✓ Cyan/lime glow border
✓ Soft rounded corners (16px)
✓ Clear hierarchy (score > level)
✓ Emoji for visual interest
✓ Motivational text
```

---

## 🎯 Prestige Card - Available (2025)

```
┌──────────────────────────────────────┐
│                                      │
│  🎉 PRESTIGE AVAILABLE!             │  ← Bright, exciting
│                                      │
│  You've generated 1.5M E            │  ← Primary info
│  Next tier unlocked!                │
│                                      │
│  Current:    ×1.8x                  │
│  After:      ×2.1x (new!)          │  ← Show improvement
│  Gain:       +0.3x                  │
│                                      │
│  ⚠️ This will RESET your energy   │  ← Important warning
│  But multiply all future gains     │
│                                      │
│    [PRESTIGE NOW! 🚀]               │  ← Strong CTA
│                                      │
└──────────────────────────────────────┘

2025 Design:
✓ Lime-neon background glow
✓ Gold text for multiplier
✓ Clear before/after
✓ Exciting emoji
✓ Soft corners (16px)
```

---

## 📱 Responsive Layouts (2025)

### 360px (iPhone SE) - Single Column
```
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│ Card 1               │
├──────────────────────┤
│ Card 2               │
├──────────────────────┤
│ Card 3               │
├──────────────────────┤
│ TabBar               │
└──────────────────────┘

Width: 360px - 32px padding = 328px content
Strategy: Stack everything, single column
```

### 375px (iPhone 13) - Comfortable
```
┌────────────────────────┐
│ Header                 │
├────────────────────────┤
│ Large Card             │
├────────────────────────┤
│ Spacious Layout        │
├────────────────────────┤
│ TabBar                 │
└────────────────────────┘

Width: 375px - 32px padding = 343px content
Strategy: Single column, generous spacing
```

### 428px+ (iPad Mini) - Multi-Column Option
```
┌───────────────────────────────────┐
│ Header (full width)               │
├───────────────────────────────────┤
│ Card 1        │ Card 2            │
├───────────────┼───────────────────┤
│ Card 3        │ Card 4            │
├───────────────────────────────────┤
│ TabBar (full width)               │
└───────────────────────────────────┘

Width: 428px - 32px padding = 396px
Strategy: 2 columns possible, still single if cramped
```

---

## 🎬 Animation Feedback (2025)

### Button Tap Sequence
```
1. NORMAL (100ms)
   [BUY ×10]

2. HOVER (100-200ms)
   [BUY ×10]  ← Scale 1.05x, glow

3. TAP (50ms)
   [BUY ×10]  ← Scale 0.95x, color brighten

4. LOADING (200-500ms)
   [⏳ Awaiting...]  ← Spinner

5. SUCCESS (400ms)
   [✅ Purchased!]  ← Checkmark animation, green

6. BACK (500ms+)
   [BUY ×10]  ← Reset
```

### Card Unlock Animation
```
BEFORE (locked):
[🔒 Coming Soon]  opacity 70%, grayed

UNLOCKING (600ms):
[✨ GLOW EXPANDING ✨]  ← Expanding ring
[🔓 NEW BUILDING]

AFTER (unlocked):
[🔆 SOLAR PANEL]  opacity 100%, full color
Ready to purchase!
```

---

## 🌈 Color Combinations (2025 Palette)

### Cyan + Lime (Energetic)
```
Background: #0a0e27 (very dark)
Primary accent: #00d9ff (cyan)
Secondary accent: #00ff88 (neon lime)
Gradient: cyan → lime
Shadow: cyan glow
```

### Gold + Orange (Premium)
```
Background: #0a0e27
Primary: #ffd700 (gold metallic)
Secondary: #ff8d4d (warm orange)
Gradient: gold → orange
Shadow: gold glow (premium feel)
```

### Lime + Orange (Warm)
```
Background: #0a0e27
Primary: #00ff88 (neon lime)
Secondary: #ff8d4d (orange)
Gradient: lime → orange → red
Warmth: High energy
```

---

## 📊 Design System Comparison (2025)

| Element | 2024 Style | 2025 Energy Planet |
|---------|-----------|-------------------|
| Corners | 4-8px sharp | 12-24px soft |
| Colors | Flat | Gradients + glows |
| Shadows | Simple | Elevation system |
| Typography | Thin fonts | Bold, oversized |
| Spacing | Compact | Generous |
| Status colors | Dull | Bright neons |

---

**All examples follow 2025 design trends!** ✨
