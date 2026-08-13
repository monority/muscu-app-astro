# Gym Empire — Implementation Plan

## Important

Read every file in docs/design/ before modifying the application.

Do not start by editing random components.

## Phase 0 — Audit

Inspect:

- application architecture;
- global CSS;
- design tokens;
- layout;
- navigation;
- buttons;
- dashboard;
- charts;
- workout UI;
- responsive behavior.

Run the existing validation commands.

Record the baseline.

## Phase 1 — Design foundation

Improve the existing design tokens.

Focus on:

- typography;
- spacing;
- surfaces;
- borders;
- radius;
- shadows;
- focus states;
- interactive states.

Do not create a second design system.

## Phase 2 — App shell

Redesign:

- global layout;
- navigation;
- header;
- content container;
- background.

At the end of this phase, the application should already look substantially different.

## Phase 3 — Buttons

Redesign the button primitives.

Then audit existing usages.

Do not manually create dozens of button variants.

## Phase 4 — Dashboard

Perform the largest visual redesign here.

Change the composition.

Reduce dependence on cards.

Increase:

- typography;
- whitespace;
- metrics;
- charts;
- visual hierarchy.

## Phase 5 — Workout

Apply the visual language to:

- workout list;
- workout detail;
- builder;
- active workout;
- set rows;
- timer;
- completion.

Keep the interaction logic intact.

## Phase 6 — Progression

Apply the design system to:

- statistics;
- records;
- history;
- trends;
- weight;
- calendar.

## Phase 7 — Responsive

Test:

- 320px;
- 375px;
- 430px;
- 640px;
- 768px;
- 1024px;
- 1280px+.

Check:

- no horizontal overflow;
- readable text;
- accessible controls;
- correct hierarchy.

## Phase 8 — Accessibility

Verify:

- keyboard navigation;
- focus-visible;
- contrast;
- semantic HTML;
- accessible names;
- reduced motion.

## Phase 9 — Cleanup

Remove:

- obsolete CSS;
- duplicated styles;
- dead components;
- unnecessary overrides.

## Phase 10 — Validation

Run:

- type/check validation;
- tests;
- production build.

Then perform a complete visual walkthrough.

## Hard rule

Do not consider the redesign complete because the application builds.

The rendered interface must be visibly and structurally different from the original.
