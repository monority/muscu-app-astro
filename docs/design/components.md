# Gym Empire — Components

## Objective

Create a coherent visual component system.

The component system should be small and reusable.

Do not create many visually similar components.

## Buttons

Use four levels:

1. Primary
2. Secondary
3. Ghost
4. Destructive

### Primary

For the main action.

Examples:

- Start workout
- Continue workout
- Save
- Create workout
- Finish workout

Characteristics:

- strong contrast;
- clear label;
- restrained radius;
- subtle transition;
- strong focus state.

Avoid:

- huge pills;
- excessive gradients;
- heavy shadows;
- exaggerated scaling.

### Secondary

For important but non-primary actions.

Use subtle surfaces and borders.

### Ghost

For low-emphasis actions.

### Destructive

For actions such as:

- delete;
- remove;
- clear.

Do not make destructive actions visually aggressive.

## Button labels

Prefer precise actions.

Good:

- Start workout
- Add set
- Save changes
- Create workout
- View history

Avoid vague labels such as:

- Go
- Click
- Submit

when a precise label exists.

## Button states

Every button should support:

- default;
- hover;
- active;
- focus-visible;
- disabled;
- loading when applicable.

## Icon buttons

Icon-only buttons must have:

- accessible name;
- keyboard support;
- visible focus;
- comfortable touch target.

## Cards

Cards should group related information.

Do not put every piece of information into a card.

Before creating a card, ask:

"Would typography, whitespace or a divider communicate this better?"

If yes, avoid the card.

## Inputs

Inputs require:

- visible labels;
- clear focus;
- readable values;
- useful validation;
- adequate touch target.

## Empty states

An empty state must answer:

1. Why is this empty?
2. What can I do?
3. How do I start?

Do not show fake statistics such as 0 kg or 0 PR when no data exists.

## Loading

Use skeletons when the layout benefits from them.

Do not add unnecessary spinners.

## Errors

Errors should explain:

- what happened;
- what the user can do;
- whether retry is available.

Do not expose unnecessary implementation details.

## Accessibility

All interactive components must support:

- semantic HTML;
- keyboard navigation;
- focus-visible;
- sufficient contrast;
- reduced motion;
- accessible labels.
