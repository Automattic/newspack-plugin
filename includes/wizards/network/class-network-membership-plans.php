<?php
/**
 * Network Membership Plans Wizard
 *
 * @package Newspack
 */

namespace Newspack;

use Newspack\Wizards\Traits\Admin_Header;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Membership_Plans extends Wizard {

	use Admin_Header;

	const PAGE_TITLE = 'Network / Membership Plans';

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network-membership-plans';

	/**
	 * Constructor.
	 */
	public function __construct() {
		
		if ( ! is_plugin_active( 'newspack-network/newspack-network.php' ) ) {
			return;
		}

		if ( false == $this->is_wizard_page() ) {
			return;
		}

		// Override parent hooks.
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );

		// Enqueue Wizards Admin Header.
		$this->admin_header_init(
			[
				'tabs'  => [], 
				'title' => $this->get_name(), 
			]
		);
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
	 * Load up common JS/CSS for wizards.
	 */
	public function enqueue_scripts_and_styles() {
		
		if ( false == $this->is_wizard_page() ) return;
		
		Newspack::load_common_assets();

	}

}
