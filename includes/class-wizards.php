<?php
/**
 * Newspack Wizards manager.
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the wizards.
 */
class Wizards {

	/**
	 * Information about all of the wizards.
	 * See `init` for structure of the data.
	 *
	 * @var array
	 */
	protected static $wizards = [];

	/**
	 * Initialize and register all of the wizards.
	 */
	public static function init() {
		$wizards = [
			new Setup_Wizard(),
			new Dashboard(),
			new Site_Design_Wizard(),
			new Reader_Revenue_Wizard(),
			new Advertising_Wizard(),
			new Syndication_Wizard(),
			new Analytics_Wizard(),
			new Components_Demo(),
			new SEO_Wizard(),
			new Health_Check_Wizard(),
			new Engagement_Wizard(),
			new Popups_Wizard(),
			new Connections_Wizard(),
			new Settings(),
		];
		foreach ( $wizards as $wizard ) {
			self::$wizards[ $wizard->slug ] = $wizard;
		}
		add_action( 'admin_init', [ __CLASS__, 'assign_custom_caps' ] );
		add_filter( 'user_has_cap', [ __CLASS__, 'user_has_cap' ], 10, 4 );
		add_filter( 'cme_plugin_capabilities', [ __CLASS__, 'cme_plugin_capabilities' ] );
	}

	/**
	 * Assign a custom capability to access this wizard.
	 *
	 * The capability will be assigned to the administrator role to make it
	 * available to be assigned to other roles. Capabilities cannot be created
	 * per se, only assigned to roles.
	 */
	public static function assign_custom_caps() {
		$has_assigned_custom_caps = get_option( 'newspack_wizard_assigned_custom_caps_v1', false );
		if ( $has_assigned_custom_caps ) {
			return;
		}
		$role = get_role( 'administrator' );
		foreach ( self::get_capabilities_list() as $cap ) {
			$role->add_cap( $cap );
		}
		update_option( 'newspack_wizard_assigned_custom_caps', true );
	}

	/**
	 * Get a list of all wizards' capabilities.
	 */
	private static function get_capabilities_list() {
		$caps = [];
		foreach ( self::$wizards as $key => $value ) {
			$caps[] = self::get_capability_name( $key );
		}
		return $caps;
	}

	/**
	 * Filter the capabilities list in the capability-manager-enhanced plugin.
	 *
	 * @param array $capabilities_list The list of capabilities tabs.
	 */
	public static function cme_plugin_capabilities( $capabilities_list ) {
		$official_caps                 = array_diff(
			self::get_capabilities_list(),
			[
				self::get_capability_name( 'newspack-setup-wizard' ),
				self::get_capability_name( 'newspack-components-demo-wizard' ),
				self::get_capability_name( 'newspack-settings-wizard' ),
			]
		);
		$capabilities_list['Newspack'] = $official_caps;
		return $capabilities_list;
	}

	/**
	 * Filter the user capabilities. This is to allow users to edit certain posts.
	 *
	 * @param array   $capabilities The user's capabilities.
	 * @param array   $required_capabilities The capabilities required perform an action.
	 * @param array   $args The arguments passed to the user_has_cap filter.
	 * @param WP_User $user The user object.
	 */
	public static function user_has_cap( $capabilities, $required_capabilities, $args, $user ) {
		if ( 3 === count( $args ) && 'edit_post' === $args[0] ) {
			$edited_post_id = $args[2];
			foreach ( apply_filters( 'newspack_editable_posts', [] ) as $post_id ) {
				if ( $post_id === $edited_post_id ) {
					// Allow the user to publish this kind of posts.
					$publish_cap = 'publish_' . get_post_type( $post_id ) . 's';
					if ( ! user_can( $user, $publish_cap ) ) {
						$role = get_role( array_values( $user->roles )[0] );
						$role->add_cap( $publish_cap );
					}
					// Ensure all capabilities are set, so the user can edit and publish this post.
					foreach ( $required_capabilities as $cap ) {
						$capabilities[ $cap ] = true;
					}
				}
			}
		}
		return $capabilities;
	}

	/**
	 * Get a wizard's capability.
	 *
	 * @param string $slug The wizard to get. Use slug from self::$wizards.
	 */
	private static function get_capability_name( $slug ) {
		return 'newspack_wizard_' . $slug;
	}

	/**
	 * Get a wizard's object.
	 *
	 * @param string $wizard_slug The wizard to get. Use slug from self::$wizards.
	 * @return Wizard | bool The wizard on success, false on failure.
	 */
	public static function get_wizard( $wizard_slug ) {
		if ( isset( self::$wizards[ $wizard_slug ] ) ) {
			return self::$wizards[ $wizard_slug ];
		}
		// The slug might be in the shortned form, e.g. 'seo' instead of 'newspack-seo-wizard'.
		$slug = 'newspack-' . $wizard_slug . '-wizard';
		if ( isset( self::$wizards[ $slug ] ) ) {
			return self::$wizards[ $slug ];
		}
		return false;
	}

	/**
	 * Get a wizard's URL.
	 *
	 * @param string $wizard_slug The wizard to get URL for. Use slug from self::$wizards.
	 * @return string | bool The URL on success, false on failure.
	 */
	public static function get_url( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->get_url();
		}
		return false;
	}

	/**
	 * Get all the URLs for all the wizards.
	 *
	 * @return array of slug => URL pairs.
	 */
	public static function get_urls() {
		$urls = [];
		foreach ( self::$wizards as $slug => $wizard ) {
			$urls[ $slug ] = $wizard->get_url();
		}
		return $urls;
	}

	/**
	 * Get a wizard's name.
	 *
	 * @param string $wizard_slug The wizard to get name for. Use slug from self::$wizards.
	 * @return string | bool The name on success, false on failure.
	 */
	public static function get_name( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->get_name();
		}
		return false;
	}

	/**
	 * Can this wizard be accessed by the current user?
	 *
	 * @param string $wizard_slug The wizard to get name for. Use slug from self::$wizards.
	 * @return bool Whether the wizard can be accessed by the current user.
	 */
	public static function can_access_wizard( $wizard_slug ) {
		if ( ! function_exists( 'wp_get_current_user' ) ) {
			return false;
		}
		if ( current_user_can( 'manage_options' ) ) {
			return true; // Always allow admins.
		}
		if ( 'newspack' === $wizard_slug ) {
			// Dashboard is accessible if at least one dashboard element is accessible.
			$slugs = array_keys( self::$wizards );
			foreach ( $slugs as $slug ) {
				if ( current_user_can( self::get_capability_name( $slug ) ) ) {
					return true;
				}
			}
		}
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return current_user_can( self::get_capability_name( $wizard->slug ) );
		}
		return false;
	}

	/**
	 * Get whether a wizard is completed.
	 *
	 * @param string $wizard_slug The wizard to get completion for. Use slug from self::$wizards.
	 * @return bool True if completed. False otherwise.
	 */
	public static function is_completed( $wizard_slug ) {
		$wizard = self::get_wizard( $wizard_slug );
		if ( $wizard ) {
			return $wizard->is_completed();
		}
		return false;
	}
}
Wizards::init();
