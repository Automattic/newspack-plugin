# Newspack Collections Module

This directory contains the core implementation of the Newspack Collections system, which provides a structured way to manage and organize content collections in WordPress.

## Usage

### Enabling the module

1. Navigate to Newspack > Settings in the admin dashboard.
2. Select the Collections tab.
3. Click on the toggle to enable the Collections module.

### Creating a collection

1. Navigate to the Collections menu in the WordPress admin interface sidebar or use the REST API to create a new collection post.
2. Set the meta fields in the post editor using the fields in the Collection Details panel.
3. Set the collection order using the WordPress core functionality.

### Assigning posts to a collection

1. Use the WordPress admin interface or REST API to create or edit a post.
2. Select the collection and section from the post editor dropdowns.
3. Set the order of the post in the collection using the field in the Collection Settings panel.
3. Save the post.

### Creating a section

1. Navigate to Collections > Sections in the WordPress admin interface sidebar or use the REST API to create a new section term.
2. Set the order via the form in the section editor or Quick Edit menu.

### Creating a category

1. Navigate to Collections > Categories in the WordPress admin interface sidebar or use the REST API to create a new category term.

## System overview

The Collections system is built around a custom post type (`newspack_collection`) and includes several key components for managing collections, their metadata, taxonomies, and synchronization.

## Backend components

### 1. Collection custom post type ([`class-post-type.php`](class-post-type.php))
- Defined as a `newspack_collection` CPT.
- Supports: `title`, `editor`, `thumbnail`, `custom-fields`, and `page-attributes`.
- Includes custom ordering functionality via `menu_order`.
- Provides admin interface customizations.

### 2. Collection post meta fields ([`class-collection-meta.php`](class-collection-meta.php))

The following table details all available meta fields for collections:

| Meta Field | Type | Description | Format |
|------------|------|-------------|---------|
| `newspack_collection_file_attachment` | Integer | For uploaded file | Attachment ID |
| `newspack_collection_file_link` | String | External file URL | Valid URL |
| `newspack_collection_volume` | String | Collection volume information | Text |
| `newspack_collection_issue_number` | String | Issue number | Text |
| `newspack_collection_issue_date` | String | Issue date | Text (e.g., "Spring 2025") |
| `newspack_collection_subscribe_link` | String | Subscription URL | Valid URL |
| `newspack_collection_order_link` | String | Order URL | Valid URL |

### 3. Data management ([`class-collections-data.php`](class-collections-data.php))
- Manages JavaScript data localization.
- Provides a common interface for adding/retrieving collection data dynamically.
- Handles script enqueuing for rendering the localized data in a single place.

### 4. Taxonomies
The system includes multiple taxonomy classes for organizing collections:

#### Collection category taxonomy ([`class-collection-category-taxonomy.php`](class-collection-category-taxonomy.php))
- Taxonomy name: `newspack_collection_category`.
- Non-hierarchical taxonomy for categorizing collections.
- Similar to WordPress post categories.

#### Collection section taxonomy ([`class-collection-section-taxonomy.php`](class-collection-section-taxonomy.php))
- Taxonomy name: `newspack_collection_section`.
- Non-hierarchical taxonomy for categorizing post into sections.
- Similar to WordPress tags.
- Adds a new "Section" column to the post list.
- Order is stored in the term meta `newspack_collection_section_order`.

#### Collection taxonomy ([`class-collection-taxonomy.php`](class-collection-taxonomy.php))
- Taxonomy name: `newspack_collection_taxonomy`.
- Special internal taxonomy (`newspack_collection_taxonomy`) for associating collections with posts.
- It's a copy of the collection post title and slug to allow regular posts to be tagged with collections.
- Not publicly queryable.
- Hidden from the admin UI.
- Adds a new "Collection" column to the post list.
- Terms can be deactivated via an internal `_newspack_collection_inactive` term meta. Used when trashing posts, as terms don't manage status.

### 5. Synchronization ([`class-sync.php`](class-sync.php))
- Handles synchronization of collection posts and collection terms.
- Ensures data consistency across objects using a two-way meta relationship:
  - For posts, link via `_newspack_collection_term_id` internal post meta.
  - For terms, link via `_newspack_collection_post_id` internal term meta.
- Manages post and terms lifecycle events using the following logic:
```
Post created   -> Term created and linked (copy title and slug)
Post edited    -> Term edited (copy title and slug)
Post deleted   -> Term deleted
Post trashed   -> Term marked as inactive (via term meta)
Post untrashed -> Term marked as active (via term meta)
Term created   -> Post created as draft and linked
Term edited    -> Post edited (copy title and slug)
Term deleted   -> Post trashed (to prevent data loss)
```

### 6. Post meta fields ([`class-post-meta.php`](class-post-meta.php))
- Meta key: `newspack_order_in_collection`.
- Used for storing the post order in collection.

## Frontend components

The module provides a set of components for displaying collections-related elements on the admin frontend. These include panels for setting up meta data, performing ordering, and additional customizations.

### Integration

The frontend components are integrated into WordPress through:

1. **Script Loading**
   - Enqueued via `Collections::enqueue_admin_scripts()` if the Collections module is enabled.
   - Bundle: `dist/collections-admin.js`

2. **Style Loading**
   - Enqueued via `Collections::enqueue_admin_styles()` if the Collections module is enabled.
   - Bundle: `dist/collections-admin.css`

3. **Data Localization**
   - Collection data is localized via `Collections_Data::localize_data()`.
   - Available globally as `newspackCollections` window object.

4. **REST API Integration**
   - All created components in this module are REST API-enabled.

## Module structure

- [`includes/collections/`](includes/collections/) - Core collection functionality (PHP).
- [`includes/optional-modules/class-collections-optional-module.php`](includes/optional-modules/class-collections-optional-module.php) - Optional module setup.
- [`includes/wizards/newspack/class-collections-section.php`](includes/wizards/newspack/class-collections-section.php) - Newspack settings Collections tab.
- [`src/collections/admin/`](src/collections/admin/) - Admin interface (JavaScript/styles).
- [`tests/unit-tests/collections/`](tests/unit-tests/collections/) - Unit tests
