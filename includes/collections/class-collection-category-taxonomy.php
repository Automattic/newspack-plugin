<?php
/**
 * Collection Categories Taxonomy handler.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

use Newspack\Collections\Post_Type;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the Collection Categories taxonomy and related operations.
 */
class Collection_Category_Taxonomy {

	/**
	 * Taxonomy and term meta prefix.
	 *
	 * @var string
	 */
	public const PREFIX = 'newspack_collection_';

	/**
	 * Get the taxonomy for Collection Categories.
	 *
	 * @return string The taxonomy name.
	 */
	public static function get_taxonomy() {
		return self::PREFIX . 'category';
	}

	/**
	 * Get meta keys.
	 *
	 * @return array {
	 *     Array of term meta definitions.
	 *
	 *     @type string $type              The type of data associated with this meta key.
	 *     @type string $label             A human-readable label of the data attached to this meta key.
	 *     @type string $description       A description of the data attached to this meta key.
	 *     @type bool   $single            Whether the meta key has one value per object, or an array of values per object.
	 *     @type string $sanitize_callback A function or method to call when sanitizing `$meta_key` data.
	 *     @type array  $show_in_rest      Show in REST configuration.
	 * }
	 */
	public static function get_metas() {
		return [
			'subscribe_link' => [
				'type'              => 'string',
				'label'             => __( 'Subscription URL', 'newspack-plugin' ),
				'description'       => __( 'Override the global subscription link for this category.', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => [
					'schema' => [
						'format' => 'uri',
					],
				],
			],
			'order_link'     => [
				'type'              => 'string',
				'label'             => __( 'Order URL', 'newspack-plugin' ),
				'description'       => __( 'Override the global order link for this category.', 'newspack-plugin' ),
				'single'            => true,
				'sanitize_callback' => 'esc_url_raw',
				'show_in_rest'      => [
					'schema' => [
						'format' => 'uri',
					],
				],
			],
		];
	}

	/**
	 * Initialize the taxonomy handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_taxonomy' ] );
		add_action( 'init', [ __CLASS__, 'register_term_meta' ] );
		add_action( 'newspack_collections_before_flush_rewrites', [ __CLASS__, 'register_taxonomy' ] );
		add_action( 'manage_' . Post_Type::get_post_type() . '_posts_columns', [ __CLASS__, 'set_taxonomy_column_name' ] );

		// Term meta field handling.
		add_action( self::get_taxonomy() . '_add_form_fields', [ __CLASS__, 'add_term_meta_fields' ] );
		add_action( self::get_taxonomy() . '_edit_form_fields', [ __CLASS__, 'edit_term_meta_fields' ] );
		add_action( 'created_' . self::get_taxonomy(), [ __CLASS__, 'save_term_meta' ] );
		add_action( 'edited_' . self::get_taxonomy(), [ __CLASS__, 'save_term_meta' ] );
	}

	/**
	 * Register the Collection Categories taxonomy.
	 */
	public static function register_taxonomy() {
		$labels = [
			'name'              => _x( 'Collection Categories', 'collection category taxonomy general name', 'newspack-plugin' ),
			'singular_name'     => _x( 'Collection Category', 'collection category taxonomy singular name', 'newspack-plugin' ),
			'search_items'      => __( 'Search Collection Categories', 'newspack-plugin' ),
			'popular_items'     => __( 'Popular Collection Categories', 'newspack-plugin' ),
			'all_items'         => __( 'All Collection Categories', 'newspack-plugin' ),
			'parent_item'       => __( 'Parent Collection Category', 'newspack-plugin' ),
			'parent_item_colon' => __( 'Parent Collection Category:', 'newspack-plugin' ),
			'edit_item'         => __( 'Edit Collection Category', 'newspack-plugin' ),
			'view_item'         => __( 'View Collection Category', 'newspack-plugin' ),
			'update_item'       => __( 'Update Collection Category', 'newspack-plugin' ),
			'add_new_item'      => __( 'Add New Collection Category', 'newspack-plugin' ),
			'new_item_name'     => __( 'New Collection Category Name', 'newspack-plugin' ),
			'menu_name'         => __( 'Categories', 'newspack-plugin' ),
		];

		$args = [
			'labels'            => $labels,
			'description'       => __( 'Taxonomy for categorizing collections.', 'newspack-plugin' ),
			'public'            => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rewrite'           => [
				'slug' => Settings::get_setting( 'custom_naming_enabled', false ) ? Settings::get_setting( 'custom_slug', 'collection' ) . '-category' : 'collection-category',
			],
		];

		register_taxonomy( self::get_taxonomy(), [ Post_Type::get_post_type() ], $args );
	}

	/**
	 * Set the taxonomy column name in the admin post list table.
	 * Used to simplify the column name to "Categories" instead of "Collection Categories".
	 *
	 * @param array $posts_columns An associative array of column headings.
	 * @return array The modified columns array.
	 */
	public static function set_taxonomy_column_name( $posts_columns ) {
		if ( isset( $posts_columns[ 'taxonomy-' . self::get_taxonomy() ] ) ) {
			$posts_columns[ 'taxonomy-' . self::get_taxonomy() ] = _x( 'Categories', 'label for collection category column name', 'newspack-plugin' );
		}

		return $posts_columns;
	}

	/**
	 * Add meta columns to the taxonomy edit screen.
	 *
	 * @param array $columns An associative array of column headings.
	 * @return array The modified columns array.
	 */
	public static function add_meta_columns( $columns ) {
		foreach ( self::get_metas() as $key => $meta ) {
			$columns[ self::PREFIX . $key ] = $meta['label'];
		}
		return $columns;
	}

	/**
	 * Register meta fields for the collection category taxonomy.
	 */
	public static function register_term_meta() {
		foreach ( self::get_metas() as $key => $meta ) {
			register_term_meta(
				self::get_taxonomy(),
				self::PREFIX . $key,
				array_merge(
					$meta,
					[
						'auth_callback' => [ __CLASS__, 'auth_callback' ],
					]
				)
			);
		}
	}

	/**
	 * Add term meta fields to the add term form.
	 */
	public static function add_term_meta_fields() {
		foreach ( self::get_metas() as $key => $meta ) {
			$meta_key = self::PREFIX . $key;
			?>
			<div class="form-field">
				<label for="<?php echo esc_attr( $meta_key ); ?>"><?php echo esc_html( $meta['label'] ); ?></label>
				<input type="url" name="<?php echo esc_attr( $meta_key ); ?>" id="<?php echo esc_attr( $meta_key ); ?>" value="" />
				<p class="description"><?php echo esc_html( $meta['description'] ); ?></p>
			</div>
			<?php
		}
	}

	/**
	 * Add term meta fields to the edit term form.
	 *
	 * @param WP_Term $term Current taxonomy term object.
	 */
	public static function edit_term_meta_fields( $term ) {
		foreach ( self::get_metas() as $key => $meta ) {
			$meta_key = self::PREFIX . $key;
			$value    = get_term_meta( $term->term_id, $meta_key, true );
			?>
			<tr class="form-field">
				<th scope="row">
					<label for="<?php echo esc_attr( $meta_key ); ?>"><?php echo esc_html( $meta['label'] ); ?></label>
				</th>
				<td>
					<input type="url" name="<?php echo esc_attr( $meta_key ); ?>" id="<?php echo esc_attr( $meta_key ); ?>" value="<?php echo esc_attr( $value ); ?>" />
					<p class="description"><?php echo esc_html( $meta['description'] ); ?></p>
				</td>
			</tr>
			<?php
		}
	}

	/**
	 * Save the term meta when term is created or updated.
	 *
	 * @param int $term_id Term ID.
	 */
	public static function save_term_meta( $term_id ) {
		// phpcs:disable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		foreach ( self::get_metas() as $key => $meta ) {
			$meta_key = self::PREFIX . $key;
			if ( isset( $_POST[ $meta_key ] ) ) {
				$value = $meta['sanitize_callback']( $_POST[ $meta_key ] );
				if ( $value ) {
					update_term_meta( $term_id, $meta_key, $value );
				} else {
					delete_term_meta( $term_id, $meta_key );
				}
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	}

	/**
	 * Auth callback for term meta fields.
	 *
	 * @return bool Whether the user can manage categories.
	 */
	public static function auth_callback() {
		return current_user_can( 'manage_categories' );
	}
}
