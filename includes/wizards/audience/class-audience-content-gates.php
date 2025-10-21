<?php
/**
 * Audience Content Gates Wizard
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

/**
 * Audience Campaigns Wizard.
 */
class Audience_Content_Gates extends Wizard {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-audience-content-gates';

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
		add_action( 'rest_api_init', [ $this, 'register_api_endpoints' ] );
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Audience Management / Content Gates', 'newspack-plugin' );
	}

	/**
	 * Enqueue scripts and styles.
	 */
	public function enqueue_scripts_and_styles() {
		if ( ! $this->is_wizard_page() || ! $this->is_feature_enabled() ) {
			return;
		}

		parent::enqueue_scripts_and_styles();

		wp_enqueue_script( 'newspack-wizards' );

		\wp_localize_script(
			'newspack-wizards',
			'newspackAudienceContentGates',
			[
				'api' => '/' . NEWSPACK_API_NAMESPACE . '/wizard/' . $this->slug,
			]
		);
	}

	/**
	 * Add Audience top-level and Content Gate subpage to the /wp-admin menu.
	 */
	public function add_page() {
		if ( ! $this->is_feature_enabled() ) {
			return;
		}

		add_submenu_page(
			$this->parent_slug,
			$this->get_name(),
			esc_html__( 'Content Gates', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Register the endpoints needed for the wizard screens.
	 */
	public function register_api_endpoints() {
		if ( ! $this->is_feature_enabled() ) {
			return;
		}
	}

	/**
	 * Check feature flag status.
	 *
	 * @return bool
	 */
	public function is_feature_enabled() {
		return defined( 'NEWSPACK_CONTENT_GATES' ) && NEWSPACK_CONTENT_GATES;
	}
}
