<?php
/**
 * Collections Post Type handler.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

use Newspack\Collections\Traits\Hook_Management_Trait;

defined( 'ABSPATH' ) || exit;

require_once __DIR__ . '/class-collection-meta.php';

/**
 * Handles the Collections custom post type and related operations.
 */
class Post_Type {
	use Hook_Management_Trait;

	/**
	 * Post type for Collections.
	 *
	 * @var string
	 */
	private const POST_TYPE = 'newspack_collection';

	/**
	 * Get the hooks for collection custom post type operations.
	 * Same structure as the add_action() parameters.
	 *
	 * @return array {
	 *     Array of hooks with the same structure as the add_action() parameters.
	 *
	 *     @type string   $hook
	 *     @type callable $callback
	 *     @type int      $priority
	 *     @type int      $accepted_args
	 * }
	 */
	protected static function get_hooks() {
		return [
			[ 'save_post_' . self::get_post_type(), [ Sync::class, 'handle_post_save' ], 10, 3 ],
			[ 'before_delete_post', [ Sync::class, 'handle_post_deleted' ] ],
			[ 'wp_trash_post', [ Sync::class, 'handle_post_trashed' ] ],
			[ 'untrashed_post', [ Sync::class, 'handle_post_untrashed' ] ],
		];
	}

	/**
	 * Get the post type for the Collections.
	 *
	 * @return string The post type.
	 */
	public static function get_post_type() {
		return self::POST_TYPE;
	}

	/**
	 * Initialize the post type handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'admin_enqueue_scripts', [ __CLASS__, 'output_collection_meta_data_for_admin_scripts' ] );
		self::register_hooks();
		Collection_Meta::init();
	}

	/**
	 * Register the Collections custom post type.
	 */
	public static function register_post_type() {
		$labels = [
			'name'               => _x( 'Collections', 'post type general name', 'newspack-plugin' ),
			'singular_name'      => _x( 'Collection', 'post type singular name', 'newspack-plugin' ),
			'menu_name'          => _x( 'Collections', 'admin menu', 'newspack-plugin' ),
			'name_admin_bar'     => _x( 'Collection', 'add new on admin bar', 'newspack-plugin' ),
			'add_new'            => _x( 'Add New', 'collection', 'newspack-plugin' ),
			'add_new_item'       => __( 'Add New Collection', 'newspack-plugin' ),
			'new_item'           => __( 'New Collection', 'newspack-plugin' ),
			'edit_item'          => __( 'Edit Collection', 'newspack-plugin' ),
			'view_item'          => __( 'View Collection', 'newspack-plugin' ),
			'all_items'          => __( 'All Collections', 'newspack-plugin' ),
			'search_items'       => __( 'Search Collections', 'newspack-plugin' ),
			'parent_item_colon'  => __( 'Parent Collections:', 'newspack-plugin' ),
			'not_found'          => __( 'No collections found.', 'newspack-plugin' ),
			'not_found_in_trash' => __( 'No collections found in Trash.', 'newspack-plugin' ),
			'item_published'     => __( 'Collection published', 'newspack-plugin' ),
			'item_updated'       => __( 'Collection updated', 'newspack-plugin' ),
		];

		$args = [
			'label'        => __( 'Collection', 'newspack-plugin' ),
			'labels'       => $labels,
			'description'  => __( 'Collections of content for custom classification.', 'newspack-plugin' ),
			'public'       => true,
			'show_in_rest' => true,
			'menu_icon'    => 'dashicons-portfolio',
			'supports'     => [ 'title', 'editor', 'thumbnail', 'custom-fields' ],
			'has_archive'  => true,
		];

		register_post_type( self::get_post_type(), $args );
	}

	/**
	 * Output collection meta data for admin scripts.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public static function output_collection_meta_data_for_admin_scripts( $hook_suffix ) {
		if (
			'post.php' === $hook_suffix &&
			self::get_post_type() === get_current_screen()->post_type
		) {
			Collections_Data::add_data(
				'collectionPostType',
				[
					'postType' => self::get_post_type(),
					'postMeta' => Collection_Meta::get_frontend_meta_definitions(),
				]
			);
		}
	}
}
