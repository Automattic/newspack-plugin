# Newspack Collections Module

This directory contains the core implementation of the Newspack Collections system, which provides a structured way to manage and organize content collections in WordPress.

Collections can be used for a number of things, but in Newspack it's usually used to organize Print issues. When an online publication also has a print edition, collections can be used to organize a digital version of their print publication.

Each issue will be a collection, and inside each collection, you can browse all the posts that are part of that issue, organized by the same sections used in the print publication.

Readers are also able to browse the archive of issues (collections), with a nice grid view showing all the covers. If available, they can also see or download the PDF with the print edition itself.

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
3. Set the post order in the collection using the field in the Collection Settings panel.
3. Save the post.

### Creating a section

1. Navigate to Collections > Sections in the WordPress admin interface sidebar or use the REST API to create a new section term.
2. Set the order via the form in the section editor or Quick Edit menu.

### Creating a category

1. Navigate to Collections > Categories in the WordPress admin interface sidebar or use the REST API to create a new category term.

## System overview

The Collections system is built around a custom post type (`newspack_collection`) and includes several key components for managing collections, their metadata, taxonomies, and synchronization.

## Backend components

### 1. Anatomy of a collection

A collection is a post of the `newspack_collection` CPT and a term of the `newspack_collection_taxonomy` at the same time. Both entities are linked together and share the same name.

A post is assigned to a collection via the `newspack_collection_taxonomy` taxonomy. Posts can also be organized in the `newspack_collection_section` taxonomy. When visiting the Collections page (single template for the collection CPT), posts will be listed and organized by the Sections taxonomy.

The collections themselves can also be categorized using the `newspack_collection_category` taxonomy. This will allow us to not only have one archive to list all the collections, but additional archives for each Collection category.

### 2. Collection custom post type ([`class-post-type.php`](class-post-type.php))
- Defined as a `newspack_collection` CPT.
- Supports: `title`, `editor`, `thumbnail`, `custom-fields`, and `page-attributes`.
- Includes custom ordering functionality via `menu_order`.
- Provides admin interface customizations.

### 3. Collection post meta fields ([`class-collection-meta.php`](class-collection-meta.php))

The following table details all available meta fields for collections:

| Meta Field | Type | Description | Format |
|------------|------|-------------|---------|
| `newspack_collection_file_attachment` | Integer | For uploaded file | Attachment ID |
| `newspack_collection_file_link` | String | External file URL | Valid URL |
| `newspack_collection_volume` | String | Collection volume information | Text (e.g., "IV") |
| `newspack_collection_number` | String | Collection number | Text (e.g., "#22") |
| `newspack_collection_period` | String | Collection period | Text (e.g., "Spring 2025") |
| `newspack_collection_subscribe_link` | String | A link to subscribe that will be displayed as a button on the collection page | Valid URL |
| `newspack_collection_order_link` | String | A link to order the physical version of that collection | Valid URL |

### 4. Data management ([`class-enqueuer.php`](class-enqueuer.php))
- Manages JavaScript data localization.
- Provides a common interface for adding/retrieving collection data dynamically.
- Dynamically handles styles and scripts enqueuing in a single place if data is localized and passed to the frontend.

### 5. Taxonomies
The system includes multiple taxonomy classes for organizing collections:

#### Collection category taxonomy ([`class-collection-category-taxonomy.php`](class-collection-category-taxonomy.php))
- Taxonomy name: `newspack_collection_category`.
- Non-hierarchical taxonomy for categorizing collections.
- Similar to WordPress post categories.

#### Collection section taxonomy ([`class-collection-section-taxonomy.php`](class-collection-section-taxonomy.php))
- Taxonomy name: `newspack_collection_section`.
- Non-hierarchical taxonomy for categorizing posts into sections.
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

### 6. Synchronization ([`class-sync.php`](class-sync.php))
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
Term created   -> Post created as a draft and linked
Term edited    -> Post edited (copy title and slug)
Term deleted   -> Post trashed (to prevent data loss)
```

### 7. Post meta fields ([`class-post-meta.php`](class-post-meta.php))
- Meta key: `newspack_order_in_collection`.
- Used for storing the post order in collection.

## Frontend components

The module provides a set of components for displaying collections-related elements on the admin frontend. These include panels for setting up metadata, performing ordering, and additional customizations.

### Integration

The frontend components are integrated into WordPress through:

1. **Script Loading**
   - Enqueued via `Enqueuer::enqueue_admin_scripts()` if the Collections module is enabled.
   - Bundle: `dist/collections-admin.js`

2. **Style Loading**
   - Enqueued via `Enqueuer::enqueue_admin_styles()` if the Collections module is enabled.
   - Bundle: `dist/collections-admin.css`

3. **Data Localization**
   - Collection data is localized via `Enqueuer::localize_data()`.
   - Available globally as a `newspackCollections` window object.

4. **REST API Integration**
   - All created components in this module are REST API-enabled.

## Module structure

- [`includes/collections/`](includes/collections/) - Core collection functionality (PHP).
- [`includes/optional-modules/class-collections-optional-module.php`](includes/optional-modules/class-collections-optional-module.php) - Optional module setup.
- [`includes/wizards/newspack/class-collections-section.php`](includes/wizards/newspack/class-collections-section.php) - Newspack settings Collections tab.
- [`src/collections/admin/`](src/collections/admin/) - Admin interface (JavaScript/styles).
- [`tests/unit-tests/collections/`](tests/unit-tests/collections/) - Unit tests
