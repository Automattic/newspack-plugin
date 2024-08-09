<?php
/**
 * Newspack's Advertising Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Easy interface for setting up general store info.
 */
class Advertising_Sponsors extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'advertising-sponsors';


	/**
	 * Parent Wizard slug
	 *
	 * @var string
	 */
	protected $parent_slug = 'advertising-display-ads';

	/**
	 * The capability required to access this wizard.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return \esc_html__( 'Sponsors', 'newspack-plugin' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page(
			$this->parent_slug,
			__( 'Advertising / Sponsors', 'newspack-plugin' ),
			__( 'Sponsors', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			array( $this, 'render_wizard' )
		);
	}
}
