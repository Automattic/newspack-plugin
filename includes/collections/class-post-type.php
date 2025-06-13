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
	 * Order column name (using default WP menu order column).
	 *
	 * @var string
	 */
	private const ORDER_COLUMN_NAME = 'menu_order';

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
	 * Get the translated column heading.
	 *
	 * @return string The translated column heading.
	 */
	public static function get_order_column_heading() {
		return __( 'Order', 'newspack-plugin' );
	}

	/**
	 * Initialize the post type handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_post_type' ] );
		add_action( 'current_screen', [ __CLASS__, 'output_collection_meta_data_for_admin_scripts' ] );
		add_action( 'manage_' . self::get_post_type() . '_posts_columns', [ __CLASS__, 'add_order_column' ] );
		add_action( 'manage_' . self::get_post_type() . '_posts_custom_column', [ __CLASS__, 'display_order_column' ], 10, 2 );
		add_filter( 'manage_edit-' . self::get_post_type() . '_sortable_columns', [ __CLASS__, 'make_order_column_sortable' ] );
		self::register_hooks();
		Collection_Meta::init();
	}

	/**
	 * Register the Collections custom post type.
	 */
	public static function register_post_type() {
		[ 'name' => $name, 'singular_name' => $singular_name, 'slug' => $slug ] = Settings::get_custom_names(
			_x( 'Collections', 'collection post type general name', 'newspack-plugin' ),
			_x( 'Collection', 'collection post type singular name', 'newspack-plugin' )
		);

		$labels = [
			'name'               => $name,
			'singular_name'      => $singular_name,
			'add_new'            => _x( 'Add New', 'label for add new collection', 'newspack-plugin' ),
			/* translators: %s: Collection singular name */
			'add_new_item'       => sprintf( _x( 'Add New %s', 'label for add new collection', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'edit_item'          => sprintf( _x( 'Edit %s', 'label for edit collection', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'new_item'           => sprintf( _x( 'New %s', 'label for new collection', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'view_item'          => sprintf( _x( 'View %s', 'label for view collection', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection plural name */
			'view_items'         => sprintf( _x( 'View %s', 'label for view collections', 'newspack-plugin' ), $name ),
			/* translators: %s: Collection plural name */
			'search_items'       => sprintf( _x( 'Search %s', 'label for search collections', 'newspack-plugin' ), $name ),
			/* translators: %s: Collection plural name in lowercase */
			'not_found'          => sprintf( _x( 'No %s found.', 'label for no collections found', 'newspack-plugin' ), strtolower( $name ) ),
			/* translators: %s: Collection plural name in lowercase */
			'not_found_in_trash' => sprintf( _x( 'No %s found in Trash.', 'label for no collections found in trash', 'newspack-plugin' ), strtolower( $name ) ),
			/* translators: %s: Collection plural name */
			'all_items'          => sprintf( _x( 'All %s', 'label for all collections', 'newspack-plugin' ), $name ),
			/* translators: %s: Collection singular name */
			'item_published'     => sprintf( _x( '%s published', 'label for published collection', 'newspack-plugin' ), $singular_name ),
			/* translators: %s: Collection singular name */
			'item_updated'       => sprintf( _x( '%s updated', 'label for updated collection', 'newspack-plugin' ), $singular_name ),
		];

		$args = [
			'label'        => $singular_name,
			'labels'       => $labels,
			'description'  => __( 'Grouped content for custom classification.', 'newspack-plugin' ),
			'public'       => true,
			'show_in_rest' => true,
			'rest_base'    => $slug,
			'rewrite'      => [
				'slug' => $slug,
			],
			'menu_icon'    => 'dashicons-portfolio',
			'supports'     => [ 'title', 'editor', 'thumbnail', 'custom-fields', 'page-attributes' ],
			'has_archive'  => true,
		];

		register_post_type( self::get_post_type(), $args );
	}

	/**
	 * Add menu order column to the admin list view.
	 *
	 * @param array $columns The existing columns.
	 * @return array Modified columns array.
	 */
	public static function add_order_column( $columns ) {
		$columns[ self::ORDER_COLUMN_NAME ] = self::get_order_column_heading();
		return $columns;
	}

	/**
	 * Display the menu order value in the custom column.
	 *
	 * @param string $column_name The name of the column.
	 * @param int    $post_id     The post ID.
	 */
	public static function display_order_column( $column_name, $post_id ) {
		if ( self::ORDER_COLUMN_NAME === $column_name ) {
			echo esc_html( get_post_field( self::ORDER_COLUMN_NAME, $post_id ) );
		}
	}

	/**
	 * Make the menu order column sortable.
	 *
	 * @param array $columns The sortable columns.
	 * @return array Modified sortable columns array.
	 */
	public static function make_order_column_sortable( $columns ) {
		$columns[ self::ORDER_COLUMN_NAME ] = self::ORDER_COLUMN_NAME;
		return $columns;
	}

	/**
	 * Output collection meta data for admin scripts.
	 *
	 * @param WP_Screen $current_screen The current screen object.
	 */
	public static function output_collection_meta_data_for_admin_scripts( $current_screen ) {
		if (
			'post' === $current_screen->base &&
			self::get_post_type() === $current_screen->post_type
		) {
			[ 'singular_name' => $singular_name ] = Settings::get_custom_names();

			Enqueuer::add_data(
				'collectionPostType',
				[
					'postType'            => self::get_post_type(),
					'postMetaDefinitions' => Collection_Meta::get_frontend_meta_definitions(),
					'panelTitle'          => sprintf(
						/* translators: %s: Collection singular name */
						_x( '%s Details', 'title for collection details panel', 'newspack-plugin' ),
						$singular_name
					),
				]
			);
		}
	}
}
