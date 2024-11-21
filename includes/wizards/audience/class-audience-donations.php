<?php
/**
 * Audience Donations Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Donations Wizard.
 */
class Audience_Donations extends Wizard {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-audience-donations';

	/**
	 * Parent slug.
	 *
	 * @var string
	 */
	protected $parent_slug = 'newspack-audience';

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Audience Development / Donations', 'newspack-plugin' );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() ) {
			return;
		}

		parent::enqueue_scripts_and_styles();
		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}
		\wp_enqueue_media();
		\wp_localize_script(
			'newspack-wizards',
			'newspackAudienceDonations',
			[
				'emails'                  => Emails::get_emails( [ Reader_Revenue_Emails::EMAIL_TYPES['RECEIPT'] ], false ),
				'email_cpt'               => Emails::POST_TYPE,
				'salesforce_redirect_url' => Salesforce::get_redirect_url(),
				'can_use_name_your_price' => Donations::can_use_name_your_price(),
			]
		);
		wp_enqueue_script( 'newspack-wizards' );
	}

	/**
	 * Add Audience top-level and Campaigns subpage to the /wp-admin menu.
	 */
	public function add_page() {
		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Donations', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}
}
