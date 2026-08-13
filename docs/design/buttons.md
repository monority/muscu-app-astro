# Gym Empire — Button System

The single source of truth for every button in the application.

> Implementation: `src/components/ui/Button.astro`.
> Design tokens: `src/styles/tokens.css`.
> Global resets / focus: `src/styles/globals.css`.

## 1. Principles

Buttons are **precise controls for a performance tool**, not marketing surfaces.

- Restrained radius. No huge pills, no glow, no heavy shadows, no 3D.
- One obvious primary CTA per main context.
- Concise, action-oriented labels. No vague `Go` / `Submit` / `Continue`.
- Keyboard accessible, visible focus, reduced-motion safe.
- Cheap animations only (opacity, transform, color, background, border).

## 2. The primitive

Use `<Button>` everywhere. Never hand-roll a competing button. If a screen
needs a control that is not a button (nav item, day cell, slider thumb),
style it deliberately and keep it visually distinct from the button system.

```astro
<Button variant="primary"  size="md">Start workout</Button>
<Button variant="secondary">Edit</Button>
<Button variant="ghost">View all</Button>
<Button variant="destructive">Delete workout</Button>
<Button variant="primary" loading>Save workout</Button>
<Button variant="primary" disabled>Save workout</Button>
<Button variant="secondary" size="sm" href="/settings">Manage</Button>
```

### Props

| Prop       | Values                                      | Default     |
|------------|---------------------------------------------|-------------|
| `variant`  | `primary` `secondary` `ghost` `destructive` | `primary`   |
| `size`     | `sm` `md` `lg`                              | `md`        |
| `disabled` | `boolean`                                   | `false`     |
| `loading`  | `boolean` (preserves width, blocks clicks)  | `false`     |
| `fullWidth`| `boolean`                                   | `false`     |
| `href`     | renders an accessible `<a>` when present    | —           |
| `type`     | `button` `submit` `reset`                   | `button`    |

Extra attributes (`@click`, `aria-*`, `x-*`, `data-*`) are forwarded via
`...rest`.

### Variants

- **primary** — strongest hierarchy. Start / Continue / Finish / Save /
  Create / Add. One per context.
- **secondary** — supports primary. Edit / Manage / Cancel / Add exercise.
- **ghost** — low emphasis. View all / More / Clear / Close.
- **destructive** — Delete workout / Remove exercise / Clear data. Distinct,
  not aggressive.

Do **not** add new variants for purely visual differences.

### Sizes

`sm` 3.6rem · `md` 4.4rem · `lg` 4.8rem. All meet comfortable touch targets.
Mobile CTAs may use `fullWidth`.

### States (every variant)

`default` · `hover` (subtle surface/border change, no bounce/glow) ·
`focus-visible` (global `--focus-ring`) · `active` (1px press, no elevation
gain) · `disabled` (dimmed + no hover/active, text readable) ·
`loading` (inline spinner, width preserved).

## 3. Typography

- Font: `--font-body` (Inter). Weight 600. Letter-spacing `-0.005em`.
- No uppercase by default. Sentence/title case labels.
- Labels concise and precise: `Start workout`, `Add set`, `Save workout`,
  `Create workout`, `View progression`.

## 4. Icons

Optional, via the default slot (SVG inherits 1.6rem sizing):

```astro
<Button variant="primary"><svg …></svg> Add set</Button>
```

- Use icons only to aid recognition (`+` Add, `▶` Start, `✓` Complete,
  `×` Close, `⌫` Delete).
- Icon-only buttons must carry an `aria-label`.
- Do not put an icon on every button.

## 5. Hierarchy & groups

One primary per context. Group example:

```astro
<Button variant="primary">Save</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="destructive">Delete</Button>
```

Do not give `Save` / `Cancel` / `Delete` identical visual weight.

## 6. Migration rules

When touching a screen:

1. Replace bespoke `<button class="…">` with `<Button variant="…">`.
2. Pick the variant by semantic priority (see §2).
3. Drop uppercase / pill radius / heavy shadows from the old CSS.
4. Verify keyboard focus, hover, active, disabled, loading.
5. Do not change business logic, routing, or persistence.

## 7. Forbidden

Huge pills · excessive gradients · glow · heavy drop shadows · exaggerated 3D
· oversized type · generic template styling · removing focus without a better
accessible replacement · relying on opacity alone for disabled state.
