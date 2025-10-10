<?php
/**
 * Audience Integrations Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Integrations Wizard.
 */
class Audience_Integrations extends Wizard {
	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-audience-integrations';

	/**
	 * Parent slug.
	 *
	 * @var string
	 */
	protected $parent_slug = 'newspack-audience';

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Audience Management / Integrations', 'newspack-plugin' );
	}

	/**
	 * Add submenu page to the Audience menu.
	 */
	public function add_page() {
		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Integrations', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
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
}
