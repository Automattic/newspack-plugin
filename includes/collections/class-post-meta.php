<?php
/**
 * Post Meta handler.
 *
 * @package Newspack
 */

namespace Newspack\Collections;

defined( 'ABSPATH' ) || exit;

/**
 * Handles the post meta fields and related operations.
 */
class Post_Meta {

	/**
	 * Meta key for storing the order in collection.
	 *
	 * @var string
	 */
	public const ORDER_META_KEY = 'newspack_order_in_collection';

	/**
	 * Initialize the meta fields handler.
	 */
	public static function init() {
		add_action( 'init', [ __CLASS__, 'register_meta' ] );
		add_action( 'current_screen', [ __CLASS__, 'output_post_meta_data_for_admin_scripts' ] );
	}

	/**
	 * Register meta fields for the post post type.
	 */
	public static function register_meta() {
		register_post_meta(
			'post',
			self::ORDER_META_KEY,
			[
				'type'              => 'integer',
				/* translators: %s: Collection plural name in lowercase */
				'description'       => sprintf( __( 'Order of the post within %s.', 'newspack-plugin' ), strtolower( Settings::get_custom_names()['name'] ) ),
				'single'            => true,
				'sanitize_callback' => 'absint',
				'show_in_rest'      => true,
				'auth_callback'     => [ __CLASS__, 'auth_callback' ],
			]
		);
	}

	/**
	 * Auth callback for meta fields.
	 *
	 * @return bool Whether the user can edit posts.
	 */
	public static function auth_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Output post meta data for admin scripts.
	 *
	 * @param WP_Screen $current_screen The current screen object.
	 */
	public static function output_post_meta_data_for_admin_scripts( $current_screen ) {
		if (
			'post' === $current_screen->base &&
			'post' === $current_screen->post_type
		) {
			[ 'name' => $name, 'singular_name' => $singular_name ] = Settings::get_custom_names();

			Enqueuer::add_data(
				'postMeta',
				[
					'orderMetaKey'   => self::ORDER_META_KEY,
					'panelTitle'     => sprintf(
						/* translators: %s: Collection singular name */
						_x( '%s Settings', 'title for collection settings panel', 'newspack-plugin' ),
						$singular_name
					),
					'orderFieldHelp' => sprintf(
						/* translators: %s: Collection singular name */
						_x( 'Set the order of this post within %s.', 'help text for collection order field', 'newspack-plugin' ),
						strtolower( $name )
					),
				]
			);
		}
	}
}
