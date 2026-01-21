# My Account Button block

Provides a reader account/sign-in button for sites using Newspack Reader Activation. The button label and link update based on the reader’s authentication state.

## Settings
- Signed in label (`signedInLabel`): Text shown when the reader is authenticated.
- Signed out label (`signedOutLabel`): Text shown when the reader is not authenticated.

## Editor behavior
- Use the toolbar toggle (Signed in / Signed out) to edit each label.

## Front-end behavior
- If Reader Activation is disabled, the block renders nothing.
- If the user is signed in, the button links to the My Account page (WooCommerce).
- If the user is signed out, the button uses `data-newspack-reader-account-link` to open the Reader Activation modal.

## Notes
- Can be used alone or inside of `core/navigation` blocks.

