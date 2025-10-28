# ⚡ Quick Reference - Developer Cheatsheet

**Keep this open while coding** 📌

---

## 🎨 2025 Design Tokens

### Spacing (8px base)
```
xs:        4px
xs-plus:   6px
sm:        8px
sm-plus:   12px
md:        16px ← standard
lg:        24px
xl:        32px
2xl:       40px
```

### Colors (Use CSS Variables!)
```
text-primary:       #ffffff
text-secondary:     #a0a0a0
success (lime):     #00ff88    (brighter 2025!)
warning (orange):   #ff8d4d
error (red):        #ff3333    (brighter 2025!)
```

### Border Radius (2025: Soft!)
```
xs:  4px
sm:  8px
md:  12px      ← cards
lg:  16px      ← more soft
xl:  24px      ← buttons (very soft!)
```

---

## 🧩 Component Quick Use

### Button
```tsx
<Button variant="primary" size="md" disabled={false}>Click</Button>
Variants: primary | secondary | success | danger | ghost
Sizes: sm | md | lg
Always >= 44px height!
```

### Card
```tsx
<Card variant="default" highlighted={false}>Content</Card>
Variants: default | elevated | outlined
Add tone: success | warning | danger
```

### StatCard
```tsx
<StatCard
  icon="⚡"
  label="Power"
  value="1.2M"
  tone="positive"
/>
Tones: default | positive | warning
```

---

## 📐 Common Patterns

### Layer Text Hierarchy
```tsx
{/* Layer 1: Hero - biggest, boldest */}
<h3 className="text-title font-bold text-primary">Title</h3>

{/* Layer 2: Primary info */}
<p className="text-body font-semibold text-primary">Key metric</p>

{/* Layer 3: Secondary info */}
<p className="text-caption text-secondary">Details</p>

{/* Layer 4: Metadata */}
<p className="text-micro text-secondary opacity-50">Meta</p>
```

### Stack Layout
```tsx
<div className="flex flex-col gap-md">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Card with Content
```tsx
<Card>
  <div className="flex justify-between items-center gap-md mb-md">
    <h3 className="text-title font-bold">Title</h3>
    <button className="touch-target-sm">⚙️</button>
  </div>
  <p className="text-body mb-md">Content</p>
  <Button fullWidth>Action</Button>
</Card>
```

---

## ❌ AVOID (Anti-Patterns)

```tsx
// ❌ Hardcoded spacing
<div className="gap-3 p-4">content</div>

// ✅ Use tokens
<div className="gap-sm-plus p-md">content</div>

// ❌ Hardcoded colors
<div className="text-white bg-gray-900">text</div>

// ✅ Use variables
<div className="text-[var(--color-text-primary)] bg-[var(--app-bg)]">

// ❌ Small touch targets
<button className="w-6 h-6">Icon</button>

// ✅ Proper size
<button className="w-11 h-11">Icon</button>  <!-- 44px -->

// ❌ Weak colors
className="text-cyan/10"

// ✅ Good contrast
className="text-cyan"  <!-- full color -->
```

---

## 🎯 Touch Targets (MUST BE 44px+)

```tsx
// Icon button (touch-safe)
<button className="w-11 h-11 rounded-md flex items-center justify-center">
  ⚙️
</button>

// Or use Button component
<Button size="sm">Click me</Button>  <!-- min 44px -->
```

---

## 🌈 Colors 2025

```tsx
// Primary accent
className="text-cyan"      <!-- #00d9ff (perfect!) -->

// Success
className="text-success"   <!-- #00ff88 (bright!) -->

// Warning
className="text-warning"   <!-- #ff8d4d -->

// Error
className="text-error"     <!-- #ff3333 (bright!) -->

// Gold premium
className="text-gold"      <!-- #ffd700 (new!) -->
```

---

## 📊 Typography

```
Display:   48px bold     ← Rarely used
Heading:   24px semibold ← Screen titles
Title:     20px bold     ← Card titles (2025 new!)
Subheading: 16px semibold ← Labels
Body:      14px normal   ← Main text
Caption:   12px normal   ← Hints
Micro:     11px bold     ← Tags
```

---

## 🎨 Gradients (2025 Trend)

```tsx
// Hero background
className="bg-gradient-to-br from-[#001a3f] to-[#0a0e27]"

// Accent gradient
className="bg-gradient-to-r from-cyan to-lime"

// Premium gradient
className="bg-gradient-to-br from-gold to-orange"
```

---

## 🎯 Checklist Before Commit

- [ ] No `gap-[0-9]` or `p-[0-9]` (use tokens)
- [ ] All interactive >= 44px
- [ ] Text contrast >= 4.5:1 (ideally 7:1)
- [ ] Card titles are `text-title font-bold`
- [ ] Rounded corners >= 12px
- [ ] No hardcoded #colors
- [ ] Mobile test (360px)
- [ ] Dark mode check

---

## 🆘 Common Fixes

| Issue | Solution |
|-------|----------|
| Text too small | Increase font size, increase weight |
| Text hard to read | Increase contrast, use darker bg |
| Button hard to tap | Increase to min 44px height |
| Card looks cramped | Add padding (p-md), gap (gap-md) |
| Design looks old | Add gradients, metallic, soft corners |
| Hierarchy unclear | Make titles bigger/bolder, details smaller |

---

**Print this and keep nearby!** 🎨
