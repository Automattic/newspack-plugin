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
	 * Get Menu Icon
	 *
	 * @return string
	 */
	public static function get_menu_icon(): string {
        // @todo fix blue tint / ronchambers
        return 'data:image/svg+xml;base64,' . base64_encode( '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="8" stroke="white" stroke-width="1.5"/><path d="M12 4.36719C9.97145 5.3866 8.5 8.41883 8.5 12.0009C8.5 15.6603 10.0356 18.7459 12.1321 19.6979" stroke="white" stroke-width="1.5"/><path d="M12 4.3653C14.0286 5.38471 15.5 8.41694 15.5 11.9991C15.5 15.5812 14.0286 18.6134 12 19.6328" stroke="white" stroke-width="1.5"/><line x1="20" y1="14.5" x2="4" y2="14.5" stroke="white" stroke-width="1.5"/><line x1="4" y1="9.5" x2="20" y2="9.5" stroke="white" stroke-width="1.5"/></svg>' );
	}

    /**
     * Get Menu Parent Position
     * 
     * @return string
     */
    public static function get_menu_position(): string {
        return '3.9';
    }

}
