# Separator

Horizontal rule component with alignment, variant, and margin options. Defaults: `alignment` is `full-width`, `variant` is `tertiary`.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `alignment` | `'full-width'` \| `'none'` | `'full-width'` | `full-width` breaks out of the container to span the viewport; `none` stays within the container. |
| `className` | `string` | — | Additional CSS class. |
| `marginBottom` | `number` \| `string` | `64` | Bottom margin (e.g. `64` or `"2rem"`). Capped at 32px on viewports &lt; 783px. |
| `marginTop` | `number` \| `string` | `64` | Top margin (e.g. `64` or `"2rem"`). Capped at 32px on viewports &lt; 783px. |
| `variant` | `'primary'` \| `'secondary'` \| `'tertiary'` | `'tertiary'` | Line color: `primary` uses the admin theme color (`--wp-admin-theme-color`); `secondary` uses `$gray-300`; `tertiary` uses `$gray-100` (lightest). |

## Usage

```jsx
import { Separator } from '@newspack/components';

<Separator />

<Separator alignment="none" variant="primary" />

<Separator marginBottom={48} marginTop={32} variant="secondary" />
```
