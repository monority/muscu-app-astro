# Project Conventions

## Alpine Componentization Rule

When a component is rendered dynamically by Alpine x-for/x-if/runtime state,
do not attempt to extract its markup into an Astro component.

Keep the runtime template in the Alpine-controlled .astro template.

Extract all reusable logic into TypeScript modules.

Use Astro components only for:
- static/build-time composition
- server-rendered UI
- reusable markup that does not depend on Alpine runtime iteration

Use Alpine components for:
- runtime repeated UI
- x-for generated elements
- local state
- interactions
- runtime DOM behavior

Use TypeScript modules for:
- business logic
- transformations
- validation
- formatting
- reusable functions
- constants
- types

### Pattern

```
src/components/builder/
  exerciseCard.ts    — Alpine component logic (state + methods)
  setTable.ts        — Alpine component logic
  exercisePicker.ts  — Alpine component logic
```

Template: inline in parent `.astro` with `x-data="componentName(args)"`.
Events: `$dispatch("builder:event-name", detail)` for parent communication.
Labels: via `window.__builderLabels` set during parent init.
