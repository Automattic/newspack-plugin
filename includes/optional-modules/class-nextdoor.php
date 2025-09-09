<?php
/**
 * Nextdoor integration for Newspack.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Nextdoor integration class.
 */
class Nextdoor {

	/**
	 * The single instance of the class.
	 *
	 * @var Nextdoor
	 */
	protected static $instance = null;

	/**
	 * Main Nextdoor Instance.
	 * Ensures only one instance of Nextdoor is loaded or can be loaded.
	 *
	 * @return Nextdoor - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Initialize the class.
	 */
	public static function init() {
		// Only initialize if the module is active.
		if ( ! Optional_Modules::is_optional_module_active( 'nextdoor' ) ) {
			return;
		}

		// Add custom capability.
		add_action( 'admin_init', [ __CLASS__, 'add_nextdoor_capability' ] );

		// Include required files.
		require_once NEWSPACK_ABSPATH . 'includes/optional-modules/nextdoor/class-api.php';
		require_once NEWSPACK_ABSPATH . 'includes/optional-modules/nextdoor/class-auth.php';
		require_once NEWSPACK_ABSPATH . 'includes/optional-modules/nextdoor/class-settings.php';
	}

	/**
	 * Add custom Nextdoor capability to appropriate roles.
	 */
	public static function add_nextdoor_capability() {
		$roles_with_cap = self::get_nextdoor_capability_roles();

		foreach ( $roles_with_cap as $role_name ) {
			$role = get_role( $role_name );
			if ( $role && ! $role->has_cap( 'np_nextdoor_publish_posts' ) ) {
				$role->add_cap( 'np_nextdoor_publish_posts' );
			}
		}
	}

	/**
	 * Get roles that have Nextdoor publishing capability.
	 *
	 * @return array
	 */
	public static function get_nextdoor_capability_roles() {
		$settings       = self::get_settings();
		$roles_with_cap = isset( $settings['allowed_roles'] ) ? $settings['allowed_roles'] : [ 'administrator' ];

		/**
		 * Filter for roles that should have Nextdoor capabilities.
		 *
		 * @param array $roles_with_cap Array of role names.
		 */
		$roles_with_cap = apply_filters( 'newspack_nextdoor_publish_cap_roles', $roles_with_cap );

		// Ensure administrator always has capability.
		if ( ! in_array( 'administrator', $roles_with_cap, true ) ) {
			$roles_with_cap[] = 'administrator';
		}

		return $roles_with_cap;
	}

	/**
	 * Get Nextdoor settings.
	 *
	 * @return array
	 */
	public static function get_settings() {
		return get_option( 'newspack_nextdoor_settings', [] );
	}

	/**
	 * Update Nextdoor settings.
	 *
	 * @param array $settings Settings array.
	 * @return bool
	 */
	public static function update_settings( $settings ) {
		return update_option( 'newspack_nextdoor_settings', $settings );
	}

	/**
	 * Check if user can publish to Nextdoor.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	public static function can_user_publish( $user_id = null ) {
		if ( ! $user_id ) {
			$user_id = get_current_user_id();
		}

		return user_can( $user_id, 'np_nextdoor_publish_posts' ); // phpcs:ignore WordPress.WP.Capabilities.Unknown
	}

	/**
	 * Check if Nextdoor is connected.
	 *
	 * @return bool
	 */
	public static function is_connected() {
		$settings = self::get_settings();
		return ! empty( $settings['access_token'] ) && ! empty( $settings['page_id'] );
	}

	/**
	 * Get available WordPress roles for Nextdoor publishing.
	 *
	 * @return array Array of role data with label and value.
	 */
	public static function get_available_roles() {
		$wp_roles = wp_roles();
		$roles = [];

		foreach ( $wp_roles->roles as $role_name => $role_info ) {
			$roles[] = [
				'label' => translate_user_role( $role_info['name'], 'newspack-plugin' ),
				'value' => $role_name,
			];
		}

		return $roles;
	}
}

Nextdoor::init();
