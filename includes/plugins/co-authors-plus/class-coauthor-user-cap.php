<?php
/**
 * Co-Authors Plus integration class.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * This class creates a new capability and adds it to all roles that have the edit_posts capability
 *
 * Then it filters the capability used by Co-Authors Plus to determine which users can be assigned as co-authors.
 */
class Coauthor_User_Cap {

	/**
	 * Custom capability name.
	 */
	const ASSIGNABLE_TO_POSTS_CAPABILITY_NAME = 'edit_cap_posts';

	/**
	 * Option name to mark the version of the settings. If the implementation details
	 * change, the expected option value should be updated to trigger a reset of the settings.
	 */
	const SETTINGS_VERSION_OPTION_NAME = 'newsroomnz_coauthors_plus_tweaks_settings_version';

	/**
	 * Initializes the class.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'coauthors_edit_author_cap', [ __CLASS__, 'coauthors_edit_author_cap' ] );
		add_action( 'admin_init', [ __CLASS__, 'setup_custom_capability' ] );
	}

	/**
	 * Override the capability required to assign a user as a co-author.
	 *
	 * @param string $edit_cap Capability required for a user to be assigned as a co-author.
	 */
	public static function coauthors_edit_author_cap( $edit_cap ) {
		return self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME;
	}

	/**
	 * Add custom capability to the roles that should be allowed to author posts.
	 */
	public static function setup_custom_capability() {
		$current_settings_version = '1';
		if ( \get_option( self::SETTINGS_VERSION_OPTION_NAME ) === $current_settings_version ) {
			return;
		}

		$wp_roles = wp_roles();
		foreach ( $wp_roles->roles as $role_name => $role ) {
			$role = $wp_roles->get_role( $role_name );
			if ( $role->has_cap( 'edit_posts' ) || $role_name === Guest_Author_Role::CONTRIBUTOR_NO_EDIT_ROLE_NAME ) {
				$role->add_cap( self::ASSIGNABLE_TO_POSTS_CAPABILITY_NAME );
			}
		}

		\update_option( self::SETTINGS_VERSION_OPTION_NAME, $current_settings_version );
	}
}

Coauthor_User_Cap::init();
