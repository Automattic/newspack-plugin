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
	 * Taxonomy for Collection Categories.
	 *
	 * @var string
	 */
	private const TAXONOMY = 'newspack_collection_category';

	/**
	 * Get the taxonomy for Collection Categories.
	 *
	 * @return string The taxonomy name.
	 */
	public static function get_taxonomy() {
		return self::TAXONOMY;
	}

	/**
	 * Initialize the taxonomy handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_taxonomy' ] );
		add_action( 'newspack_collections_before_flush_rewrites', [ __CLASS__, 'register_taxonomy' ] );
		add_action( 'manage_' . Post_Type::get_post_type() . '_posts_columns', [ __CLASS__, 'set_taxonomy_column_name' ] );
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
}
