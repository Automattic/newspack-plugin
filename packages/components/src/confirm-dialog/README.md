# ConfirmDialog

A modal confirmation dialog that intercepts client-side navigation when there are unsaved changes. Built on top of WordPress's `__experimentalConfirmDialog`. The dialog is invisible until a navigation attempt is blocked; when `when` becomes `true` and the user navigates away, the dialog appears automatically and resumes or cancels the navigation based on the user's choice.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `cancelButtonText` | `string` | — | Label for the cancel button. |
| `children` | `React.ReactNode` | — | Content rendered in the modal body. |
| `className` | `string` | — | Additional CSS class. |
| `confirmButtonText` | `string` | — | Label for the confirm button. |
| `hideTitle` | `boolean` | — | When `true`, hides the modal title and the × close button. |
| `isDestructive` | `boolean` | — | When `true`, applies destructive (e.g. red) styling to the confirm button. |
| `size` | `'small'` \| `'medium'` \| `'large'` \| `'x-large'` \| `'full'` | `'small'` | Controls the width of the modal. |
| `title` | `string` | — | Title displayed in the modal header. |
| `when` | `boolean` | `false` | When `true`, blocks router navigation and shows the dialog on any attempted navigation. Set this to reflect whether the current form has unsaved changes. |

## Usage

```jsx
import { ConfirmDialog } from 'newspack-components';

// Guard navigation when a form has unsaved changes.
// The dialog appears automatically when the user tries to navigate away.
<ConfirmDialog
	when={ hasUnsavedChanges }
	title="Unsaved changes"
	confirmButtonText="Leave anyway"
	cancelButtonText="Stay"
	isDestructive
>
	You have unsaved changes. Are you sure you want to leave?
</ConfirmDialog>

// Larger modal with a custom size
<ConfirmDialog
	when={ hasUnsavedChanges }
	size="medium"
	title="Discard changes?"
	confirmButtonText="Discard"
	cancelButtonText="Keep editing"
>
	Your changes will be lost if you leave this page.
</ConfirmDialog>
```
