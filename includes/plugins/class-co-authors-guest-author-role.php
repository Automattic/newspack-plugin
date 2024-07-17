<?php
/**
 * Co-Authors Plus integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * This class implements a custom role called Guest Authors to be used instead of the regular CO-Authors Plus guest authors.
 */
class Co_Authors_Guest_Author_Role {
	/**
	 * Custom role name for users who are assignable as post authors but aren't allowed to edit posts.
	 *
	 * @var string
	 */
	const ROLE_NAME = 'guest_author';

	/**
	 * Option name to mark the version of the settings. If the implementation details
	 * change, the expected option value should be updated to trigger a reset of the settings.
	 */
	const SETTINGS_VERSION_OPTION_NAME = 'newspack_coauthors_guest_author_settings_version';

	/**
	 * Initialize hooks and filters.
	 */
	public static function init() {
		if ( defined( 'COAUTHORS_PLUS_VERSION' ) ) {

			if ( defined( 'NEWSPACK_DISABLE_CAP_GUEST_AUTHORS' ) && NEWSPACK_DISABLE_CAP_GUEST_AUTHORS ) {
				\add_filter( 'coauthors_guest_authors_enabled', '__return_false' );
				add_action( 'admin_menu', [ __CLASS__, 'guest_author_menu_replacement' ] );
			}

			// Register new role.
			\add_action( 'admin_init', [ __CLASS__, 'add_role' ] );

			// Do not allow guest authors to login.
			\add_filter( 'wp_authenticate_user', [ __CLASS__, 'wp_authenticate_user' ], 10, 2 );

			// Modify the user profile and user creation forms.
			\add_action( 'admin_footer', [ __CLASS__, 'admin_footer' ] );
			\add_filter( 'user_profile_update_errors', [ __CLASS__, 'user_profile_update_errors' ], 10, 3 );
			\add_action( 'admin_print_scripts-user-new.php', [ __CLASS__, 'admin_footer' ] );
			\add_action( 'admin_print_scripts-user-edit.php', [ __CLASS__, 'admin_footer' ] );

			// Disable some features from the user profile.
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

		$current_settings_version = '2';

		if ( \get_option( self::SETTINGS_VERSION_OPTION_NAME ) === $current_settings_version ) {
			return;
		}

		\remove_role( self::ROLE_NAME );

		\add_role( // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.custom_role_add_role
			self::ROLE_NAME,
			__( 'Guest Author', 'newspack-plugin' ),
			[
				'read' => true,
				Co_Authors_Plus::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME => true,
			]
		);

		\update_option( self::SETTINGS_VERSION_OPTION_NAME, $current_settings_version );
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

		if ( self::ROLE_NAME !== $user->role ) {
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
			Newspack::plugin_url() . '/dist/other-scripts/co-authors-plus.js',
			[ 'jquery' ],
			NEWSPACK_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'newspack-co-authors-plus',
			'guestAuthorRole',
			[
				'role'             => self::ROLE_NAME,
				'displayNameLabel' => __( 'Display name', 'newspack-plugin' ),
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

		if ( in_array( self::ROLE_NAME, $user->roles, true ) ) {
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

		if ( in_array( self::ROLE_NAME, $user->roles, true ) ) {
			return new WP_Error( 'guest_authors_cannot_login', __( 'Guest authors cannot login.', 'newspack-plugin' ) );
		}

		return $user;
	}

	/**
	 * Adds a replacement Guest Authors menu item.
	 */
	public static function guest_author_menu_replacement() {
		add_submenu_page(
			'users.php',
			__( 'Guest Authors', 'newspack-plugin' ),
			__( 'Guest Authors', 'newspack-plugin' ),
			'list_users',
			'newspack-view-guest-authors',
			[ __CLASS__, 'render_guest_authors_replacement_page' ]
		);
	}

	/**
	 * Render the replacement Guest Authors page.
	 */
	public static function render_guest_authors_replacement_page() {
		?>
			<div class="wrap">
				<h1><?php echo esc_html__( 'Guest Authors', 'newspack-plugin' ); ?></h1>

				<p><?php echo esc_html__( "Co-Authors-Plus' Guest Authors are disabled in this site. Use the Guest Author user role instead.", 'newspack-plugin' ); ?></p>
				<p><?php echo esc_html__( 'You can use one of the shortcuts below:', 'newspack-plugin' ); ?></p>

				<a href="<?php echo esc_url( admin_url( 'user-new.php?role=' . self::ROLE_NAME ) ); ?>" class="page-title-action"><?php echo esc_html__( 'Add new Guest Author', 'newspack-plugin' ); ?></a>
				<a href="<?php echo esc_url( admin_url( 'users.php?role=' . self::ROLE_NAME ) ); ?>" class="page-title-action"><?php echo esc_html__( 'View all Guest Authors', 'newspack-plugin' ); ?></a>
			</div>
		<?php
	}
}

Co_Authors_Guest_Author_Role::init();
