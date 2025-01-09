# Corrections

This feature allows authors to add article corrections to the top or bottom of a post.

## How it works

When you enable this feature, a new meta box will be added to the post editor screen. You can use this meta box to add a correction to the post. The correction will be displayed at the top or bottom of the post, depending on the settings.

## Usage

This feature can be enabled by adding the following constant to your `wp-config.php`:

```php
define( 'NEWSPACK_CORRECTIONS_ENABLED', true );
```

## Data

Corrections are stored as `newspack_correction` custom post type. A correction consists of the following fields:

| Name                          | Type     | Stored As      | Description                                                     |
| ----------------------------- | -------- | -------------- | --------------------------------------------------------------- |
| `title`                       | `string` | `post_title`   | The correction title. Defaults to 'Correction for [post title]' |
| `content`                     | `string` | `post_content` | The correction text.                                            |
| `date`                        | `string` | `post_date`    | The date assigned to the correction.                            |
| `newspack_correction-post-id` | `int`    | `post_meta`    | The ID of the post to which the correction is associated.       |

In addition, some correction data is stored in the associated post as post meta:

| Name                            | Type                    | Stored As   | Description                                                   |
| ------------------------------- | ----------------------- | ----------- | ------------------------------------------------------------- |
| `newspack_corrections_active`   | `bool`                  | `post_meta` | Whether the feature is enabled for the post.                  |
| `newspack_corrections_location` | `string`                | `post_meta` | Where the correction should be displayed. (`top` or `bottom`) |
| `newspack_corrections_ids`      | `array`                 | `post_meta` | An array of IDs of the corrections associated with the post.  |
