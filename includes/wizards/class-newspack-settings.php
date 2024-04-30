<?php
/**
 * Newspack Settings Admin Page
 *
 * @package Newspack
 */

namespace Newspack;

defined( 'ABSPATH' ) || exit;

require_once NEWSPACK_ABSPATH . '/includes/wizards/class-wizard.php';

/**
 * Common functionality for admin wizards. Override this class.
 */
class Newspack_Settings extends Wizard {

	/**
	 * The slug of this wizard.
	 *
	 * @var string
	 */
	protected $slug = 'newspack-settings';

	/**
	 * The capability required to access this.
	 *
	 * @var string
	 */
	protected $capability = 'manage_options';

	/**
	 * Priority setting for ordering admin submenu items. Dashboard must come first.
	 *
	 * @var int.
	 */
	protected $menu_priority = 1;

	/**
	 * Initialize.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'add_page' ], 1 );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts_and_styles' ] );
	}

	/**
	 * Get Dashboard data
	 *
	 * @return [] 
	 */
	public function get_local_data() {
		return [];
	}

	/**
	 * Get the name for this wizard.
	 *
	 * @return string The wizard name.
	 */
	public function get_name() {
		return esc_html__( 'Newspack', 'newspack' );
	}

	/**
	 * Add an admin page for the wizard to live on.
	 */
	public function add_page() {
		add_submenu_page(
			'newspack-dashboard',
			__( 'Newspack / Settings', 'newspack-plugin' ),
			__( 'Settings', 'newspack-plugin' ),
			$this->capability,
			$this->slug,
			[ $this, 'render_wizard' ]
		);
	}

	/**
	 * Load up JS/CSS.
	 */
	public function enqueue_scripts_and_styles() {
		parent::enqueue_scripts_and_styles();

		if ( filter_input( INPUT_GET, 'page', FILTER_SANITIZE_FULL_SPECIAL_CHARS ) !== $this->slug ) {
			return;
		}

		/**
		 * JavaScript
		 */
		wp_register_script(
			$this->slug,
			Newspack::plugin_url() . '/dist/wizards.js',
			$this->get_script_dependencies(),
			NEWSPACK_PLUGIN_VERSION,
			true
		);
		wp_localize_script(
			$this->slug, 
			'newspackSettings',
			[
				'sections' => [
					'connections'       => [
						'label'       => __( 'Connections', 'newspack-plugin' ),
						'path'        => '/',
						'isAvailable' => [
							'google'   => OAuth::is_proxy_configured( 'google' ),
							'fivetran' => OAuth::is_proxy_configured( 'fivetran' ),
							'webhooks' => defined( 'NEWSPACK_EXPERIMENTAL_WEBHOOKS' ) && NEWSPACK_EXPERIMENTAL_WEBHOOKS,
						],
					],
					'emails'            => [
						'label' => __( 'Emails', 'newspack-plugin' ),
					],
					'social'            => [
						'label' => __( 'Social', 'newspack-plugin' ),
					],
					'syndication'       => [
						'label' => __( 'Syndication', 'newspack-plugin' ),
					],
					'seo'               => [
						'label' => __( 'SEO', 'newspack-plugin' ),
					],
					'theme-and-brand'   => [
						'label' => __( 'Theme and Brand', 'newspack-plugin' ),
					],
					'display-settings'  => [
						'label' => __( 'Display Settings', 'newspack-plugin' ),
					],
					'additional-brands' => [
						'label' => __( 'Additional Brands', 'newspack-plugin' ),
					],
				],
			]
		);
		wp_enqueue_script( $this->slug );
	}
}
