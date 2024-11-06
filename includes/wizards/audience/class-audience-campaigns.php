<?php
/**
 * Audience Campaigns Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Campaigns Wizard.
 */
class Audience_Campaigns extends Wizard {

	/**
	 * Admin page slug.
	 * 
	 * @var string
	 */
	protected $slug = 'newspack-audience-campaigns';

	/**
	 * Parent slug.
	 * 
	 * @var string
	 */
	protected $parent_slug = 'newspack-audience-configuration';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Audience Development / Campaigns', 'newspack-plugin' );
	}   

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		parent::enqueue_scripts_and_styles();

		wp_enqueue_script( 'newspack-wizards' );
	}

	/**
	 * Add Audience top-level and Campaigns subpage to the /wp-admin menu.
	 */
	public function add_page() {
		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Campaigns', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}
}
