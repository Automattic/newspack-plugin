<?php
/**
 * Network Wizard Utils
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Shared properties and methods for Network Wizards
 */
class Network_Utils {

    /**
     * Parent Menu Position
     *
     * @var string
     */
    static $parent_menu_position = '3.9';
	
    /**
     * Parent Menu Position Increment
     *
     * @var string
     */
    static $parent_menu_position_increment = '9';

	/**
	 * Parent Menu Slug
	 * 
	 * @var string
	 */
    static $parent_menu_slug = 'newspack-network';

	/**
	 * Parent Menu Title
	 * 
	 * @var string
	 */
    static $parent_menu_title = 'Network';

	/**
	 * Get Parent Menu Icon
	 *
	 * @return string
	 */
	public static function get_parent_menu_icon(): string {
        // @todo fix blue tint / ronchambers
        return 'data:image/svg+xml;base64,' . base64_encode( '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="1.5"/><path d="M12 4.36719C9.97145 5.3866 8.5 8.41883 8.5 12.0009C8.5 15.6603 10.0356 18.7459 12.1321 19.6979" stroke="white" stroke-width="1.5"/><path d="M12 4.3653C14.0286 5.38471 15.5 8.41694 15.5 11.9991C15.5 15.5812 14.0286 18.6134 12 19.6328" stroke="white" stroke-width="1.5"/><line x1="20" y1="14.5" x2="4" y2="14.5" stroke="white" stroke-width="1.5"/><line x1="4" y1="9.5" x2="20" y2="9.5" stroke="white" stroke-width="1.5"/></svg>' );
	}

	/**
	 * Get Parent Menu Slug
	 *
	 * @return string
	 */
	public static function get_parent_menu_slug(): string {
        return 'edit.php?post_type=newspack_hub_nodes';
	}

	/**
	 * Check if site role is not set.
	 * 
	 * @return bool
	 */
	public static function has_site_role(): bool {
		return ( self::is_hub() || self::is_node() );
	}

	/**
	 * Check if site role is hub.
	 * 
	 * @return bool
	 */
	public static function is_hub(): bool {
		$fn = [ '\Newspack_Network\Site_Role', 'is_hub' ];
		if( is_callable( $fn ) ) {
			return call_user_func( $fn );
		}
		return false;
	}

	/**
	 * Check if site role is node.
	 * 
	 * @return bool
	 */
	public static function is_node(): bool {
		$fn = [ '\Newspack_Network\Site_Role', 'is_node' ];
		if( is_callable( $fn ) ) {
			return call_user_func( $fn );
		}
		return false;
	}

	public static function move_network_menu() {

		global $menu;
		
		// Pluck the Newspack Network menu item from the list.
		$item = (function() use( &$menu ) {
			foreach ( $menu as $key => $value) {
				if ( $value[2] == self::$parent_menu_slug ) {
					unset( $menu[$key] );
					return $value;
				}
			}
		})();

		// Adjust values.
		$item[0] = self::$parent_menu_title;
		$item[6] = Network_Utils::get_parent_menu_icon();
		
		// add it back at (string) postion 
		$new_index = (string) Network_Utils::$parent_menu_position;

		// if key collision found, keep increasing increments.
		while( array_key_exists( $new_index, $menu ) ) {
			$new_index .= (string) Network_Utils::$parent_menu_position_increment;
		}

		// Add to menu.
		$menu[$new_index] = $item;

	}

}
