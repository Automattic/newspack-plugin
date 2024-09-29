<?php
/**
 * Network Subscriptions Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Easy interface for setting up info.
 */
class Network_Subscriptions extends Wizard {

	use \Newspack\Wizards\Traits\Admin_Header;

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-network-subscriptions';

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

		$this->admin_header_init( [ 'title' => $this->get_name() ] );
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Network / Subscriptions', 'newspack-plugin' );
	}
}
