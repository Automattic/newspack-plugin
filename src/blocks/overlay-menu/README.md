# Overlay Menu Block

A Gutenberg block that provides an accessible drawer menu pattern with a trigger button and a sliding content panel.

## Overview

The Overlay Menu is a three-block system: a parent container (`newspack/overlay-menu`) that holds an Overlay Button (`newspack/overlay-menu-trigger`) and a Menu Panel (`newspack/overlay-menu-panel`). The parent is `templateLock="all"` — both child blocks are always present and cannot be removed or reordered. The block is only available in block themes.

Each instance gets a unique `instanceId` derived from its `clientId`. The parent provides this via block context (`newspack-overlay-menu/instanceId`), and both children consume it to link the trigger to the panel via ARIA and to scope body classes and panel IDs on the frontend.

Multiple instances on the same page are fully independent.

## Block attributes

### `newspack/overlay-menu` (parent)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `instanceId` | string | `""` | Unique identifier scoped to this block instance. Derived from `clientId` on first render and synced to attributes so it survives duplication. Provided to children via context. |

### `newspack/overlay-menu-trigger` (Overlay Button)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `triggerText` | string | `"Menu"` | Label text on the trigger button. Always present in the DOM; may be visually hidden depending on the active block style. |

**Block styles:**

| Style | Description |
|-------|-------------|
| Default | Hamburger icon + label text |
| Icon only | Icon only; label hidden with `screen-reader-text` |
| Text only | Label only; no icon |

**Block supports:** `color.text`, `color.background`, `typography.fontSize`, `spacing.padding`, `border.radius`.

### `newspack/overlay-menu-panel` (Menu Panel)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `slideDirection` | string | `"left"` | Which side the panel slides in from. Accepted values: `"left"`, `"right"`. |
| `overlayColor` | string | `""` | Color of the scrim backdrop. Supports RGBA for transparency. Read by `view.js` from a `data-overlay-color` attribute on the panel element. |
| `panelBackgroundColor` | string | `""` | Panel background color. Applied as an inline style. |
| `panelTextColor` | string | `""` | Panel text color. Applied as an inline style. |
| `isPreviewOpen` | boolean | `false` | Ephemeral editor-only flag to show the panel in the editor for design purposes. Not persisted on save. |

## Editor behavior

**Preview toggle**: Both the trigger and panel toolbars include a `PanelPreviewToggle` button (shared component at `panel-preview-toggle.js`). Activating it sets `isPreviewOpen` to `true` on the panel block, making the panel visible in the editor without navigating to the frontend.

**Trigger edit**: `triggerText` is edited inline via a plain-text `RichText` field inside the button. The icon is not configurable from the editor.

**Panel colors**: The panel's sidebar uses `ColorGradientSettingsDropdown` for text, background, and overlay color, supporting the theme palette and custom colors including alpha.

## Rendering

**Trigger block**: Client-side only (`save: () => null`). All output is handled in `edit.js`.

**Panel block**: Dynamic block. The PHP render callback (`class-overlay-menu-panel-block.php`) builds the panel wrapper with ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-hidden="true"`, `aria-label`), passes `instanceId` from block context, and outputs InnerBlocks content. The `data-overlay-color` attribute on the panel wrapper is used by `view.js` to set the scrim color at runtime.

**Frontend script** (`view.js`, webpack entry `overlay-menu-block`): Creates a self-contained controller per instance (`createFlyoutInstance`). On open, the panel is moved to `document.body` (to avoid stacking context issues from CSS transforms), ARIA states are updated, a focus trap is activated, and a scrim element is created dynamically. Escape closes the menu. Focus returns to the trigger on close.

**CSS note**: Panel and scrim styles are written at root scope (not nested inside the block wrapper selector) because the panel moves to `document.body` on open and loses its ancestor context.

## Availability

Block theme only. Registration in `includes/class-blocks.php` is conditional on `wp_is_block_theme()`.

## Usage with block theme patterns

The block is typically placed in a header template part. Example markup:

```html
<!-- wp:newspack/overlay-menu -->
<div class="wp-block-newspack-overlay-menu">
  <!-- wp:newspack/overlay-menu-trigger {"triggerText":"Menu"} /-->
  <!-- wp:newspack/overlay-menu-panel {"slideDirection":"left"} -->
  <div class="wp-block-newspack-overlay-menu-panel">
    <!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","orientation":"vertical"}} /-->
  </div>
  <!-- /wp:newspack/overlay-menu-panel -->
</div>
<!-- /wp:newspack/overlay-menu -->
```

## Related

- [Overlay Menu block source](.) — Parent block, `view.js` frontend controller, and shared `panel-preview-toggle.js` component.
- [Trigger block source](./trigger/) — Button sub-block with style variations.
- [Panel block source](./panel/) — Drawer panel sub-block with color controls and PHP renderer.
- [`includes/class-blocks.php`](../../../includes/class-blocks.php) — Conditional block registration (block theme check).
