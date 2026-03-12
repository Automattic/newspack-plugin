<?php
/**
 * Inbox Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Inbox page.
 */
class Inbox extends Wizard {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-inbox';

	/**
	 * Priority for when 'admin_menu' fires.
	 *
	 * @var int
	 */
	protected $admin_menu_priority = 1;

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Inbox', 'newspack-plugin' );
	}

	/**
	 * Add a top-level Inbox menu page.
	 */
	public function add_page() {
		add_menu_page(
			$this->get_name(),
			$this->get_name(),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ],
			'dashicons-email'
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
