# Design System — Muscu App

Inspired by Tesla's radical subtraction philosophy — a fitness tracking app where the workout is everything and the interface is almost nothing. Dark OLED-optimized surfaces, a single orange accent for CTAs, green for success states, and Barlow typography for an athletic, precise feel.

## 1. Visual Theme & Atmosphere

Dark gym environment. Low-light, high-contrast. The interface dissolves during a workout — you should only see the timer, the weight, and the rep count. No decorative chrome, no ornamental gradients, no unnecessary shadows. Every pixel that isn't workout data is darkness.

The color philosophy is ascetic: a single orange (`#F97316`) for primary actions and emphasis, green (`#22C55E`) for success/completion, red (`#EF4444`) reserved exclusively for destructive actions and errors. The entire emotional weight is carried by the data — weight lifted, sets completed, streak days. Surfaces exist in a tight band of near-black (`#050505` through `#151515`) so the accent colors and data stand out.

## 2. Color Palette & Roles

### Primary
- **Fire Orange** (`#F97316`): Primary CTA buttons, key accents, selected states, progress indication. The single chromatic signal — used sparingly so every appearance carries weight
- **Pure White** (`#F6F6F6`): Primary text color on dark surfaces — `--color-text`
- **Near Black** (`#050505`): Page background — `--color-bg`
- **Surface Black** (`#0B0B0B`): Card and container backgrounds — `--color-surface`
- **Surface Dark** (`#111111`): Elevated surfaces, inputs — `--color-surface-2`

### Success & Signal
- **Growth Green** (`#22C55E`): Success states, completed workouts, PR achievements — `--color-accent-2`, `--success`
- **Alert Red** (`#EF4444`): Destructive actions, errors, delete — `--destructive`

### Neutrals & Text
- **White Smoke** (`#F6F6F6`): Primary text — `--text`
- **Silver Mute** (`#9CA3AF`): Secondary text, labels, placeholders — `--muted`
- **Border Fade** (`hsl(0 0% 100% / 0.08)`): Subtle dividers and card borders — `--border`

### Surface Hierarchy
| Level | Token | Value | Use |
|-------|-------|-------|-----|
| Background | `--bg` | `#050505` | Base page canvas |
| Surface 1 | `--surface` | `#0B0B0B` | Cards, containers |
| Surface 2 | `--surface-2` | `#111111` | Inputs, elevated cards |
| Surface 3 | `--surface-3` | `#151515` | Dropdowns, pickers |

### Gradient System
- No decorative gradients. The only gradient is the body background: a subtle radial glow from the accent color at the top-center and green at bottom-right — `--color-bg` with `radial-gradient` overlays

## 3. Typography Rules

### Font Family
- **Display**: `'Barlow Condensed', 'Bahnschrift SemiCondensed', 'Segoe UI', sans-serif` — condensed, athletic, energetic. Used for page titles, stat numbers, timer
- **Body/UI**: `'Barlow', 'Segoe UI', system-ui, sans-serif` — clean humanist sans for form labels, set data, navigation

### Hierarchy

| Role | Size | Weight | Line Ht | Font |
|------|------|--------|---------|------|
| Page Title | `clamp(1.6rem, 3vw, 2rem)` | 700 | 1.2 | Barlow Condensed |
| Stat Display | `clamp(2rem, 5vw, 2.4rem)` | 700 | 1.1 | Barlow Condensed |
| Card Heading | 1.4rem | 700 | 1.3 | Barlow Condensed |
| Body Text | 1.3–1.4rem | 400 | 1.5 | Barlow |
| Button Label | 1.3–1.4rem | 700 | 1.2 | Barlow |
| Small / Label | 1.1rem | 600 | 1.2 | Barlow |
| Muted / Meta | 0.9–1.1rem | 400 | 1.3 | Barlow |
| Timer Display | `clamp(3.6rem, 8vw, 6rem)` | 700 | 1 | Barlow Condensed |

### Principles
- **Condensed for display, regular for body** — the contrast between compact headlines and readable body text creates hierarchy without weight changes
- **Uppercase labels only** — short labels (≤4 words) in uppercase with letter-spacing for section eyebrows and badges. Never uppercase body text
- **Tabular numbers** — all stat displays use `font-variant-numeric: tabular-nums` to prevent layout shift during value changes
- **Two weights dominate** — 700 (bold) for display/buttons, 400/500 for body. 600 used sparingly for labels

## 4. Component Stylings

### Buttons
- **Border-radius**: `--radius-md` (10px) for all buttons
- **Transition**: 160–200ms ease on background, border-color, transform

**Primary CTA** (accent action):
- Background: `var(--accent)` (`#F97316`)
- Text: `var(--accent-foreground)` (`#FFFFFF`)
- Border: 1px solid `hsla(24, 100%, 55%, 0.45)`
- Hover: `hsl(24 100% 48%)`
- Active: `transform: scale(0.97)`

**Secondary CTA**:
- Background: transparent
- Text: `var(--muted)`
- Border: 1px solid `var(--border)`
- Hover: text `var(--text)`, border `hsl(0 0% 100% / 0.2)`

**Destructive**:
- Red border/background via `var(--destructive)`

### Cards
- Background: `var(--surface)` (`#0B0B0B`)
- Border: 1px solid `var(--border)` (`hsl(0 0% 100% / 0.08)`)
- Border-radius: `var(--radius-lg)` (14px)
- Padding: `var(--space-page-padding)` (2.4rem desktop, 1.2rem mobile)
- No shadow at rest
- Hover: box-shadow `0 6px 14px hsl(0 0% 0% / 0.24)` + accent border tint

### Inputs & Forms
- Background: `var(--surface-2)` (`#111111`)
- Border: 1px solid `var(--border)`
- Border-radius: `--radius-md` (10px)
- Text: `var(--text)` at 1.6rem (body) or inherit
- Placeholder: `hsl(0 0% 100% / 0.25)`
- Focus: `var(--focus-ring)` — `0 0 0 3px hsl(24 100% 55% / 0.35)`, border `var(--accent)`

### Navigation
- **Desktop sidebar**: 24rem wide, `var(--surface)` background, no border
- **Mobile bottom nav**: 5.6rem height, `var(--surface)` with subtle top border
- **Active item**: orange background tint (`hsl(24 100% 55% / 0.1)`) + white text
- **Inactive**: `var(--muted)` text, no background
- **Hover**: light white bg (`hsl(0 0% 100% / 0.04)`)

### Badges & Chips
- Border-radius: `--radius-pill` (999px)
- **Muscle group**: green-tinted bg, green text
- **Equipment**: blue-tinted bg, blue text
- **Set type**: color-coded per type (warm-up blue, work orange, top green, drop pink, failure red)

## 5. Layout Principles

### Spacing System
- **Base unit**: 0.4rem (4px) increments
- **Rhythm**: 0.4 / 0.8 / 1.2 / 1.6 / 2.0 / 2.4 / 3.2 rem
- **Card grid gap**: `var(--gap-card)` — 1.2rem desktop, 1rem tablet, 1rem mobile
- **Section gap**: `var(--gap-section)` — 1.6rem desktop, 1.2rem tablet/mobile

### Grid & Container
- **Page max-width**: 48rem on form-heavy pages (poids, settings), full width on data pages
- **Dashboard**: `repeat(auto-fit, minmax(14rem, 1fr))` grid for stat cards
- **Exercise list**: stacked flex with grid gap (`0.6rem`)
- **Session**: single-column, max-width driven by content

### Responsive Strategy
- **Desktop (≥1024px)**: Sidebar visible, full page padding (2.4rem)
- **Tablet (640–1023px)**: Sidebar hidden, mobile nav toggle, reduced padding (1.6rem)
- **Mobile (<640px)**: Bottom nav bar (5.6rem), minimal padding (1.2rem), collapsed navigation

### Border Radius Scale
| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 8px | Small controls, embedded elements |
| `--radius-md` | 10px | Inputs, buttons, list items |
| `--radius-lg` | 14px | Cards, containers |
| `--radius-xl` | 18px | Large modals, panels |
| `--radius-pill` | 999px | Badges, chips, pill buttons |

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Level 0 | No shadow, subtle border | Default cards, surfaces |
| Level 1 | `shadow-1: 0 1px 2px hsl(0 0% 0% / 0.22)` | Subtle raised elements |
| Level 2 | `shadow-2: 0 6px 14px hsl(0 0% 0% / 0.24)` | Hovered cards, modals |
| Modal | `var(--surface-3)` bg, centered, overlay backdrop | Dialogs, end-session modal |

### Shadow Philosophy
Shadows are used minimally — only to separate interactive elements from their containers on hover or when active. Default surfaces use a hairline border (`1px solid var(--border)`) instead of shadow to define edges.

## 7. Do's and Don'ts

### Do
- Let workout data dominate every screen — weight, sets, reps ARE the design
- Use Fire Orange (`#F97316`) exclusively for primary actions and active states — never for decoration
- Maintain dark surfaces — the gym is a low-light environment
- Keep typography restrained — Barlow Condensed for display (athletic), Barlow for body (readable)
- Use border-radius consistently (8-10-14-18 scale) — precision over playfulness
- Trust negative space as a luxury signal — never fill available space just because it's empty
- Keep transitions at 160–200ms — urgency in motion matches workout intensity
- Show PRs and streaks as celebration moments — the only "decoration" is achievement data

### Don't
- Use emojis as structural icons — use SVG icons (Lucide-style) consistently
- Add decorative shadows to elements — elevation through shadow contradicts the flat, dark aesthetic
- Use more than one bright accent color on a single screen — orange for actions, green for success, red for errors only
- Apply gradients, patterns, or ornamental backgrounds to surfaces — dark and data are the only backgrounds
- Use text smaller than 1.1rem — legibility in low light is critical
- Hide content behind unclear affordances — every interactive element must look interactive
- Override the Barlow system with other typefaces — cross-page consistency is a core value
- Use em dashes (`--`) in copy — use commas, colons, or periods instead
- Clutter the viewport with secondary actions — every screen should have at most one primary action

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Bottom nav replaces sidebar, page padding → 1.2rem, cards become full-width, condensed stat layouts, timer fills viewport |
| Tablet | 640–1023px | Sidebar hidden, mobile toggle nav, padding → 1.6rem, 2-column stat grids possible |
| Desktop | ≥1024px | Full sidebar (24rem), padding → 2.4rem, multi-column card grids |

### Touch Targets
- All interactive elements: minimum 44×44px tap target
- Bottom nav items: flexible height (5.6rem nav bar), full-width tap areas
- Buttons: minimum 3.8rem height with adequate padding
- Form inputs: minimum 4.2rem height for fat-finger targets

### Collapsing Strategy
- **Navigation**: Sidebar on desktop → hamburger drawer on tablet → bottom tab bar on mobile
- **Stat cards**: Multi-column grid on desktop collapses to 1–2 columns on mobile
- **Charts**: SVG charts are responsive (100% width) with horizontal scroll for dense data
- **Exercise list**: Side-by-side label/actions layout stacks vertically on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary accent: "Fire Orange (#F97316)" — `var(--accent)`
- Success: "Growth Green (#22C55E)" — `var(--success)`
- Destructive: "Alert Red (#EF4444)" — `var(--destructive)`
- Background: "Near Black (#050505)" — `var(--bg)`
- Surface: "Surface Black (#0B0B0B)" — `var(--surface)`
- Surface-2: "Surface Dark (#111111)" — `var(--surface-2)`
- Text: "White Smoke (#F6F6F6)" — `var(--text)`
- Muted: "Silver Mute (#9CA3AF)" — `var(--muted)`
- Border: "Border Fade (hsla(0, 0%, 100%, 0.08))" — `var(--border)`

### Design Decision Rules
- When adding a new page, first check if it's a data page (chart/list heavy) or form page (input heavy). Data pages use full width; form pages cap at 48rem
- Every interactive element needs: default, hover, focus, active, and disabled states
- Loading states use skeleton screens matching the final layout shape, not spinners
- Empty states should teach the feature, not just say "nothing here"
- Motion is 160-200ms ease — fast enough to feel responsive, slow enough to perceive
- View Transitions are enabled — page transitions are handled by Astro's ClientRouter
- Components use CSS custom properties from `tokens.css` — never hardcode values that exist as tokens
