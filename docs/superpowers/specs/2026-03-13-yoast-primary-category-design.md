# Yoast Primary Category Support

**Linear**: [NPPD-1346](https://linear.app/a8c/issue/NPPD-1346/yoast-primary-category-support)
**Date**: 2026-03-13
**Status**: Approved

## Problem

Yoast SEO lets publishers set a primary category per post, stored as `_yoast_wpseo_primary_category` post meta. The Newspack classic theme and newspack-blocks already support this, but the block theme does not. The primary category retrieval logic is also duplicated across repos with no shared utility.

## Decisions

- **Approach**: Filter the existing `core/post-terms` block output server-side via `render_block`, rather than creating a new custom Taxonomy block.
- **Shared utility**: Create a `Newspack\Primary_Category` class in newspack-plugin that all repos can use.
- **Setting location**: Toggle in Newspack Settings > Advanced Settings wizard section.
- **Taxonomy scope**: Categories only (not other taxonomies).
- **newspack-blocks refactor**: Out of scope; separate PR later.

## Design

### 1. Shared utility (newspack-plugin)

**New file**: `includes/class-primary-category.php`
**Namespace**: `Newspack`

```php
class Primary_Category {
    public static function init() {
        // Register setting default.
    }

    /**
     * Get the primary category for a post.
     *
     * @param int|null $post_id Post ID. Defaults to current post.
     * @return WP_Term|false Primary category term object, or false if not available.
     */
    public static function get( $post_id = null ) {
        // 1. Check if feature is enabled via wp_option.
        // 2. Check if WPSEO_Primary_Term class exists.
        // 3. Get primary term for 'category' taxonomy.
        // 4. Return WP_Term or false (caller handles fallback).
    }

    /**
     * Check if the primary category feature is enabled.
     *
     * @return bool
     */
    public static function is_enabled() {
        // Returns bool from 'newspack_primary_category_enabled' option.
        // Default: true.
    }
}
```

Key points:
- `get()` returns `WP_Term|false`, not HTML. Callers decide how to render.
- Returns `false` when no primary is set, Yoast is inactive, or the feature is disabled.
- No filter hooks initially; can be added later if needed.

### 2. Settings UI (newspack-plugin)

**Location**: Advanced Settings section of the Newspack Settings wizard.

- **Control**: `ToggleControl`
- **Label**: "Use Yoast primary category"
- **Help text**: "When enabled, only the primary category set in Yoast SEO is displayed on posts. Disable to show all categories."
- **Option name**: `newspack_primary_category_enabled`
- **Default**: `true`
- **Conditional**: Only rendered when Yoast SEO is active.

Backend: Add the option to the existing Advanced Settings GET/POST REST endpoints.

### 3. Block theme filter (newspack-block-theme)

**New file**: `includes/class-primary-category.php`
**Namespace**: `Newspack_Block_Theme`

```php
final class Primary_Category {
    public static function init() {
        \add_filter( 'render_block', [ __CLASS__, 'filter_post_terms' ], 10, 2 );
    }

    public static function filter_post_terms( $block_content, $block ) {
        // 1. Bail if not core/post-terms or not category taxonomy.
        // 2. Bail if not front-end.
        // 3. Call Newspack\Primary_Category::get() from newspack-plugin.
        // 4. If false, return original block content.
        // 5. Preserve wrapper element and its classes/attributes.
        // 6. Replace inner HTML with single <a> linking to the primary category.
    }
}
```

The `core/post-terms` block renders as:
```html
<div class="taxonomy-category wp-block-post-terms">
    <a href="/cat1/" rel="tag">Cat 1</a>
    <span class="wp-block-post-terms__separator">, </span>
    <a href="/cat2/" rel="tag">Cat 2</a>
</div>
```

The filter preserves the wrapper `<div>` and its attributes, replacing the inner content with a single category link.

Dependency on `newspack-plugin` is guarded with `class_exists( 'Newspack\Primary_Category' )`.

## Behavior matrix

| Yoast active? | Setting enabled? | Primary set? | Result |
|---|---|---|---|
| Yes | Yes | Yes | Show only primary category |
| Yes | Yes | No | Show all categories (unchanged) |
| Yes | No | Any | Show all categories (unchanged) |
| No | Any | Any | Show all categories (unchanged), setting hidden in UI |

## Scope boundaries

**In scope**:
- `Primary_Category` utility class in newspack-plugin
- Settings toggle in Advanced Settings
- `render_block` filter in newspack-block-theme

**Out of scope**:
- Refactoring newspack-blocks to use the shared utility
- Custom Taxonomy block
- Per-post or per-taxonomy overrides
- Support for non-category taxonomies

## Testing

- PHPUnit test in newspack-plugin for `Primary_Category::get()` with mocked Yoast class.
- Manual testing in block theme with Yoast active/inactive, setting on/off, primary set/unset.
