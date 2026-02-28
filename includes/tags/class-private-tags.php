<?php
/**
 * Private Tags
 *
 * @package Newspack
 */

namespace Newspack;

use WP_Term;

defined( 'ABSPATH' ) || exit;

/**
 * Allows editors to mark tags as private, hiding them from public view
 * while keeping them usable for internal organization.
 *
 * When a tag is marked private, the following occurs:
 * - It is not shown in post tag links on the frontend.
 * - It is excluded from tag cloud widgets.
 * - Its archive page returns a 404.
 * - Its RSS feed returns a 404.
 * - Its slug is stripped from post/body CSS classes.
 * - Its slug is stripped from ad targeting data.
 * - It is excluded from Yoast SEO structured data and sitemaps.
 *
 * In the admin area and Gutenberg editor:
 * - A "Private" column is added to the Tags list table, with a checkbox in Quick Edit.
 * - It is labeled "(private)" in the admin and Gutenberg editor.
 *
 * Note: This is a presentation-layer feature, not an access control mechanism.
 * Private tags remain in the database and may still be exposed by plugins or
 * custom code outside the Newspack stack.
 */
class Private_Tags {

	/**
	 * Meta key used to store the private tag flag.
	 *
	 * @var string
	 */
	const META_KEY = 'np_private_tag';

	/**
	 * Object cache group used for persistent caching of private tag queries.
	 *
	 * @var string
	 */
	const CACHE_GROUP = 'newspack_private_tags';

	/**
	 * Whether the class has already been initialized.
	 *
	 * @var bool
	 */
	private static $initiated = false;

	/**
	 * In-memory cache for get_private_tags() results, keyed by $fields.
	 *
	 * Acts as a first layer of caching within a single request, sitting in
	 * front of the persistent object cache (wp_cache_get/set). Cleared
	 * whenever a term's private status changes.
	 *
	 * @var array<string, array>
	 */
	private static $cache = [];

	// -------------------------------------------------------------------------
	// Initialization
	// -------------------------------------------------------------------------

	/**
	 * Initialize the class and register hooks.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initiated ) {
			return;
		}
		self::$initiated = true;

		// Admin UI: add checkbox to tag forms.
		add_action( 'post_tag_add_form_fields', [ __CLASS__, 'create_term_fields' ] );
		add_action( 'post_tag_edit_form_fields', [ __CLASS__, 'edit_term_fields' ] );
		add_action( 'saved_post_tag', [ __CLASS__, 'save_term' ] );

		// Admin: label private tags so editors can identify them.
		add_filter( 'term_name', [ __CLASS__, 'append_private_label_to_name' ], 10, 2 );
		add_filter( 'rest_prepare_post_tag', [ __CLASS__, 'append_private_label_to_rest' ], 10, 2 );

		// Admin: Private column and Quick Edit support.
		add_filter( 'manage_edit-post_tag_columns', [ __CLASS__, 'add_private_column' ] );
		add_filter( 'manage_post_tag_custom_column', [ __CLASS__, 'render_private_column' ], 10, 3 );
		add_action( 'quick_edit_custom_box', [ __CLASS__, 'quick_edit_fields' ], 10, 3 );
		add_action( 'edited_post_tag', [ __CLASS__, 'save_quick_edit' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_admin_scripts' ] );

		// Cache invalidation: also clear when meta is changed via WP-CLI, REST, or import scripts.
		add_action( 'added_term_meta', [ __CLASS__, 'maybe_clear_cache' ], 10, 3 );
		add_action( 'updated_term_meta', [ __CLASS__, 'maybe_clear_cache' ], 10, 3 );
		add_action( 'deleted_term_meta', [ __CLASS__, 'maybe_clear_cache' ], 10, 3 );
		// Also clear when a tag's slug or name changes (e.g. via WP-CLI or REST).
		add_action( 'edited_post_tag', [ __CLASS__, 'clear_cache' ] );

		// Frontend: hide private tags from various surfaces.
		add_filter( 'term_links-post_tag', [ __CLASS__, 'filter_tag_links' ] );
		add_filter( 'tag_cloud_sort', [ __CLASS__, 'filter_tag_cloud' ] );
		add_action( 'pre_get_posts', [ __CLASS__, 'disable_tag_archives' ] );

		// Frontend: strip private tag slugs from HTML class attributes.
		add_filter( 'post_class', [ __CLASS__, 'filter_post_class' ] );
		add_filter( 'body_class', [ __CLASS__, 'filter_body_class' ] );

		// Integrations: strip private tags from ad targeting data.
		add_filter( 'newspack_ads_ad_targeting', [ __CLASS__, 'filter_ad_targeting' ], 10, 2 );

		// Integrations: strip private tags from Yoast SEO structured data and sitemaps.
		add_filter( 'wpseo_schema_article', [ __CLASS__, 'filter_yoast_schema_article' ], 10, 2 );
		add_filter( 'wpseo_exclude_from_sitemap_by_term_ids', [ __CLASS__, 'filter_yoast_sitemap_term_ids' ] );
	}

	/**
	 * Check if a term is marked as private.
	 *
	 * @param WP_Term $term The term object.
	 * @return bool
	 */
	public static function is_term_private( WP_Term $term ) {
		// This class only handles post_tag; other taxonomies are out of scope.
		if ( 'post_tag' !== $term->taxonomy ) {
			return false;
		}
		return (bool) get_term_meta( $term->term_id, self::META_KEY, true );
	}

	// -------------------------------------------------------------------------
	// Private helpers
	// -------------------------------------------------------------------------

	/**
	 * Get a specific field for all private tags.
	 *
	 * Results are cached in two layers: static (per-request) and persistent
	 * object cache (cross-request, when Memcached is available).
	 * Both layers are invalidated by clear_cache().
	 *
	 * Only 'slugs', 'names', and 'ids' are handled by clear_cache(). If a new
	 * $fields value is added, clear_cache() must be updated accordingly.
	 *
	 * @param string $fields The field to return ('slugs', 'names', 'ids').
	 * @return array
	 */
	private static function get_private_tags( $fields ) {
		// Layer 1: in-memory static cache.
		if ( isset( self::$cache[ $fields ] ) ) {
			return self::$cache[ $fields ];
		}

		// Layer 2: persistent object cache (Memcached) — avoids DB query across requests.
		$cache_key = 'private_tags_' . $fields;
		$cached    = wp_cache_get( $cache_key, self::CACHE_GROUP );
		if ( false !== $cached ) {
			self::$cache[ $fields ] = $cached;
			return $cached;
		}

		// Layer 3: database query — only on a full cache miss.
		// Note: 'slugs' is not a valid get_terms() fields value; 'id=>slug' returns [id => 'slug']
		// and we extract just the slug values below.
		$result = get_terms(
			[
				'taxonomy'   => 'post_tag',
				'hide_empty' => false, // WP hides empty terms by default — include private tags even if they have zero posts.
				'meta_key'   => self::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value' => '1', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'fields'     => ( 'slugs' === $fields ) ? 'id=>slug' : $fields,
			]
		);

		// Do not cache WP_Error results — a transient DB error would permanently
		// suppress private-tag filtering until the cache is manually flushed.
		if ( is_wp_error( $result ) ) {
			return [];
		}

		// For 'slugs', get_terms() returns [id => 'slug'] — extract just the slug values.
		$value = empty( $result ) ? [] : ( ( 'slugs' === $fields ) ? array_values( $result ) : $result );

		self::$cache[ $fields ] = $value;
		wp_cache_set( $cache_key, $value, self::CACHE_GROUP );

		return $value;
	}

	/**
	 * Clear both the in-memory and persistent object cache for get_private_tags().
	 *
	 * Called after saving a term to ensure subsequent filter calls reflect
	 * the updated private status within the same request and across requests.
	 *
	 * The three cache keys correspond to the $fields values used by the
	 * get_private_tag_slugs/names/ids() wrappers. If a new wrapper is added,
	 * its $fields value must also be added to the foreach below.
	 *
	 * @return void
	 */
	public static function clear_cache() {
		self::$cache = [];
		foreach ( [ 'slugs', 'names', 'ids' ] as $fields ) {
			wp_cache_delete( 'private_tags_' . $fields, self::CACHE_GROUP );
		}
	}

	/**
	 * Clear the cache if the changed meta key is META_KEY.
	 *
	 * Handles cache invalidation for code paths that bypass save_term() and
	 * save_quick_edit() — e.g. WP-CLI, REST API, or import scripts that call
	 * update_term_meta() / delete_term_meta() directly.
	 *
	 * @param int    $_meta_id   Unused — required positional parameter.
	 * @param int    $_object_id Unused — required positional parameter.
	 * @param string $meta_key   The meta key being changed.
	 * @return void
	 */
	public static function maybe_clear_cache( $_meta_id, $_object_id, $meta_key ) {
		if ( self::META_KEY === $meta_key ) {
			self::clear_cache();
		}
	}

	/**
	 * Get slugs of all private tags.
	 *
	 * @return string[]
	 */
	private static function get_private_tag_slugs() {
		return self::get_private_tags( 'slugs' );
	}

	/**
	 * Get names of all private tags.
	 *
	 * @return string[]
	 */
	private static function get_private_tag_names() {
		return self::get_private_tags( 'names' );
	}

	/**
	 * Get IDs of all private tags.
	 *
	 * WordPress's get_terms() returns IDs as numeric strings. This will cast to int
	 * so Yoast and others can rely on a consistent type.
	 *
	 * @return int[]
	 */
	private static function get_private_tag_ids() {
		return array_map( 'intval', self::get_private_tags( 'ids' ) );
	}

	/**
	 * Get CSS class names (tag-{slug}) for all private tags.
	 *
	 * Used to strip private-tag classes from post and body class attributes.
	 *
	 * @return string[]
	 */
	private static function get_private_tag_classes() {
		return array_map(
			function( $slug ) {
				return 'tag-' . $slug;
			},
			self::get_private_tag_slugs()
		);
	}

	/**
	 * Return the translatable "(private)" suffix used in admin labels.
	 *
	 * @return string
	 */
	private static function get_private_label() {
		/* translators: suffix appended to tag names in the admin to indicate they are private */
		return ' ' . __( '(private)', 'newspack-plugin' );
	}

	// -------------------------------------------------------------------------
	// Admin UI
	// -------------------------------------------------------------------------

	/**
	 * Render the private tag checkbox on the Add Tag form.
	 *
	 * @return void
	 */
	public static function create_term_fields() {
		?>
		<div class="form-field term-private-wrap">
			<label for="<?php echo esc_attr( self::META_KEY ); ?>"><?php esc_html_e( 'Private tag', 'newspack-plugin' ); ?></label>
			<input type="checkbox" name="<?php echo esc_attr( self::META_KEY ); ?>" id="<?php echo esc_attr( self::META_KEY ); ?>" value="1">
			<p class="description"><?php esc_html_e( 'Private tags are not shown on the frontend. Their archive pages return 404 and they are excluded from tag clouds.', 'newspack-plugin' ); ?></p>
		</div>
		<?php
	}

	/**
	 * Render the private tag checkbox on the Edit Tag form.
	 *
	 * @param WP_Term $term The current term object.
	 * @return void
	 */
	public static function edit_term_fields( WP_Term $term ) {
		$is_private = get_term_meta( $term->term_id, self::META_KEY, true );
		?>
		<tr class="form-field term-<?php echo esc_attr( self::META_KEY ); ?>-wrap">
			<th scope="row">
				<label for="<?php echo esc_attr( self::META_KEY ); ?>"><?php esc_html_e( 'Private tag', 'newspack-plugin' ); ?></label>
			</th>
			<td>
				<input type="checkbox" name="<?php echo esc_attr( self::META_KEY ); ?>" id="<?php echo esc_attr( self::META_KEY ); ?>" value="1" <?php checked( '1', $is_private ); ?>>
				<p class="description"><?php esc_html_e( 'Private tags are not shown on the frontend. Their archive pages return 404 and they are excluded from tag clouds.', 'newspack-plugin' ); ?></p>
			</td>
		</tr>
		<?php
	}

	/**
	 * Save the private tag meta when a tag is created or updated.
	 *
	 * @param int $term_id The term ID.
	 * @return void
	 */
	public static function save_term( $term_id ) {
		$action = isset( $_POST['action'] ) ? sanitize_key( $_POST['action'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Action is read first to determine which nonce to verify below.

		if ( 'editedtag' === $action ) {
			check_admin_referer( 'update-tag_' . $term_id );
		} elseif ( 'add-tag' === $action ) {
			check_admin_referer( 'add-tag', '_wpnonce_add-tag' );
		} else {
			return;
		}

		if ( ! empty( $_POST[ self::META_KEY ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above via check_admin_referer().
			update_term_meta( $term_id, self::META_KEY, 1 );
		} else {
			// Unchecked checkboxes are absent from $_POST entirely, so delete the meta
			// rather than storing a false value. get_term_meta() returns '' for missing keys.
			delete_term_meta( $term_id, self::META_KEY );
		}
		self::clear_cache();
		// Note: on edits, clear_cache() also fires via the edited_post_tag hook — that's fine.
		// The explicit call here covers new tag creation (saved_post_tag fires for adds too).
	}

	/**
	 * Append "(private)" to the tag name in the admin area.
	 *
	 * @param string  $name The term name.
	 * @param WP_Term $term The term object.
	 * @return string
	 */
	public static function append_private_label_to_name( $name, $term ) {
		// Only apply the label in the admin area; on the frontend, tag names should appear normally without the "(private)" suffix.
		if ( ! is_admin() ) {
			return $name;
		}

		// Guard against double-appending — check suffix, not substring, so tag names
		// that happen to contain "(private)" (e.g. "My (private) Notes") aren't skipped.
		$label = self::get_private_label();
		if ( substr( $name, -strlen( $label ) ) === $label ) {
			return $name;
		}

		// Type guard: ensure we have a post_tag WP_Term before calling is_term_private().
		if ( ( ! $term instanceof WP_Term ) || 'post_tag' !== $term->taxonomy ) {
			return $name;
		}

		// All passed. If the term is private, append the label.
		if ( self::is_term_private( $term ) ) {
			$name .= $label;
		}

		return $name;
	}

	/**
	 * Append "(private)" to tag names in REST API responses (Gutenberg editor).
	 *
	 * Note: No context parameter check here. Gutenberg's tag picker fetches tags
	 * with context=view, not context=edit, so a context guard would prevent the
	 * label from appearing in the editor — the opposite of the intended behavior.
	 *
	 * Design note: This mutates the canonical REST name field, which means
	 * public REST consumers (e.g. headless frontends) will see "(private)" in
	 * the tag name. A cleaner approach would be to expose an np_is_private
	 * field and let the client render the label, but that would require
	 * Gutenberg JS changes that seem out of scope for current Newspack usage.
	 *
	 * @param \WP_REST_Response $response The response object.
	 * @param WP_Term           $term     The term object.
	 * @return \WP_REST_Response
	 */
	public static function append_private_label_to_rest( $response, $term ) {
		// rest_prepare_post_tag only fires for post_tag, but confirm the expectation explicitly.
		if ( 'post_tag' !== $term->taxonomy ) {
			return $response;
		}

		// Append the label if the tag is private and it isn't already suffixed. Check suffix
		// (not substring) so tag names containing "(private)" aren't incorrectly skipped.
		$label = self::get_private_label();
		if ( self::is_term_private( $term ) && substr( $response->data['name'], -strlen( $label ) ) !== $label ) {
			$response->data['name'] .= $label;
		}

		return $response;
	}

	/**
	 * Add a "Private" column to the Tags list table.
	 *
	 * @param string[] $columns Existing column headers.
	 * @return string[]
	 */
	public static function add_private_column( $columns ) {
		$columns['np_private'] = __( 'Private', 'newspack-plugin' );
		return $columns;
	}

	/**
	 * Render the Private column cell for each tag row.
	 *
	 * Uses a data attribute so the Quick Edit JS can read the current state
	 * without parsing display text.
	 *
	 * @param string $content     Current column content.
	 * @param string $column_name Column identifier.
	 * @param int    $term_id     The term ID.
	 * @return string
	 */
	public static function render_private_column( $content, $column_name, $term_id ) {
		if ( 'np_private' !== $column_name ) {
			return $content;
		}
		$is_private = (bool) get_term_meta( $term_id, self::META_KEY, true );

		// The ✓ checkmark is decorative; screen-reader-text provides the accessible label.
		if ( $is_private ) {
			$display = sprintf(
				'<span aria-hidden="true">&#10003;</span><span class="screen-reader-text">%s</span>',
				esc_html__( 'Private', 'newspack-plugin' )
			);
		} else {
			$display = sprintf(
				'<span class="screen-reader-text">%s</span>',
				esc_html__( 'Not private', 'newspack-plugin' )
			);
		}

		return sprintf(
			'<span data-np-private="%s">%s</span>',
			esc_attr( $is_private ? '1' : '0' ),
			$display
		);
	}

	/**
	 * Render the private tag checkbox inside the Quick Edit form.
	 *
	 * Fires once per column; only outputs HTML for our custom column.
	 *
	 * @param string $column_name The column being rendered.
	 * @param string $screen      The current screen name ('edit-tags').
	 * @param string $taxonomy    The taxonomy slug.
	 * @return void
	 */
	public static function quick_edit_fields( $column_name, $screen, $taxonomy ) {
		if ( 'post_tag' !== $taxonomy || 'np_private' !== $column_name ) {
			return;
		}
		?>
		<fieldset>
			<div class="inline-edit-col">
				<label>
					<input type="checkbox" name="<?php echo esc_attr( self::META_KEY ); ?>" value="1" />
					<span class="title"><?php esc_html_e( 'Private tag', 'newspack-plugin' ); ?></span>
				</label>
			</div>
		</fieldset>
		<?php
	}

	/**
	 * Save the private tag meta from the Quick Edit form.
	 *
	 * WordPress core verifies the nonce (taxinlineeditnonce) before this hook
	 * fires, so no additional nonce check is required here.
	 *
	 * @param int $term_id The term ID.
	 * @return void
	 */
	public static function save_quick_edit( $term_id ) {
		// Only run during a Quick Edit AJAX request.
		// wp_doing_ajax() is only true if the request is from /wp-admin/admin-ajax.php
		// The inline-save-tax action check narrows it to specifically Quick Edit saves.
		// Anything else (WP-CLI, REST) returns early without touching the meta.
		$action = isset( $_POST['action'] ) ? sanitize_key( $_POST['action'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Action read only to gate execution; nonce verified by WP core (taxinlineeditnonce) below.
		if ( ! wp_doing_ajax() || 'inline-save-tax' !== $action ) {
			return;
		}

		if ( ! empty( $_POST[ self::META_KEY ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified by WP core (taxinlineeditnonce) before this hook fires.
			update_term_meta( $term_id, self::META_KEY, 1 );
		} else {
			// Unchecked checkboxes are absent from $_POST entirely, so delete the meta
			// rather than storing a false value. get_term_meta() returns '' for missing keys.
			delete_term_meta( $term_id, self::META_KEY );
		}
		// Cache is cleared by the clear_cache() callback registered to edited_post_tag
		// after this callback in init(), so it runs after the meta is written.
	}

	/**
	 * Enqueue inline JS to pre-populate the Quick Edit checkbox.
	 *
	 * Wraps the native inlineEditTax.edit() to read the current private state
	 * from the row's data attribute and check the box accordingly.
	 *
	 * @param string $hook The current admin page hook.
	 * @return void
	 */
	public static function enqueue_admin_scripts( $hook ) {
		// Only load on the Tags list table — no other admin page needs this script.
		if ( 'edit-tags.php' !== $hook ) {
			return;
		}

		// Further narrow to post_tag; other taxonomies also use edit-tags.php.
		$screen = get_current_screen();
		if ( ! $screen || 'post_tag' !== $screen->taxonomy ) {
			return;
		}

		// Escape for safe interpolation into the JS string below.
		$meta_key = esc_js( self::META_KEY );
		$script   = "
			(function() {
				// IIFE creates a private scope so our variables don't leak into window.
				// Save the original method so we can call it before adding our behaviour.
				var origEdit = window.inlineEditTax.edit;
				window.inlineEditTax.edit = function( id ) {
					origEdit.apply( this, arguments );
					// WP passes either a click event object or a raw term ID — normalize to int.
					var termId  = parseInt( 'object' === typeof id ? this.getId( id ) : id, 10 );
					var row     = document.getElementById( 'tag-' + termId );
					var editRow = document.getElementById( 'edit-' + termId );
					if ( row && editRow ) {
						var span      = row.querySelector( '.column-np_private span[data-np-private]' );
						// Read private state from the data attribute set by render_private_column().
						var isPrivate = span && '1' === span.getAttribute( 'data-np-private' );
						var checkbox  = editRow.querySelector( 'input[name=\"{$meta_key}\"]' );
						if ( checkbox ) {
							// Pre-populate the checkbox with the tag's current private state.
							checkbox.checked = isPrivate;
						}
					}
				};
			}());
		";

		// Attach to WP core's Quick Edit script handle so our code loads after it.
		wp_add_inline_script( 'inline-edit-tax', $script );
	}

	// -------------------------------------------------------------------------
	// Frontend
	// -------------------------------------------------------------------------

	/**
	 * Remove private tags from post tag link lists on the frontend.
	 *
	 * Rather than parsing the rendered HTML strings, this fetches
	 * the current post's term objects directly, filters out private
	 * tags, and rebuilds the link list cleanly from term data.
	 *
	 * This only runs inside an active WordPress loop (in_the_loop()) to ensure the
	 * post context is reliable. Tag links rendered outside any active loop (e.g.
	 * AJAX handlers) are returned unfiltered to avoid operating on the wrong post.
	 *
	 * Known limitation: custom templates that call get_the_term_list() outside
	 * the main loop will not have private tags filtered. Filtering at the
	 * get_the_terms layer was considered but rejected due to performance concerns
	 * as it fires on every term lookup across all taxonomies on every page load.
	 *
	 * Note: custom attributes added to links by themes or plugins will not be
	 * preserved, as the links are rebuilt from scratch.
	 *
	 * @param array $links Array of tag link HTML strings.
	 * @return array
	 */
	public static function filter_tag_links( $links ) {
		// This filter fires in wp-admin too (e.g. Posts list table Tags column).
		// Private tags should remain visible to editors — only hide on the frontend.
		if ( is_admin() ) {
			return $links;
		}

		// Only filter when inside a proper WordPress loop where the post context
		// is reliable. Returning early here is safe — links are left unfiltered
		// rather than accidentally filtered against the wrong post's terms.
		if ( ! in_the_loop() ) {
			return $links;
		}

		// Fetch the cached private IDs list — used for both the early bail and the filter below.
		$private_ids = self::get_private_tag_ids();
		if ( empty( $private_ids ) ) {
			return $links;
		}

		// get_the_ID() returns false when no post is in context (e.g. during setup routines).
		$post_id = get_the_ID();
		if ( ! $post_id ) {
			return $links;
		}

		// get_the_terms() returns false when the post has no tags and WP_Error on failure — both are non-arrays.
		$terms = get_the_terms( $post_id, 'post_tag' );
		if ( ! is_array( $terms ) || empty( $terms ) ) {
			return $links;
		}

		$visible_terms = array_filter(
			$terms,
			function( $term ) use ( $private_ids ) {
				return ! in_array( $term->term_id, $private_ids, true );
			}
		);

		// All tags on this post are private; return an empty array so the caller renders no tag list.
		if ( empty( $visible_terms ) ) {
			return [];
		}

		$filtered_links = [];
		foreach ( $visible_terms as $term ) {
			// get_term_link() can return WP_Error for orphaned terms; skip rather than output a broken link.
			$link = get_term_link( $term );
			if ( is_wp_error( $link ) ) {
				continue;
			}
			$filtered_links[] = sprintf( '<a href="%s" rel="tag">%s</a>', esc_url( $link ), esc_html( $term->name ) );
		}

		return $filtered_links;
	}

	/**
	 * Remove private tags from the tag cloud widget.
	 *
	 * @param array $tags Array of WP_Term objects.
	 * @return array
	 */
	public static function filter_tag_cloud( $tags ) {
		// No private tags on this site — nothing to filter.
		$private_slugs = self::get_private_tag_slugs();
		if ( empty( $private_slugs ) ) {
			return $tags;
		}

		// Use the cached slugs list instead of get_term_meta() per tag.
		return array_filter(
			$tags,
			function( $tag ) use ( $private_slugs ) {
				// Keep items we don't understand; only filter out WP_Terms that are private.
				return ( ! $tag instanceof WP_Term ) || ! in_array( $tag->slug, $private_slugs, true );
			}
		);
	}

	/**
	 * Return 404 for private tag archive and feed pages.
	 *
	 * @param \WP_Query $query The current query.
	 * @return void
	 */
	public static function disable_tag_archives( $query ) {
		// pre_get_posts fires for every query on the page — secondary loops, widgets, etc.
		// is_main_query() ensures we only act on the primary archive request.
		if ( ! $query->is_main_query() || ! $query->is_tag() ) {
			return;
		}

		// get_queried_object() can return null or a non-WP_Term object; the instanceof
		// check covers both cases and guards the WP_Term type hint in is_term_private().
		$tag = $query->get_queried_object();
		if ( ! $tag instanceof WP_Term || ! self::is_term_private( $tag ) ) {
			return;
		}

		// set_404() updates WP's internal query state; status_header() sends the
		// actual HTTP 404 response code to the browser. Both are needed.
		$query->set_404();
		status_header( 404 );
		// Prevent CDN/Batcache from caching the 404 — if the tag is later unmarked
		// as private, visitors would otherwise continue to receive the cached 404.
		nocache_headers();

		// For feed requests, also deactivate the feed handlers — otherwise the feed XML is still generated.
		if ( $query->is_feed() ) {
			remove_action( 'do_feed_rdf', 'do_feed_rdf' );
			remove_action( 'do_feed_rss', 'do_feed_rss' );
			remove_action( 'do_feed_rss2', 'do_feed_rss2' );
			remove_action( 'do_feed_atom', 'do_feed_atom' );
		}
	}

	/**
	 * Strip private tag CSS classes from the post element.
	 *
	 * @param string[] $classes CSS class names.
	 * @return string[]
	 */
	public static function filter_post_class( $classes ) {
		$private_classes = self::get_private_tag_classes();
		// No private tags on this site — skip the array_diff entirely.
		if ( empty( $private_classes ) ) {
			return $classes;
		}
		// array_diff removes private-tag classes; array_values re-indexes into a sequential array.
		return array_values( array_diff( $classes, $private_classes ) );
	}

	/**
	 * Strip private tag CSS classes from the body element.
	 *
	 * @param string[] $classes CSS class names.
	 * @return string[]
	 */
	public static function filter_body_class( $classes ) {
		$private_classes = self::get_private_tag_classes();
		// No private tags on this site — skip the array_diff entirely.
		if ( empty( $private_classes ) ) {
			return $classes;
		}
		// array_diff removes private-tag classes; array_values re-indexes into a sequential array.
		return array_values( array_diff( $classes, $private_classes ) );
	}

	// -------------------------------------------------------------------------
	// Integrations
	// -------------------------------------------------------------------------

	/**
	 * Strip private tags from GAM ad targeting data.
	 *
	 * Hooks into newspack_ads_ad_targeting to remove private tag slugs
	 * from the 'tag' targeting key before it is passed to Google Ad Manager.
	 *
	 * @param array $targeting The targeting data array.
	 * @param array $ad_unit   The ad unit configuration.
	 * @return array
	 */
	public static function filter_ad_targeting( $targeting, $ad_unit ) {
		if ( empty( $targeting['tag'] ) || ! is_array( $targeting['tag'] ) ) {
			return $targeting;
		}

		$private_slugs = self::get_private_tag_slugs();
		if ( empty( $private_slugs ) ) {
			return $targeting;
		}

		// array_diff removes private slugs; array_values re-indexes the result into a sequential array.
		$targeting['tag'] = array_values( array_diff( $targeting['tag'], $private_slugs ) );

		// Remove the key entirely rather than passing an empty array to GAM.
		if ( empty( $targeting['tag'] ) ) {
			unset( $targeting['tag'] );
		}

		return $targeting;
	}

	/**
	 * Strip private tags from Yoast SEO Article schema keywords.
	 *
	 * Hooks into wpseo_schema_article to remove private tag names from the
	 * 'keywords' key before the JSON-LD structured data is output.
	 *
	 * @param array $data    The Article schema data.
	 * @param mixed $context The Yoast schema context.
	 * @return array
	 */
	public static function filter_yoast_schema_article( $data, $context ) {
		if ( empty( $data['keywords'] ) || ! is_array( $data['keywords'] ) ) {
			return $data;
		}

		$private_names = self::get_private_tag_names();
		if ( empty( $private_names ) ) {
			return $data;
		}

		// array_diff removes private tag names; array_values re-indexes the result into a sequential array.
		$data['keywords'] = array_values( array_diff( $data['keywords'], $private_names ) );

		// Remove the key entirely rather than passing an empty array to Yoast's schema output.
		if ( empty( $data['keywords'] ) ) {
			unset( $data['keywords'] );
		}

		return $data;
	}

	/**
	 * Exclude private tags from the Yoast SEO XML sitemap.
	 *
	 * Hooks into wpseo_exclude_from_sitemap_by_term_ids to add private tag IDs
	 * to the list of terms excluded from the taxonomy sitemap.
	 *
	 * @param int[] $excluded_ids Term IDs already excluded from the sitemap.
	 * @return int[]
	 */
	public static function filter_yoast_sitemap_term_ids( $excluded_ids ) {
		$private_ids = self::get_private_tag_ids();
		if ( empty( $private_ids ) ) {
			return $excluded_ids;
		}

		// Append to existing exclusions, de-duplicating in case any IDs overlap.
		return array_values( array_unique( array_merge( $excluded_ids, $private_ids ) ) );
	}
}

Private_Tags::init();
