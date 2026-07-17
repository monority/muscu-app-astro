# Design

## Overview

Muscu App uses a dark, high-contrast, gym-forward visual system. The chosen direction is the noir profond theme: intense, minimal in ornament, and easy to read in a training environment.

## Color

### Core palette
- Background: `#050505`
- Surface: `#0D0D0D`
- Raised surface: `#121212`
- Border: `rgba(255, 255, 255, 0.08)`
- Text: `#F6F6F6`
- Muted text: `#A5ADB6`
- Primary accent: `#FF3D3D`
- Secondary accent: `#FF7A18`
- Success accent: `#88F2B8`
- Warning accent: `#FFD166`

### Usage
- Use red for primary action and active state.
- Use orange sparingly for secondary emphasis and timers.
- Keep inactive surfaces near-black, not gray.
- Do not use color as decoration without state meaning.

## Typography

- Primary type: `Segoe UI Variable Text`, with `Bahnschrift SemiCondensed` only for compact display moments.
- Use one font family for most UI surfaces when possible.
- Headlines should be strong, uppercase only for short labels and section names.
- Body text remains sentence case and highly readable.

## Layout

- Mobile-first, with a strong single-column stack on small screens.
- Dense but breathable cards and panels.
- Clear hierarchy: session status, timer, current exercise, tracking fields, history.
- Keep the current workout above secondary context.

## Components

- Hero / session header
- Rest timer module
- Exercise list rows
- Tracking form fields
- History items
- Compact status badges
- Primary and secondary action buttons

## Motion

- Motion should communicate state, not decorate.
- Use short transitions only.
- Respect reduced motion.
- Avoid page-load choreography.

## Accessibility

- Target high contrast ratios.
- Use large tappable controls.
- Support keyboard focus states.
- Never depend on hue alone for meaning.
- Preserve readability under low light and fatigue.

## Visual Notes

- Avoid glassmorphism as a default.
- Avoid large rounded cards.
- Avoid colorful inactive controls.
- Keep the interface direct, compact, and high energy.
