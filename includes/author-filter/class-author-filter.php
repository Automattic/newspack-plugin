<?php
/**
 * Adds a filter by author to the Posts page in the Admin dashboard.
 *
 * @package Newspack
 */

/**
 * Author Filter class
 */
class Author_Filter {

	/**
	 * Flag to make sure hooks are initialized only once
	 *
	 * @var boolean
	 */
	private static $initiated = false;

	/**
	 * Initializes the hook
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initiated ) {
			add_action( 'restrict_manage_posts', array( __CLASS__, 'author_filters_admin' ) );
			self::$initiated = true;
		}
	}

	/**
	 * Echoes a User Dropdown to be added to the Filters
	 *
	 * @param string $post_type The post type the action is acting on.
	 * @return void
	 */
	public static function author_filters_admin( $post_type ) {

		$excluded_post_types = [ 'attachment', 'revision', 'nav_menu_item' ];

		if ( in_array( $post_type, $excluded_post_types, true ) ) {
			return;
		}

		$type_object = get_post_type_object( $post_type );

		if ( ! $type_object instanceof WP_Post_Type ) {
			return;
		}

		$capability = $type_object->cap->edit_posts;

		$args = array(
			'show_option_all'  => __( 'All Users', 'newspack' ),
			'orderby'          => 'display_name',
			'order'            => 'ASC',
			'name'             => 'author',
			'capability'       => [ $capability ], // only users who can edit posts of this post type.
			'include_selected' => true,
			'exclude'          => [ get_current_user_id() ], // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_exclude
			'selected'         => ! empty( $_GET['author'] ) ? intval( $_GET['author'] ) : 0, // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		);

		wp_dropdown_users( $args );

	}

}

Author_Filter::init();
