# Gym Empire — Motion

## Philosophy

Motion should make the interface feel alive without demanding attention.

Desired feeling:

alive, but quiet.

## Background animation

The background may use:

- slow flow lines;
- large orbital curves;
- sparse nodes;
- subtle grid;
- ambient gradients.

Keep opacity low.

The background must never compete with text or data.

## UI animation

UI transitions should generally be short and subtle.

Use motion for:

- state changes;
- feedback;
- hierarchy;
- continuity.

Do not animate everything.

## Avoid

Do not use:

- bouncing UI;
- excessive scaling;
- flashy particles;
- constant movement;
- large parallax effects;
- distracting cursor effects.

## Workout mode

Reduce decorative motion during an active workout.

Workout screens should feel focused.

## Reduced motion

Respect:

prefers-reduced-motion: reduce

When reduced motion is enabled:

- remove decorative movement;
- reduce transitions;
- keep the interface understandable.

## Performance

Prefer:

1. CSS;
2. pseudo-elements;
3. SVG;
4. Canvas only if genuinely necessary.

Avoid:

- large animated DOM trees;
- expensive filters;
- excessive blur;
- continuous layout calculations.

The background must not noticeably reduce application performance.
