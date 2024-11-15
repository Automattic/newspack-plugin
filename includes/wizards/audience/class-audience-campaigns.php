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

		$preview_post = '';
		if ( method_exists( 'Newspack_Popups', 'preview_post_permalink' ) ) {
			$preview_post = \Newspack_Popups::preview_post_permalink();
		}

		$preview_archive = '';
		if ( method_exists( 'Newspack_Popups', 'preview_archive_permalink' ) ) {
			$preview_archive = \Newspack_Popups::preview_archive_permalink();
		}

		$criteria = [];
		if ( method_exists( 'Newspack_Popups_Criteria', 'get_registered_criteria' ) ) {
			$criteria = \Newspack_Popups_Criteria::get_registered_criteria();
		}

		$newspack_popups_configuration_manager = Configuration_Managers::configuration_manager_class_for_plugin_slug( 'newspack-popups' );
		$custom_placements                     = $newspack_popups_configuration_manager->get_custom_placements();
		$overlay_placements                    = $newspack_popups_configuration_manager->get_overlay_placements();
		$overlay_sizes                         = $newspack_popups_configuration_manager->get_overlay_sizes();
		$preview_query_keys                    = $newspack_popups_configuration_manager->preview_query_keys();

		wp_enqueue_script( 'newspack-wizards' );

		\wp_localize_script(
			'newspack-wizards',
			'newspackAudienceCampaigns',
			[
				'preview_post'       => $preview_post,
				'preview_archive'    => $preview_archive,
				'frontend_url'       => get_site_url(),
				'custom_placements'  => $custom_placements,
				'overlay_placements' => $overlay_placements,
				'overlay_sizes'      => $overlay_sizes,
				'preview_query_keys' => $preview_query_keys,
				'experimental'       => Reader_Activation::is_enabled(),
				'criteria'           => $criteria,
			]
		);
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
