<?php
/**
 * Collection Sections Taxonomy handler.
 *
 * @package Newspack\Collections
 */

namespace Newspack\Collections;

use Newspack\Collections\Post_Type;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the Collection Sections taxonomy and related operations.
 */
class Collection_Section_Taxonomy {
	/**
	 * Taxonomy for Collection Sections.
	 *
	 * @var string
	 */
	private const TAXONOMY = 'collection_section';

	/**
	 * Get the taxonomy for Collection Sections.
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
		add_action( 'admin_menu', [ __CLASS__, 'add_to_collections_menu' ] );
		add_filter( 'parent_file', [ __CLASS__, 'set_parent_menu' ] );
		add_action( 'manage_post_posts_columns', [ __CLASS__, 'set_taxonomy_column_name' ] );
	}

	/**
	 * Register the Collection Sections taxonomy.
	 */
	public static function register_taxonomy() {
		$labels = array(
			'name'              => _x( 'Collection Sections', 'taxonomy general name', 'newspack-plugin' ),
			'singular_name'     => _x( 'Collection Section', 'taxonomy singular name', 'newspack-plugin' ),
			'search_items'      => __( 'Search Collection Sections', 'newspack-plugin' ),
			'all_items'         => __( 'All Collection Sections', 'newspack-plugin' ),
			'parent_item'       => __( 'Parent Collection Section', 'newspack-plugin' ),
			'parent_item_colon' => __( 'Parent Collection Section:', 'newspack-plugin' ),
			'edit_item'         => __( 'Edit Collection Section', 'newspack-plugin' ),
			'update_item'       => __( 'Update Collection Section', 'newspack-plugin' ),
			'add_new_item'      => __( 'Add New Collection Section', 'newspack-plugin' ),
			'new_item_name'     => __( 'New Collection Section Name', 'newspack-plugin' ),
			'menu_name'         => __( 'Sections', 'newspack-plugin' ),
		);

		$args = array(
			'labels'            => $labels,
			'description'       => __( 'Taxonomy for organizing posts into sections within collections.', 'newspack-plugin' ),
			'public'            => true,
			'show_in_menu'      => false, // Hide in the posts menu (but show in the collections menu).
			'show_admin_column' => true,
			'show_in_rest'      => true,
		);

		register_taxonomy( self::get_taxonomy(), array( 'post' ), $args );
	}

	/**
	 * Add Collection Sections to the Collections admin menu.
	 */
	public static function add_to_collections_menu() {
		add_submenu_page(
			'edit.php?post_type=' . Post_Type::get_post_type(), // Parent menu slug.
			__( 'Collection Sections', 'newspack-plugin' ), // Page title.
			__( 'Sections', 'newspack-plugin' ), // Menu title.
			'manage_categories', // Capability.
			'edit-tags.php?taxonomy=' . self::get_taxonomy() // Menu slug.
		);
	}

	/**
	 * Set the Collections as the parent menu for consistency.
	 *
	 * @param string $parent_file The parent file.
	 * @return string The modified parent file.
	 */
	public static function set_parent_menu( $parent_file ) {
		global $current_screen;

		if ( $current_screen && $current_screen->taxonomy === self::get_taxonomy() ) {
			return $parent_file . '?post_type=' . Post_Type::get_post_type();
		}

		return $parent_file;
	}

	/**
	 * Set the taxonomy column name in the admin post list table.
	 * Used to simplify the column name to "Sections" instead of "Collection Sections".
	 *
	 * @param array $posts_columns An associative array of column headings.
	 * @return array The modified columns array.
	 */
	public static function set_taxonomy_column_name( $posts_columns ) {
		if ( isset( $posts_columns[ 'taxonomy-' . self::get_taxonomy() ] ) ) {
			$posts_columns[ 'taxonomy-' . self::get_taxonomy() ] = __( 'Sections', 'newspack-plugin' );
		}

		return $posts_columns;
	}
}
