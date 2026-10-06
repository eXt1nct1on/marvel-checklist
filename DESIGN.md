# Multiverse Tracker - Design System

The Multiverse Tracker uses a strict "comic-book editorial" flat design system, taking inspiration from print media, comic book panels, and high-contrast brutalism.

## Core Principles

1. **Flat Design Only**: Zero gradients, zero glows, zero glassmorphism, zero soft drop-shadows.
2. **Sharp Edges**: `border-radius: 0` is strictly enforced for all primary elements (cards, buttons, containers). A maximum of 2px radius is allowed for small interactive elements like inputs or chips if absolutely necessary, but 0 is preferred.
3. **High Contrast Borders**: Structure is created through solid 1px or 2px borders, thin rules, and grid layouts.
4. **Color as Meaning**: Colors are functional and meaningful, never purely decorative backgrounds.
   * `var(--red)` / `var(--red-text)`: Marvel universe indicators and primary CTAs.
   * `var(--dc-blue)`: DC universe indicators.
   * `var(--gold-fill)` / `var(--gold-text)`: Optional Doomsday picks and highlighted content.
5. **Print Typography**: 
   * Display Font: `Bebas Neue` (self-hosted, uppercase, tight tracking).
   * Body Font: System fallback (`system-ui, -apple-system, sans-serif`) for crisp readability.
6. **Interaction Design**: Hover states use structural changes like a 4px offset solid box-shadow or an inverted color fill, not a blur.

## CSS Custom Properties

The system is fully responsive to Light and Dark modes via `data-theme="light|dark"`.

### Dark Theme (Ink Black)
* `--bg`: `#0E0E0E`
* `--surface`: `#171717`
* `--surface-2`: `#222222`
* `--border`: `#343434`
* `--text`: `#F4F4F4`
* `--muted`: `#A6A6A6`
* `--red`: `#EC1D24`
* `--red-text`: `#FF4A50`
* `--on-red`: `#FFFFFF`
* `--gold-text`: `#FFC62B`
* `--gold-fill`: `#FFC62B`
* `--dc-blue`: `#1F6FEB`

### Light Theme (Comic Paper)
* `--bg`: `#F5F2EA`
* `--surface`: `#FFFFFF`
* `--surface-2`: `#ECE8DD`
* `--border`: `#151515`
* `--text`: `#111111`
* `--muted`: `#565656`
* `--red`: `#E4141B`
* `--red-text`: `#C4161C`
* `--on-red`: `#FFFFFF`
* `--gold-text`: `#B88400`
* `--gold-fill`: `#FFC62B`
* `--dc-blue`: `#1F6FEB`

## Layout Structures

* **Compact Hero**: Uses strong, solid color bands (e.g., Red) with bold condensed typography.
* **Horizontal Rails**: `rail-container` uses CSS `scroll-snap-type: x proximity` for horizontal scrolling without JavaScript dependencies.
* **Grid Containers**: `grid-container` provides an auto-fill responsive grid for cards.

## Component Specifics

* **Posters**: When an image is unavailable or loading, the system uses a flat colored placeholder with a text monogram, eliminating expensive procedural SVG rendering.
* **Watched Checkbox**: Rendered as a solid square box that fills with the text color and displays an inverted checkmark.
* **Buttons**: Bordered, flat, sharp corners. Hover applies a solid offset shadow (e.g. `box-shadow: 4px 4px 0 var(--border)`).

## Background Video Facade

The optional YouTube background video adheres to the flat design rules:
1. **Zero Gradients**: The background is a solid embedded iframe behind the content.
2. **Opacity Dimming**: To ensure text readability on solid `--surface` containers, the background layer relies solely on a flat CSS `opacity: var(--bg-video-opacity)` (default 0.20 in dark mode, 0.30 in light mode). No gradient overlays or blurs are used.
3. **Data/Battery Saver**: The background video respects `prefers-reduced-motion`, `saveData`, and slow network connections, falling back to a static facade image.
