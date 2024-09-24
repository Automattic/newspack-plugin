<?php
/**
 * Network Event Log Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Event_Log extends Wizard {

	use Admin_Header;

	protected $slug = 'admin.php?page=newspack-network-event-log';
	
	const PAGE_TITLE = 'Network / Event Log';
	const MENU_TITLE = 'Event Log';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		// Include Network Utils
		include_once 'class-network-utils.php';

		// @todo: can more of these hooks be moved into if( is_wizard_page() )??

		// review what needs to load or not on each page...

		add_action( 'admin_menu', [ $this, 'add_page' ] );
		// add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
        // add_filter( 'admin_body_class', [ $this, 'add_body_class' ] );

		// if ( $this->is_wizard_page() ) {
		// 	// Enqueue Wizards Admin Tabs script.
		// 	$this->admin_header_init(
		// 		[
		// 			'tabs'  => [], 
		// 			'title' => $this->get_name(), 
		// 		]
		// 	);
		// }
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( static::PAGE_TITLE, 'newspack-plugin' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {

		add_submenu_page(
			Network_Utils::get_parent_menu_slug(),
			__( static::PAGE_TITLE, 'newspack-plugin' ),
			__( static::MENU_TITLE, 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			// array( $this, 'render_wizard' )
		);

    }
}
