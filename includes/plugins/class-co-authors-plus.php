<?php
/**
 * Co-Authors Plus integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Main class.
 */
class Co_Authors_Plus {
	/**
	 * The guest author role slug.
	 *
	 * @var string
	 */
	const ROLE = 'guest_author';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( defined( 'COAUTHORS_PLUS_VERSION' ) ) {
			\add_filter( 'coauthors_guest_authors_enabled', '__return_false' );
			\add_action( 'admin_init', [ __CLASS__, 'add_role' ] );
			\add_filter( 'user_profile_update_errors', [ __CLASS__, 'user_profile_update_errors' ], 10, 3 );
			\add_action( 'admin_footer', [ __CLASS__, 'admin_footer' ] );
			\add_action( 'admin_print_scripts-user-new.php', [ __CLASS__, 'admin_footer' ] );
			\add_action( 'admin_print_scripts-user-edit.php', [ __CLASS__, 'admin_footer' ] );
			\add_filter( 'wp_authenticate_user', [ __CLASS__, 'wp_authenticate_user' ], 10, 2 );
			\add_filter( 'show_password_fields', [ __CLASS__, 'disable_feature' ], 10, 2 );
			\add_filter( 'wp_is_application_passwords_available_for_user', [ __CLASS__, 'disable_feature' ], 10, 2 );
			\add_filter( 'allow_password_reset', [ __CLASS__, 'disable_feature' ], 10, 2 );
			\add_filter( 'woocommerce_current_user_can_edit_customer_meta_fields', [ __CLASS__, 'disable_feature' ], 10, 2 );
		}
	}

	/**
	 * Adds the guest author role.
	 *
	 * @return void
	 */
	public static function add_role() {
		if ( ! \get_option( 'guest_author_role_created' ) ) {
			\add_role( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.custom_role_add_role
				self::ROLE,
				__( 'Guest Author', 'co-authors-plus' ),
				[
					'read' => true,
					\apply_filters( 'coauthors_edit_author_cap', 'edit_posts' ) => true, // Make sure CAP considers this a role that can author posts.
				]
			);
			\update_option( 'guest_author_role_created', true );
		}
	}

	/**
	 * Filters user validation to allow empty emails for guest authors
	 *
	 * When creating a new user, also automatically generate a username from the display name.
	 *
	 * @param WP_Error $errors WP_Error object (passed by reference).
	 * @param bool     $update Whether this is a user update.
	 * @param stdClass $user   User object (passed by reference).
	 * @return WP_Error
	 */
	public static function user_profile_update_errors( $errors, $update, $user ) {

		if ( self::ROLE !== $user->role ) {
			return $errors;
		}

		if ( ! empty( $errors->errors['empty_email'] ) ) {
			$errors->remove( 'empty_email' );
		}

		if ( ! empty( $errors->errors['user_login'] ) ) {
			$errors->remove( 'user_login' );
		}

		// We still don't want users with duplicate emails.
		if ( ! empty( $errors->errors['email_exists'] ) ) {
			return $errors;
		}

		if ( ! $update ) {
			// For guest authors, the form is modified via JS and we get the display name in the username field.
			$user->display_name = $user->user_login;

			// Create user name from Display name.
			$user->user_login = self::generate_username( $user->display_name );
		}

		return $errors;
	}

	/**
	 * Generates a unique username from a display name.
	 *
	 * @param string $display_name The user's display name.
	 * @return string
	 */
	public static function generate_username( $display_name ) {
		$username = \sanitize_user( $display_name, true );
		$username = \sanitize_title( $username );

		while ( \username_exists( $username ) ) {
			$username = $username . '-' . \wp_rand( 1, 100 );
		}

		return $username;
	}

	/**
	 * Enqueues the JS that modifies the user profile and user creation forms.
	 *
	 * @return void
	 */
	public static function admin_footer() {
		global $pagenow;
		\wp_enqueue_script(
			'newspack-co-authors-plus',
			Newspack::plugin_url() . 'dist/other-scripts/co-authors-plus.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'newspack-co-authors-plus',
			'guestAuthorRole',
			[
				'role'             => self::ROLE,
				'displayNameLabel' => __( 'Display name', 'co-authors-plus' ),
				'screen'           => $pagenow === 'user-new.php' ? 'new' : 'edit',
			]
		);
	}

	/**
	 * A generic callback applied to filters that check if a user has access to a feature, or if a certain field should be displayed in its profile.
	 *
	 * These callbacks pass the return of the check as the first argument ant the user or user ID as the second.
	 *
	 * @param bool        $result The result of the check.
	 * @param int|WP_User $user A user ID or user object.
	 * @return bool
	 */
	public static function disable_feature( $result, $user ) {
		if ( is_int( $user ) ) {
			$user = \get_user_by( 'id', $user );
		}

		if ( ! is_a( $user, 'WP_User' ) ) {
			return $result;
		}

		if ( in_array( self::ROLE, $user->roles, true ) ) {
			return false;
		}

		return $result;
	}

	/**
	 * Filters user authentication to prevent guest authors from logging in.
	 *
	 * @param WP_Error|WP_User $user The logged in user or login error.
	 * @param string           $password The user's password.
	 * @return WP_Error|WP_User
	 */
	public static function wp_authenticate_user( $user, $password ) {
		if ( ! is_a( $user, 'WP_User' ) ) {
			return $user;
		}

		if ( in_array( self::ROLE, $user->roles, true ) ) {
			return new WP_Error( 'guest_authors_cannot_login', __( 'Guest authors cannot login.', 'co-authors-plus' ) );
		}

		return $user;
	}
}

Co_Authors_Plus::init();
