# Overlay Menu Block — Development Notes

## Overview

A composite Gutenberg block that renders a trigger button and a slide-in drawer panel. It is implemented as **three registered blocks** nested inside a locked parent, following the same pattern as `core/navigation`.

---

## Block Structure

```
newspack/overlay-menu          ← parent wrapper (locked InnerBlocks)
├── newspack/overlay-menu-trigger   ← open button (wp-block-button styled)
└── newspack/overlay-menu-panel     ← drawer with close button + InnerBlocks
```

### `newspack/overlay-menu` (parent)

- Renders a `wp-block-buttons is-layout-flex` wrapper div.
- Generates a stable `instanceId` (derived from `clientId`) on first insert and shares it with children via the **block context API** (`providesContext`).
- Uses `templateLock="all"` — children cannot be moved, deleted, or reordered, but are fully editable (colors, text, etc.).
- Supports: anchor, margin spacing.
- **Toolbar**: "Open panel / Close panel" text button — reads the child panel block's `isPreviewOpen` attribute via `useSelect('core/block-editor').getBlock(clientId)` and writes it via `useDispatch('core/block-editor').updateBlockAttributes`.

### `newspack/overlay-menu-trigger`

- Registered as `"parent": ["newspack/overlay-menu"]` — only insertable inside the parent.
- Receives `instanceId` via context (`usesContext`); uses it to set `aria-controls` linking to the panel.
- Renders as a `wp-block-button` wrapper div containing a `<button>` styled with `wp-block-button__link wp-element-button`.
- Supports native block color (text + background), typography (font size), spacing (padding), and border (radius) — these appear in the block inspector sidebar.
- Display modes (controlled via block **Styles** panel):
  - `default` — overlay SVG icon + editable text
  - `icon-only` — icon only (text rendered as `screen-reader-text`)
  - `text-only` — no icon
- Trigger text is inline-editable via `RichText`.
- **Toolbar**: "Open panel / Close panel" text button — reads and writes the panel sibling's `isPreviewOpen` attribute via `useSelect`/`useDispatch('core/block-editor')`.
- Block inserter icon: `button` from `@wordpress/icons`.
- `save: () => null` — fully dynamic (PHP renders).

### `newspack/overlay-menu-panel`

- Registered as `"parent": ["newspack/overlay-menu"]` — only insertable inside the parent.
- Receives `instanceId` via context; PHP uses it to set `id="newspack-overlay-panel-{instanceId}"` on the panel div.
- Contains free `InnerBlocks` (default template: `core/navigation` in vertical flex layout).
- Renders its own **close button** directly (not a separate child block); close button text is inline-editable via `RichText`. Close button always uses icon-only mode (text is `screen-reader-text`).
- Inspector sidebar controls:
  - **Settings panel**: slide direction toggle (Left / Right) via `ToggleGroupControl`.
  - **Color panel** (`InspectorControls group="color"`): Text (`panelTextColor`), Background (`panelBackgroundColor`), and Overlay (`overlayColor`) using `__experimentalColorGradientSettingsDropdown` with `enableAlpha`. Theme color palette is supplied via `useSettings('color.palette')`.
- **`isPreviewOpen` attribute** (boolean, default `false`): shared state attribute that lets both the parent and trigger toolbar buttons toggle the panel's preview from outside. Local `useState` is synced bidirectionally with this attribute via `useEffect`.
- **Toolbar**: "Open panel / Close panel" text button — toggles local preview and writes back to `isPreviewOpen` attribute.
- In-editor preview: when open, panel renders as `position:fixed` overlay with scrim; when closed, renders as `overlay-menu__editor-panel-hidden` (display:none).
- Block inserter icon: `sidebar` from `@wordpress/icons`.
- `save` persists InnerBlocks content: `<div {...useBlockProps.save()}><InnerBlocks.Content /></div>`. PHP renders the outer wrapper.

---

## File Structure

```
src/blocks/overlay-menu/
├── NOTES.md                          ← this file
├── block.json                        ← parent block metadata
├── edit.js                           ← parent editor component
├── index.js                          ← parent block registration
├── view.js                           ← frontend JS (see below)
│
├── trigger/
│   ├── block.json
│   ├── class-overlay-menu-trigger-block.php
│   ├── edit.js
│   └── index.js
│
└── panel/
    ├── block.json
    ├── class-overlay-menu-panel-block.php
    ├── edit.js
    └── index.js
```

PHP classes are also required from `includes/class-blocks.php` (inside the `wp_is_block_theme()` gate):

```php
require_once NEWSPACK_ABSPATH . 'src/blocks/overlay-menu/trigger/class-overlay-menu-trigger-block.php';
require_once NEWSPACK_ABSPATH . 'src/blocks/overlay-menu/panel/class-overlay-menu-panel-block.php';
```

All three blocks are registered in `src/blocks/index.js` inside the `is_block_theme` flag gate.

---

## Context / State Sharing

### `instanceId` (parent → children)

```
block.json (parent):   "providesContext": { "newspack-overlay-menu/instanceId": "instanceId" }
block.json (children): "usesContext": [ "newspack-overlay-menu/instanceId" ]
```

In edit.js (children): `context['newspack-overlay-menu/instanceId']`
In PHP render_callback: `$block->context['newspack-overlay-menu/instanceId']`

### `isPreviewOpen` (panel attribute, written by parent, trigger, and panel toolbars)

The panel owns this boolean attribute. All three "Open/Close panel" toolbar buttons read/write it:

- **Parent** uses `useSelect` to find the child panel block (`getBlock(clientId).innerBlocks.find(...)`), reads `panelBlock.attributes.isPreviewOpen`, and writes via `updateBlockAttributes(panelBlock.clientId, { isPreviewOpen })`.
- **Trigger** uses `useSelect` to find the panel sibling block (`getBlockRootClientId` → `getBlocks` → find `newspack/overlay-menu-panel`), reads `panelBlock.attributes.isPreviewOpen`, and writes via `updateBlockAttributes(panelBlock.clientId, { isPreviewOpen })`.
- **Panel** reads `attributes.isPreviewOpen`, syncs to local `useState` via `useEffect`, and calls `setAttributes({ isPreviewOpen })` to write.

All three toolbar buttons stay in sync because they all read from and write to the same attribute on the panel block.

---

## PHP Render Callbacks

### `Overlay_Menu_Block::render_block( $attributes, $content )`

Renders the outer wrapper using `get_block_wrapper_attributes()` with `wp-block-buttons is-layout-flex` classes and a `data-overlay-id` attribute. `$content` is the rendered InnerBlocks (trigger + panel HTML).

### `Overlay_Menu_Trigger_Block::render_block( $attributes, $content, $block )`

Reads `instanceId` from `$block->context`. Renders a `wp-block-button` wrapper div (with `get_block_wrapper_attributes()` for color/typography/spacing inline styles) containing a `<button>` with `aria-controls="newspack-overlay-panel-{id}"` and `aria-expanded="false"`.

### `Overlay_Menu_Panel_Block::render_block( $attributes, $content, $block )`

Reads `instanceId` from `$block->context`. Renders:
- Outer wrapper via `get_block_wrapper_attributes()`
- Panel div: `id="newspack-overlay-panel-{id}"`, `data-direction`, `data-overlay-color`, `aria-hidden="true"`, `role="dialog"`, `aria-modal="true"`, `aria-label`
- Inline `style` on panel div combining `background` (`panelBackgroundColor`) and `color` (`panelTextColor`) if set
- Close button (directly in PHP, not a child block) — always icon + screen-reader-text
- `$content` (InnerBlocks HTML)

---

## Frontend Script (`view.js`)

Loaded only on the frontend (registered as `viewScript` in parent `block.json`). Compiled to `dist/overlay-menu-block.js`.

Each block instance gets an independent controller via `createFlyoutInstance(wrapper)`:

- **Open**: moves panel to `document.body` (fixes stacking context issues with `position:fixed`), adds `overlay-menu__panel--open` class, creates scrim overlay, sets ARIA states, traps focus inside panel.
- **Close**: removes `--open` class, waits for CSS `transitionend` on position properties before restoring panel to original DOM position, releases focus trap, returns focus to trigger.
- **Overlay color**: read from `panel.dataset.overlayColor` (set by PHP as `data-overlay-color`).
- **Focus trap**: captures Tab/Shift+Tab to cycle through visible focusable elements inside the panel.
- **ESC key**: closes the open panel for that instance only.
- **Multiple instances**: each is fully independent with no shared module-level state.

---

## CSS Classes

| Class | Element | Purpose |
|---|---|---|
| `wp-block-newspack-overlay-menu` | Outer wrapper | Auto-added by WordPress |
| `wp-block-buttons is-layout-flex` | Outer wrapper | Inherits buttons layout |
| `wp-block-button` | Trigger wrapper | Button block styles |
| `wp-block-button__link wp-element-button` | `<button>` trigger | Button link styles |
| `overlay-menu__trigger` | `<button>` trigger | JS hook |
| `overlay-menu__icon` | Icon `<span>` | Wraps SVG icons |
| `overlay-menu__panel` | Panel div | Base panel styles |
| `overlay-menu__panel--open` | Panel div | Triggered by JS to animate in |
| `overlay-menu__panel--left/right` | Panel div | Slide direction |
| `overlay-menu__close-wrapper` | Close button container | Layout |
| `overlay-menu__close` | `<button>` close | JS hook + styles |
| `overlay-menu__content` | InnerBlocks wrapper | Scrollable content area |
| `overlay-menu__scrim` | Overlay div | Background scrim |
| `overlay-menu__editor-panel-hidden` | Panel div (editor only) | Hides panel preview when closed |
| `menu-open--overlay-menu-{id}` | `<body>` | Allows CSS to lock scroll |

---

## Known Limitations / Future Work

- The `isPreviewOpen` attribute is saved to the database as part of block serialization. It defaults to `false` so it doesn't affect frontend rendering, but it is technically ephemeral editor state stored as persistent data.
- The close button is rendered directly by the panel's PHP/edit.js rather than as its own child block, which keeps the block tree simple but means the close button doesn't get its own block supports.
- The block is currently gated behind `is_block_theme` (block theme only). To enable on classic themes, remove the `is_block_theme` check in `src/blocks/index.js` and `includes/class-blocks.php`.
