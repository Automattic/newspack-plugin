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
		add_action( 'manage_' . Post_Type::get_post_type() . '_posts_columns', [ __CLASS__, 'set_taxonomy_column_name' ] );
	}

	/**
	 * Register the Collection Categories taxonomy.
	 */
	public static function register_taxonomy() {
		[ 'name' => $name, 'singular_name' => $singular_name, 'slug' => $slug ] = Settings::get_custom_names(
			_x( 'Collections', 'collection category taxonomy general name', 'newspack-plugin' ),
			_x( 'Collection', 'collection category taxonomy singular name', 'newspack-plugin' )
		);

		$slug  .= '-category';
		$labels = [
			/* translators: %s: Collection singular name */
			'name'              => sprintf( _x( '%s Categories', 'collection category taxonomy general name', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'singular_name'     => sprintf( _x( '%s Category', 'collection category taxonomy singular name', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'search_items'      => sprintf( _x( 'Search %s Categories', 'label for search collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'popular_items'     => sprintf( _x( 'Popular %s Categories', 'label for popular collection categories', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'all_items'         => sprintf( _x( 'All %s Categories', 'label for all collection categories', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'parent_item'       => sprintf( _x( 'Parent %s Category', 'label for parent collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'parent_item_colon' => sprintf( _x( 'Parent %s Category:', 'label for parent collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'edit_item'         => sprintf( _x( 'Edit %s Category', 'label for edit collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'view_item'         => sprintf( _x( 'View %s Category', 'label for view collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'update_item'       => sprintf( _x( 'Update %s Category', 'label for update collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'add_new_item'      => sprintf( _x( 'Add New %s Category', 'label for add new collection category', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'new_item_name'     => sprintf( _x( 'New %s Category Name', 'label for new collection category name', 'newspack-plugin' ), $singular_name ),
			'menu_name'         => _x( 'Categories', 'label for collection category menu name', 'newspack-plugin' ),
		];

		$args = [
			'labels'            => $labels,
			/* translators: %s: Collection plural name in lowercase */
			'description'       => sprintf( __( 'Taxonomy for categorizing %s.', 'newspack-plugin' ), strtolower( $name ) ),
			'public'            => true,
			'show_admin_column' => true,
			'show_in_rest'      => true,
			'rest_base'         => $slug,
			'rewrite'           => [
				'slug' => $slug,
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
