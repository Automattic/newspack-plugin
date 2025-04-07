# Custom Bylines

**This feature is under development and is not meant to be used in production sites**

This feature allows authors to add custom bylines to posts.

## How it works

When you enable this feature, a new settings panel will be added to the post editor sidebar. You can use this panel to add a custom byline. The byline will be displayed before the post content. (See Data section below for the format of bylines)

Once inserted, the custom byline will be inserted at the top of the content, both in the Editor and in the front-end site (temporary behavior for migration QA purposes)

## Usage

This feature can be enabled by adding the following constant to your `wp-config.php`:

```php
define( 'NEWSPACK_BYLINES_ENABLED', true );
```

## Data

Bylines are stored as post meta and consists of the following fields:

| Name                          | Type      | Stored As   | Description                                                                                                           |
| ----------------------------- | --------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| `_newspack_byline_active`     | `boolean` | `post_meta` | Whether custom byline is active for the post                                                                          |
| `_newspack_byline`            | `string`  | `post_meta` | The custom byline. Author links can be included by wrapping text in the Author tag (`by [Author id=5]Jane Doe[/Author] and Eric Doe`) |
