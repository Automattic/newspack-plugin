<?php
/**
 * Query helper class.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Query helper class for Collections data operations and business logic.
 */
class Query_Helper {

	public const COVER_SECTION   = 'cover';
	public const YEARS_CACHE_KEY = 'available_years_data';
	public const POSTS_CACHE_KEY = 'posts_in_collection_';
	public const CACHE_GROUP     = 'newspack_collections';

	/**
	 * Initialize cache invalidation hooks.
	 */
	public static function init() {
		// Clear cache when collections are saved, deleted, or status changes.
		add_action( 'save_post_' . Post_Type::get_post_type(), [ __CLASS__, 'clear_cache_on_collection_change' ] );
		add_action( 'delete_post', [ __CLASS__, 'clear_cache_on_collection_change' ] );
		add_action( 'wp_trash_post', [ __CLASS__, 'clear_cache_on_collection_change' ] );
		add_action( 'untrash_post', [ __CLASS__, 'clear_cache_on_collection_change' ] );

		// Clear cache when collection categories are created, edited, or deleted.
		add_action( 'create_term', [ __CLASS__, 'clear_cache_on_term_change' ], 10, 3 );
		add_action( 'edit_term', [ __CLASS__, 'clear_cache_on_term_change' ], 10, 3 );
		add_action( 'delete_term', [ __CLASS__, 'clear_cache_on_term_change' ], 10, 3 );

		// Clear cache when term relationships change (posts assigned to collections).
		add_action( 'set_object_terms', [ __CLASS__, 'clear_cache_on_term_relationship_change' ], 10, 4 );
	}

	/**
	 * Clear the available years cache.
	 */
	public static function clear_available_years_cache() {
		wp_cache_delete( self::YEARS_CACHE_KEY, self::CACHE_GROUP );
	}

	/**
	 * Clear cache when a collection post is modified.
	 *
	 * @param int $post_id The post ID.
	 */
	public static function clear_cache_on_collection_change( $post_id ) {
		if ( get_post_type( $post_id ) === Post_Type::get_post_type() ) {
			self::clear_available_years_cache();
		}
	}

	/**
	 * Clear cache when collection taxonomies are modified.
	 *
	 * @param int    $term_id  Term ID.
	 * @param int    $tt_id    Term taxonomy ID.
	 * @param string $taxonomy Taxonomy slug.
	 */
	public static function clear_cache_on_term_change( $term_id, $tt_id, $taxonomy ) {
		if (
			Collection_Category_Taxonomy::get_taxonomy() === $taxonomy ||
			Collection_Taxonomy::get_taxonomy() === $taxonomy
		) {
			self::clear_available_years_cache();
		}
	}

	/**
	 * Clear cache when term relationships change for collections.
	 *
	 * @param int    $object_id Object ID.
	 * @param array  $terms     An array of object terms.
	 * @param array  $tt_ids    An array of term taxonomy IDs.
	 * @param string $taxonomy  Taxonomy slug.
	 */
	public static function clear_cache_on_term_relationship_change( $object_id, $terms, $tt_ids, $taxonomy ) {
		if (
			Collection_Category_Taxonomy::get_taxonomy() === $taxonomy ||
			Collection_Taxonomy::get_taxonomy() === $taxonomy ||
			Post_Type::get_post_type() === get_post_type( $object_id )
		) {
			self::clear_available_years_cache();
		}
	}

	/**
	 * Get available years from published collections for filtering.
	 *
	 * @param string $selected_category Optional category filter.
	 * @return array Array of years.
	 */
	public static function get_available_years( $selected_category = '' ) {
		// Try to get from cache first.
		$cached_data = wp_cache_get( self::YEARS_CACHE_KEY, self::CACHE_GROUP );
		if ( false !== $cached_data && isset( $cached_data[ $selected_category ] ) ) {
			return $cached_data[ $selected_category ];
		}

		global $wpdb;

		// Get all years with their associated categories in one query.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$results = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT DISTINCT YEAR(p.post_date) as year, t.slug as category
				FROM {$wpdb->posts} p
				INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
				INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
				INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
				WHERE tt.taxonomy = %s
				AND p.post_type = %s
				AND p.post_status = 'publish'
				ORDER BY year DESC",
				Collection_Category_Taxonomy::get_taxonomy(),
				Post_Type::get_post_type()
			)
		);

		$years_data = [ '' => [] ]; // Initialize with empty category (all years).

		foreach ( $results as $result ) {
			$year = intval( $result->year );
			if ( $year ) {
				// Add to "all years" (empty category).
				if ( ! in_array( $year, $years_data[''], true ) ) {
					$years_data[''][] = $year;
				}

				// Add to specific category if it exists.
				if ( $result->category ) {
					if ( ! isset( $years_data[ $result->category ] ) ) {
						$years_data[ $result->category ] = [];
					}
					if ( ! in_array( $year, $years_data[ $result->category ], true ) ) {
						$years_data[ $result->category ][] = $year;
					}
				}
			}
		}

		// Sort all arrays in descending order.
		foreach ( $years_data as &$years ) {
			rsort( $years );
		}

		wp_cache_set( self::YEARS_CACHE_KEY, $years_data, self::CACHE_GROUP );

		return $years_data[ $selected_category ] ?? [];
	}

	/**
	 * Get the collection categories.
	 *
	 * @return array Array of collection categories.
	 */
	public static function get_collection_categories() {
		$categories = get_terms(
			[
				'taxonomy'   => Collection_Category_Taxonomy::get_taxonomy(),
				'hide_empty' => true,
				'orderby'    => 'name',
				'order'      => 'ASC',
			]
		);

		/**
		 * Filters the collection categories.
		 *
		 * @param array $categories Array of collection categories.
		 */
		$categories = apply_filters( 'newspack_collections_collection_categories', $categories );

		if ( is_wp_error( $categories ) ) {
			return [];
		}

		return $categories;
	}

	/**
	 * Get processed CTAs from a collection post.
	 *
	 * @param int      $post_id The post ID.
	 * @param int|null $limit Optional limit on the number of CTAs.
	 * @return array Array of processed CTAs with 'url' and 'label' keys.
	 */
	public static function get_ctas( $post_id, $limit = null ) {
		$ctas = Collection_Meta::get( $post_id, 'ctas' );

		if ( ! is_array( $ctas ) || empty( $ctas ) ) {
			return [];
		}

		$cta_count = count( $ctas );

		if ( null !== $limit && $cta_count >= $limit ) {
			$ctas = array_slice( $ctas, 0, $limit );
		} else {
			// If there's room for more CTAs, get the hierarchical CTAs.
			$remaining         = null !== $limit ? $limit - $cta_count : null;
			$hierarchical_ctas = self::get_hierarchical_ctas( $post_id );

			// If there's a limit, slice the hierarchical CTAs to the limit.
			if ( null !== $remaining ) {
				$hierarchical_ctas = array_slice( $hierarchical_ctas, 0, $remaining );
			}

			// Merge the hierarchical CTAs into the existing CTAs.
			$ctas = array_merge( $ctas, $hierarchical_ctas );
		}

		// Process the CTAs.
		return array_values(
			array_filter(
				array_map(
					function ( $cta ) {
						$label = $cta['label'] ?? '';
						$url   = '';
						$class = $cta['class'] ?? '';

						if ( 'attachment' === ( $cta['type'] ?? '' ) && ! empty( $cta['id'] ) ) {
							$url = wp_get_attachment_url( $cta['id'] );
						} elseif ( ! empty( $cta['url'] ) ) {
							$url = $cta['url'];
						}

						if ( $label && $url ) {
							return [
								'url'   => $url,
								'label' => $label,
								'class' => $class,
							];
						}

						return null;
					},
					$ctas
				)
			)
		);
	}

	/**
	 * Get hierarchical CTAs for a collection post.
	 *
	 * @param int $post_id The post ID.
	 * @return array Array of hierarchical CTAs with 'url' and 'label' keys.
	 */
	public static function get_hierarchical_ctas( $post_id ) {
		$cta_keys = [
			'subscribe_link' => __( 'Subscribe', 'newspack' ),
			'order_link'     => __( 'Order', 'newspack' ),
		];

		return array_values(
			array_filter(
				array_map(
					function ( $key ) use ( $post_id, $cta_keys ) {
						// Try to get the CTAs from the collection meta first.
						$url = Collection_Meta::get( $post_id, $key );

						// If not found, try to get the CTAs from the collection category meta.
						if ( empty( $url ) ) {
							$category_terms = get_the_terms( $post_id, Collection_Category_Taxonomy::get_taxonomy() );
							$category_id    = ( $category_terms && ! is_wp_error( $category_terms ) ) ? $category_terms[0]->term_id : null;
							if ( $category_id ) {
								$url = Collection_Category_Taxonomy::get( $category_id, $key );
							}
						}

						// If not found, try to get the CTAs from the global settings.
						if ( empty( $url ) ) {
							$url = Settings::get_setting( $key );
						}

						// If nothing is found, return null.
						return ! empty( $url ) ? [
							'label' => $cta_keys[ $key ],
							'type'  => 'link',
							'url'   => $url,
							'class' => 'cta--' . $key,
						] : null;
					},
					array_keys( $cta_keys )
				)
			)
		);
	}

	/**
	 * Get posts in a collection organized by sections.
	 *
	 * Sorting logic:
	 * 1. Posts are grouped by their collection section taxonomy
	 * 2. Posts without a section are grouped under 'no-section'
	 * 3. Sections are sorted in this order:
	 *    - 'cover'(posts marked as cover stories in the post meta)
	 *    - 'no-section' (posts without sections)
	 *    - Sections without `newspack_collection_section_order` meta (alphabetically)
	 *    - Sections with `newspack_collection_section_order meta` (by order value)
	 * 4. Within each section, posts are sorted in this order:
	 *    - Posts without `newspack_collection_post_order` meta (newest to oldest)
	 *    - Posts with `newspack_collection_post_order` meta (by ascending order value)
	 *
	 * @param int $collection_id Collection post ID.
	 * @return array Array of post IDs organized by section slug.
	 */
	public static function get_collection_posts( $collection_id ) {
		// Try to get from cache first.
		$cache_key   = self::POSTS_CACHE_KEY . $collection_id;
		$cached_data = wp_cache_get( $cache_key, self::CACHE_GROUP );

		if ( false !== $cached_data ) {
			return $cached_data;
		}

		// Get the linked collection term.
		$linked_term_id = get_post_meta( $collection_id, Sync::LINKED_TERM_META_KEY, true );
		if ( ! $linked_term_id ) {
			return [];
		}

		$term = get_term( $linked_term_id, Collection_Taxonomy::get_taxonomy() );
		if ( ! $term || is_wp_error( $term ) ) {
			return [];
		}

		// Get posts in this collection.
		$posts = get_posts(
			[
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'tax_query'      => [ // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					[
						'taxonomy' => Collection_Taxonomy::get_taxonomy(),
						'field'    => 'term_id',
						'terms'    => $linked_term_id,
					],
				],
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);

		if ( empty( $posts ) ) {
			return [];
		}

		// Organize posts by section.
		$sections = [];

		foreach ( $posts as $post ) {
			// Add cover stories to a special 'cover' section.
			if ( Post_Meta::get( $post->ID, 'is_cover_story' ) ) {
				$sections[ self::COVER_SECTION ][] = $post;
				continue;
			}

			$post_sections = get_the_terms( $post->ID, Collection_Section_Taxonomy::get_taxonomy() );

			// Regular posts are organized by their respective sections.
			if ( $post_sections && ! is_wp_error( $post_sections ) ) {
				foreach ( $post_sections as $section ) {
					$sections[ $section->slug ][] = $post;
				}
			} else {
				// Posts without sections are grouped under 'no-section'.
				$sections[''][] = $post;
			}
		}

		// Sort posts within each section by their order meta.
		foreach ( $sections as $section_slug => $section_posts ) {
			usort(
				$section_posts,
				function ( $a, $b ) {
					$order_a = Post_Meta::get( $a->ID, 'post_order' );
					$order_b = Post_Meta::get( $b->ID, 'post_order' );

					// If neither post has order meta, sort by date (newest to oldest).
					if ( empty( $order_a ) && empty( $order_b ) ) {
						return strtotime( $b->post_date ) - strtotime( $a->post_date );
					}

					// If no order meta is set for one post, it should be sorted before the other.
					if ( empty( $order_a ) ) {
						return -1;
					}
					if ( empty( $order_b ) ) {
						return 1;
					}

					// If both posts have order meta, sort by the order value (lower values first).
					return intval( $order_a ) - intval( $order_b );
				}
			);

			$sections[ $section_slug ] = $section_posts;
		}

		$section_order_cache = [];

		// Sort sections: cover stories first, then post with no section, then by order meta.
		uksort(
			$sections,
			function ( $a, $b ) use ( &$section_order_cache ) {
				// Cover stories first.
				if ( self::COVER_SECTION === $a ) {
					return -1;
				}
				if ( self::COVER_SECTION === $b ) {
					return 1;
				}

				// Posts with no section.
				if ( '' === $a ) {
					return -1;
				}
				if ( '' === $b ) {
					return 1;
				}

				// Build the section order cache.
				foreach ( [ $a, $b ] as $slug ) {
					if ( ! isset( $section_order_cache[ $slug ] ) ) {
						$term                         = get_term_by( 'slug', $slug, Collection_Section_Taxonomy::get_taxonomy() );
						$section_order_cache[ $slug ] = $term ? Collection_Section_Taxonomy::get( $term->term_id, 'section_order' ) : '';
					}
				}

				$order_a = $section_order_cache[ $a ];
				$order_b = $section_order_cache[ $b ];

				// If both sections have no order meta, sort alphabetically.
				if ( '' === $order_a && '' === $order_b ) {
					return strcmp( $a, $b );
				}

				// If one section has no order meta, it should be sorted before the other.
				if ( '' === $order_a ) {
					return -1;
				}
				if ( '' === $order_b ) {
					return 1;
				}

				// If both sections have order meta, sort by the order value (lower values first).
				return intval( $order_a ) - intval( $order_b );
			}
		);

		// Cache post IDs.
		$post_ids_by_section = [];

		foreach ( $sections as $section_slug => $section_posts ) {
			$post_ids_by_section[ $section_slug ] = wp_list_pluck( $section_posts, 'ID' );
		}

		wp_cache_set( $cache_key, $post_ids_by_section, self::CACHE_GROUP );

		return $post_ids_by_section;
	}

	/**
	 * Get the section name.
	 *
	 * @param string $section_slug The section slug.
	 * @return string The section name.
	 */
	public static function get_section_name( $section_slug ) {
		if ( ! empty( $section_slug ) ) {
			$section_term = get_term_by( 'slug', $section_slug, Collection_Section_Taxonomy::get_taxonomy() );
			if ( $section_term && ! is_wp_error( $section_term ) ) {
				return $section_term->name;
			}
		}

		// Fallback to the slug if the term is not found.
		return $section_slug;
	}

	/**
	 * Get recent collections, excluding specified IDs.
	 *
	 * Query more posts than needed to account for exclusions as this is more efficient than using post__not_in.
	 *
	 * @param array $exclude Array of collection IDs to exclude.
	 * @param int   $limit Number of collections to return.
	 * @return array Array of collection posts.
	 */
	public static function get_recent( $exclude = [], $limit = 6 ) {
		$collections = get_posts(
			[
				'post_type'      => Post_Type::get_post_type(),
				'post_status'    => 'publish',
				'posts_per_page' => $limit + count( $exclude ),
				'orderby'        => 'date',
				'order'          => 'DESC',
			]
		);

		if ( empty( $collections ) ) {
			return [];
		}

		$filtered = array_filter(
			$collections,
			function ( $post ) use ( $exclude ) {
				return ! in_array( $post->ID, $exclude, true );
			}
		);

		return array_slice( $filtered, 0, $limit );
	}
}
